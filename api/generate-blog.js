// api/generate-blog.js — AI blog draft generator (Anthropic Claude API).
// Password-gated (CRM_PASSWORD). Returns a structured JSON draft; does NOT publish.
// Env: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL (optional, default claude-opus-4-8),
//      CRM_PASSWORD (shared with the CRM).

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const CRM_PASS = process.env.CRM_PASSWORD || 'marketcredo2024';
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
  if (!API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const body = req.body || {};
  if (String(body.password || '') !== CRM_PASS) return res.status(401).json({ error: 'Invalid password' });

  const topic = String(body.topic || '').trim().slice(0, 200);
  const keywords = String(body.keywords || '').trim().slice(0, 300);
  if (!topic) return res.status(400).json({ error: 'topic required' });

  const system = [
    'You are a content writer for Market Credo, a SEBI-registered technical analysis institute in',
    'Bhopal (trainer: Atish Shakergaye, SEBI Reg. INH000006086, 20+ years experience).',
    'Write factual, SEBI-compliant educational content for Indian stock-market learners.',
    'NEVER promise guaranteed returns or profits; no buy/sell tips. Use Indian market context',
    '(NSE/BSE, Nifty, Bank Nifty, rupees, brokers like Zerodha/Groww).',
    'Follow an answer-first structure: a direct 2-3 sentence answer first, then question-style',
    'H2/H3 headings, each answered concisely right below. Output clean semantic HTML for the',
    'ARTICLE BODY ONLY (use <h2>,<h3>,<p>,<ul>,<li>,<strong>) — no <html>/<head>/<body>/<h1>.'
  ].join(' ');

  const userMsg = [
    `Write a blog post on: "${topic}".`,
    keywords ? `Target keywords: ${keywords}.` : '',
    'Requirements: 1200+ words; answer-first; question-format H2/H3 headings; practical Indian',
    'examples; naturally reference Market Credo courses / the free 2-day demo 2-3 times.',
    'Return fields per the schema. bodyHtml = the article body HTML only (no title, no TL;DR —',
    'those are separate fields). slug = lowercase-hyphenated, no spaces or special chars.'
  ].join(' ');

  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      slug: { type: 'string', description: 'lowercase hyphenated url slug, e.g. how-to-read-candlesticks' },
      metaDescription: { type: 'string', description: '150-160 characters, with a call to action' },
      tldr: { type: 'string', description: '2-3 sentence direct answer, plain text' },
      tags: { type: 'array', items: { type: 'string' } },
      keywords: { type: 'string', description: 'comma-separated keyword list' },
      readMinutes: { type: 'integer' },
      bodyHtml: { type: 'string', description: 'article body as HTML (h2/h3/p/ul/li/strong only)' }
    },
    required: ['title', 'slug', 'metaDescription', 'tldr', 'tags', 'keywords', 'readMinutes', 'bodyHtml'],
    additionalProperties: false
  };

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': String(API_KEY).trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        system,
        messages: [{ role: 'user', content: userMsg }],
        output_config: { format: { type: 'json_schema', schema } }
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'Anthropic API error', detail: data && data.error ? data.error : data });

    const textBlock = (data.content || []).find(b => b && b.type === 'text');
    if (!textBlock) return res.status(502).json({ error: 'No content returned from model' });

    let draft;
    try { draft = JSON.parse(textBlock.text); }
    catch (e) { return res.status(502).json({ error: 'Model returned invalid JSON', raw: String(textBlock.text).slice(0, 400) }); }

    // Normalise slug defensively.
    draft.slug = String(draft.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
    if (!draft.slug) return res.status(502).json({ error: 'Model did not produce a valid slug' });

    return res.status(200).json({ ok: true, draft, usage: data.usage || null, model: MODEL });
  } catch (e) {
    return res.status(500).json({ error: 'Generation failed', detail: e.message });
  }
};
