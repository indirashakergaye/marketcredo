// api/lead.js — lead + newsletter capture (Vercel serverless, Node).
//
// PRIMARY STORE (unchanged): appends to leads.json in the repo via GitHub API;
//   crm.html reads it back via GET ?password=... . This powers the existing CRM.
// ADDED (task 14/16): honeypot, per-IP rate limit, newsletter type, UTM + event_id,
//   and OPTIONAL fan-out sinks — Google Apps Script webhook, Resend email, Meta CAPI.
//   Each optional sink is skipped when its env vars are absent; a failing sink never
//   blocks the 200 response (the frontend keeps its WhatsApp fallback either way).
//
// Secrets via process.env only:
//   GH_TOKEN, GH_REPO, GH_BRANCH, CRM_PASSWORD            (existing CRM store)
//   APPS_SCRIPT_WEBHOOK_URL                                (optional Google Sheet)
//   RESEND_API_KEY, LEAD_NOTIFY_EMAIL, LEAD_FROM_EMAIL     (optional email notify)
//   META_PIXEL_ID, META_CAPI_TOKEN                         (optional Meta Conversions API)

const https = require('https');
const crypto = require('crypto');

function ghRequest(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + String(token).trim(),
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'MarketCredo-CRM',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, data: JSON.parse(text) }); }
        catch { resolve({ status: res.statusCode, data: text }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function readLeads(token, repo, branch) {
  const res = await ghRequest('GET', `/repos/${repo}/contents/leads.json?ref=${branch}`, token);
  if (res.status === 404) return { leads: [], sha: null };
  if (res.status !== 200) throw new Error('Read failed: ' + res.status);
  const content = Buffer.from(res.data.content, 'base64').toString('utf8');
  let leads = [];
  try { leads = JSON.parse(content); } catch (_) {}
  return { leads: Array.isArray(leads) ? leads : [], sha: res.data.sha };
}

function writeLeads(token, repo, branch, leads, sha, message) {
  const content = Buffer.from(JSON.stringify(leads, null, 2) + '\n').toString('base64');
  const body = {
    message: message || 'Update leads.json',
    content: content,
    branch: branch,
    ...(sha ? { sha: sha } : {})
  };
  return ghRequest('PUT', `/repos/${repo}/contents/leads.json`, token, body);
}

function clean(s, max) {
  return (s == null ? '' : String(s)).trim().slice(0, max);
}
const digits = (s) => String(s || '').replace(/\D/g, '');
const sha256 = (s) => crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');

// ---- best-effort per-instance rate limit (for hard limits use Upstash/Vercel KV) ----
const HITS = new Map();
function rateLimited(ip, max, windowMs) {
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > max;
}

function getCookie(req, name) {
  const c = req.headers.cookie || '';
  const m = c.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

// ---- optional fan-out sinks ----
async function toAppsScript(record) {
  const url = process.env.APPS_SCRIPT_WEBHOOK_URL;
  if (!url) return 'skipped';
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
  return r.ok ? 'ok' : 'http-' + r.status;
}
async function toResend(record) {
  const key = process.env.RESEND_API_KEY, to = process.env.LEAD_NOTIFY_EMAIL;
  if (!key || !to) return 'skipped';
  const from = process.env.LEAD_FROM_EMAIL || 'Market Credo <onboarding@resend.dev>';
  const text = Object.entries(record).map(([k, v]) => `${k}: ${v}`).join('\n');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: `New ${record.type} — ${record.name || record.email}`, text }),
  });
  return r.ok ? 'ok' : 'http-' + r.status;
}
async function toMetaCapi(req, record, eventId) {
  const pixel = process.env.META_PIXEL_ID, token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return 'skipped';
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ud = { client_user_agent: req.headers['user-agent'] || '' };
  const fbp = getCookie(req, '_fbp'); if (fbp) ud.fbp = fbp;
  const fbc = getCookie(req, '_fbc'); if (fbc) ud.fbc = fbc;
  if (ip) ud.client_ip_address = ip;
  if (record.phone) ud.ph = [sha256('91' + digits(record.phone).slice(-10))];
  if (record.email) ud.em = [sha256(record.email)];
  const body = { data: [{
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: 'https://www.marketcredo.in' + (record.page || '/'),
    user_data: ud,
    custom_data: { content_name: record.course || record.type, lead_source: record.source || '' },
  }] };
  const r = await fetch(`https://graph.facebook.com/v19.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.ok ? 'ok' : 'http-' + r.status;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const GH_TOKEN = process.env.GH_TOKEN;
  const REPO = process.env.GH_REPO || 'indirashakergaye/marketcredo';
  const BRANCH = process.env.GH_BRANCH || 'master';
  const CRM_PASS = process.env.CRM_PASSWORD || 'marketcredo2024';

  // ---- CRM read (unchanged) ----
  if (req.method === 'GET') {
    if (!GH_TOKEN) return res.status(500).json({ error: 'GH_TOKEN not configured' });
    const pw = (req.query && req.query.password) || '';
    if (pw !== CRM_PASS) return res.status(401).json({ error: 'Invalid password' });
    try {
      const { leads } = await readLeads(GH_TOKEN, REPO, BRANCH);
      return res.status(200).json({ ok: true, leads });
    } catch (err) {
      return res.status(500).json({ error: 'Read failed', detail: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ---- lead / newsletter capture ----
  const ip = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  if (rateLimited(ip, 5, 60_000)) return res.status(429).json({ error: 'Too many requests' });

  const body = req.body || {};

  // Honeypot: legit clients leave these empty.
  if (clean(body.company, 100) || clean(body.website, 100)) return res.status(200).json({ ok: true, dropped: true });

  const type = body.type === 'newsletter' ? 'newsletter' : 'lead';
  const name = clean(body.name, 100);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 120);

  if (type === 'lead' && (!name || digits(phone).length < 10)) {
    return res.status(400).json({ error: 'name and valid phone required' });
  }
  if (type === 'newsletter' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'valid email required' });
  }

  const eventId = clean(body.eid, 64) || crypto.randomUUID();
  const now = new Date().toISOString();
  const utm = {
    utm_source: clean(body.utm_source, 120),
    utm_medium: clean(body.utm_medium, 120),
    utm_campaign: clean(body.utm_campaign, 120),
    utm_term: clean(body.utm_term, 120),
    utm_content: clean(body.utm_content, 120),
  };

  const lead = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: type === 'newsletter' ? (name || '(newsletter)') : name,
    phone: phone,
    email: email,
    city: clean(body.city, 80),
    source: clean(body.source, 120) || 'Website Form',
    course: type === 'newsletter' ? 'Newsletter' : (clean(body.course, 120) || 'Not specified'),
    status: 'New',
    notes: clean(body.notes, 500),
    type: type,
    eventId: eventId,
    ...utm,
    page: clean(body.page, 200),
    followUpDate: '',
    createdAt: now,
    updatedAt: now,
    history: [{ date: now, action: 'Lead Created', detail: 'Via website form (' + type + ')' }]
  };

  // Primary store: leads.json (keeps CRM working). Retry on concurrent-write conflicts.
  let saved = false, lastErr = null;
  if (GH_TOKEN) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const { leads, sha } = await readLeads(GH_TOKEN, REPO, BRANCH);
        const putRes = await writeLeads(GH_TOKEN, REPO, BRANCH, [lead, ...leads], sha, 'New ' + type + ': ' + lead.name);
        if (putRes.status === 200 || putRes.status === 201) { saved = true; break; }
        lastErr = putRes.data;
        if (putRes.status !== 409 && putRes.status !== 422) break;
      } catch (e) { lastErr = e.message; }
    }
  } else {
    lastErr = 'GH_TOKEN not configured';
  }

  // Optional fan-out — never blocks the response.
  const settled = await Promise.allSettled([toAppsScript(lead), toResend(lead), toMetaCapi(req, lead, eventId)]);
  const warnings = {};
  ['appsScript', 'email', 'capi'].forEach((k, i) => {
    warnings[k] = settled[i].status === 'fulfilled' ? settled[i].value : 'error';
  });
  warnings.sheetStore = saved ? 'ok' : ('leads.json:' + (typeof lastErr === 'string' ? lastErr : 'failed'));

  // Return 200 as long as at least one sink accepted it, so the UX proceeds to thank-you.
  const anySink = saved || warnings.appsScript === 'ok';
  if (!anySink) return res.status(500).json({ ok: false, error: 'No storage sink succeeded', warnings, eventId });
  return res.status(200).json({ ok: true, id: lead.id, eventId, warnings });
};
