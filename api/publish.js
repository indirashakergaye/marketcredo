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

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { password, siteData } = req.body || {};
  const CRM_PASS = process.env.CRM_PASSWORD || 'marketcredo2024';
  if (password !== CRM_PASS) return res.status(401).json({ error: 'Invalid password' });
  if (!siteData) return res.status(400).json({ error: 'Missing siteData' });

  const GH_TOKEN = process.env.GH_TOKEN;
  const REPO = process.env.GH_REPO || 'indirashakergaye/marketcredo';
  const BRANCH = process.env.GH_BRANCH || 'master';

  if (!GH_TOKEN) return res.status(500).json({ error: 'GH_TOKEN not configured' });

  try {
    // Get current file SHA (needed for update)
    const getRes = await ghRequest('GET', `/repos/${REPO}/contents/site-data.json?ref=${BRANCH}`, GH_TOKEN);
    const sha = getRes.data && getRes.data.sha ? getRes.data.sha : null;

    // Commit updated site-data.json
    const content = Buffer.from(JSON.stringify(siteData, null, 2) + '\n').toString('base64');
    const commitBody = {
      message: 'Update site data via CRM',
      content: content,
      branch: BRANCH,
      ...(sha ? { sha: sha } : {})
    };

    const putRes = await ghRequest('PUT', `/repos/${REPO}/contents/site-data.json`, GH_TOKEN, commitBody);
    if (putRes.status !== 200 && putRes.status !== 201) {
      return res.status(500).json({ error: 'GitHub commit failed', detail: putRes.data });
    }

    // Trigger Vercel deploy via deploy hook (if configured)
    const DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK;
    if (DEPLOY_HOOK) {
      await new Promise((resolve) => {
        https.get(DEPLOY_HOOK, resolve).on('error', resolve);
      });
    }

    return res.status(200).json({ ok: true, message: 'Published! Site will update in ~15 seconds.' });
  } catch (err) {
    return res.status(500).json({ error: 'Publish failed', detail: err.message });
  }
};
