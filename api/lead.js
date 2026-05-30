const https = require('https');

function ghRequest(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const GH_TOKEN = process.env.GH_TOKEN;
  const REPO = process.env.GH_REPO || 'indirashakergaye/marketcredo';
  const BRANCH = process.env.GH_BRANCH || 'master';
  const CRM_PASS = process.env.CRM_PASSWORD || 'marketcredo2024';

  if (!GH_TOKEN) return res.status(500).json({ error: 'GH_TOKEN not configured' });

  if (req.method === 'GET') {
    const pw = (req.query && req.query.password) || '';
    if (pw !== CRM_PASS) return res.status(401).json({ error: 'Invalid password' });
    try {
      const { leads } = await readLeads(GH_TOKEN, REPO, BRANCH);
      return res.status(200).json({ ok: true, leads });
    } catch (err) {
      return res.status(500).json({ error: 'Read failed', detail: err.message });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const name = clean(body.name, 100);
    const phone = clean(body.phone, 30);
    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });

    const now = new Date().toISOString();
    const lead = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name,
      phone: phone,
      email: clean(body.email, 120),
      city: clean(body.city, 80),
      source: clean(body.source, 60) || 'Website Form',
      course: clean(body.course, 120) || 'Not specified',
      status: 'New',
      notes: clean(body.notes, 500),
      followUpDate: '',
      createdAt: now,
      updatedAt: now,
      history: [{ date: now, action: 'Lead Created', detail: 'Via website form' }]
    };

    let lastErr = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const { leads, sha } = await readLeads(GH_TOKEN, REPO, BRANCH);
        const updated = [lead, ...leads];
        const putRes = await writeLeads(GH_TOKEN, REPO, BRANCH, updated, sha, 'New lead: ' + name);
        if (putRes.status === 200 || putRes.status === 201) {
          return res.status(200).json({ ok: true, id: lead.id });
        }
        lastErr = putRes.data;
        if (putRes.status !== 409 && putRes.status !== 422) break;
      } catch (e) {
        lastErr = e.message;
      }
    }
    return res.status(500).json({ error: 'Lead save failed', detail: lastErr });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
