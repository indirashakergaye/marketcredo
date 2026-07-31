// api/publish-file.js — commit a new blog post to the repo (refuses overwrite),
// wire it into blog.html + sitemap.xml, and ping IndexNow for instant indexing.
// Password-gated (CRM_PASSWORD). Input: { password, draft } where draft is the
// object returned by /api/generate-blog (title, slug, metaDescription, tldr,
// tags[], keywords, readMinutes, bodyHtml). Human review happens in the UI first.

const https = require('https');

function gh(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = https.request({
      hostname: 'api.github.com', path, method,
      headers: {
        'Authorization': 'Bearer ' + String(token).trim(),
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'MarketCredo-CRM',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (resp) => {
      let c = [];
      resp.on('data', d => c.push(d));
      resp.on('end', () => {
        const t = Buffer.concat(c).toString();
        try { resolve({ status: resp.statusCode, data: JSON.parse(t) }); }
        catch { resolve({ status: resp.statusCode, data: t }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildPage(d, isoDate, niceDate) {
  const url = `https://www.marketcredo.in/blog/${d.slug}.html`;
  const title = esc(d.title);
  const desc = esc(d.metaDescription);
  const kw = esc(d.keywords);
  const readm = Number(d.readMinutes) || 8;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', headline: d.title, description: d.metaDescription,
        author: { '@type': 'Person', name: 'Atish Shakergaye', jobTitle: 'SEBI Registered Research Analyst', url: 'https://www.marketcredo.in/about.html' },
        publisher: { '@type': 'Organization', name: 'Market Credo', url: 'https://www.marketcredo.in', logo: { '@type': 'ImageObject', url: 'https://www.marketcredo.in/images/og-default.jpg' } },
        datePublished: isoDate, dateModified: isoDate,
        mainEntityOfPage: url, image: 'https://www.marketcredo.in/images/og-default.jpg', keywords: d.keywords
      },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.marketcredo.in/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.marketcredo.in/blog.html' },
        { '@type': 'ListItem', position: 3, name: d.title, item: url }
      ] }
    ]
  };
  const nav = `<nav>
  <a class="nav-item nav-brand" href="../index.html">MARKET CREDO</a>
  <a class="nav-item" href="../about.html"><span class="nav-num">F2</span>TRAINER</a>
  <a class="nav-item" href="../courses.html#courses"><span class="nav-num">F3</span>COURSES</a>
  <a class="nav-item" href="../testimonials.html"><span class="nav-num">F7</span>REVIEWS</a>
  <a class="nav-item" href="../videos.html"><span class="nav-num">F8</span>VIDEOS</a>
  <a class="nav-item" href="../chartboard.html"><span class="nav-num">F9</span>CHARTS</a>
  <a class="nav-item" href="../index.html#contact"><span class="nav-num">F6</span>CONTACT</a>
  <a class="nav-item" href="../life.html"><span class="nav-num">F10</span>LIFE</a>
  <a class="nav-item" href="../faq.html"><span class="nav-num">F11</span>FAQ</a>
  <a class="nav-item active" href="../blog.html"><span class="nav-num">F12</span>BLOG</a>
  <a class="nav-item nav-cta" href="../courses.html#demo">BOOK FREE DEMO &lt;GO&gt;</a>
</nav>`;
  const footer = `<footer id="contact">
  <div class="foot-grid">
    <div class="foot-col">
      <div class="fc-logo">MARKET CREDO</div>
      <p class="fc-about">Bhopal's premier technical analysis training institute. Founded by Atish Shakergaye &mdash; SEBI Registered Research Analyst with 20+ years of market experience.</p>
      <div class="fc-row"><span class="fc-ico">&#9673;</span>Plot No 83, Shrinivas Tower, M.P. Nagar Zone II, Bhopal, MP 462011</div>
      <div class="fc-row"><span class="fc-ico">&#9658;</span><a href="tel:+918827979008">+91-8827979008</a></div>
      <div class="fc-row"><span class="fc-ico">&#9658;</span>SEBI Reg. No: <span style="color:var(--orange)">INH000006086</span></div>
    </div>
    <div class="foot-col">
      <div class="foot-hdr">Navigate</div>
      <ul class="foot-links">
        <li><a href="../about.html">About Atish Shakergaye</a></li>
        <li><a href="../courses.html">Curriculum</a></li>
        <li><a href="../courses.html#demo">Book Free Demo</a></li>
        <li><a href="../blog.html">Blog &amp; Insights</a></li>
      </ul>
    </div>
  </div>
  <div class="foot-disc">DISCLAIMER: Market Credo is a trading and investment education institute. Atish Shakergaye is a SEBI Registered Research Analyst (INH000006086). All content is for educational purposes only. Trading involves substantial risk of loss. Past performance is not indicative of future results. Market Credo does not provide buy/sell recommendations.</div>
  <div class="foot-bottom">
    <span>&copy; 2024&ndash;2026 MARKET CREDO &middot; ALL RIGHTS RESERVED</span>
    <span>BHOPAL &middot; MADHYA PRADESH &middot; INDIA</span>
    <span style="color:var(--orange)">SEBI: INH000006086</span>
  </div>
</footer>`;

  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="theme-color" content="#121212"/>
<title>${title} | Market Credo</title>
<meta name="description" content="${desc}"/>
<meta name="keywords" content="${kw}"/>
<link rel="canonical" href="${url}"/>
<meta name="geo.region" content="IN-MP"/><meta name="geo.placename" content="Bhopal"/><meta name="geo.position" content="23.2332;77.4347"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:site_name" content="Market Credo"/>
<meta property="og:image" content="https://www.marketcredo.in/images/og-default.jpg"/>
<meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:image" content="https://www.marketcredo.in/images/og-default.jpg"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../styles.css"/>
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5RJD0WSYV5"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-5RJD0WSYV5');</script>
<style>
.article-h1{font-family:'IBM Plex Mono',monospace;font-size:28px;font-weight:700;color:var(--white);line-height:1.4;margin:0 0 16px;letter-spacing:1px;}
.tldr-box{background:var(--bg1);border-left:3px solid var(--orange);padding:18px 20px;margin:0 0 28px;}
.tldr-label{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.5px;color:var(--orange);text-transform:uppercase;margin-bottom:8px;}
.bp-body{max-width:760px;margin:0 auto;padding:40px 24px 60px;}
.bp-body h2{font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:var(--white);letter-spacing:0.5px;margin:36px 0 14px;padding-top:8px;border-top:1px solid var(--border);}
.bp-body h3{font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:var(--orange);letter-spacing:0.5px;margin:26px 0 10px;}
.bp-body p,.bp-body li{font-family:'IBM Plex Sans',sans-serif;font-size:14px;color:var(--dim);line-height:2;}
.bp-body p{margin:0 0 18px;}.bp-body strong{color:var(--white);}
.bp-body ul{padding-left:20px;margin:0 0 18px;}
.bp-meta{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--dimmer);text-transform:uppercase;margin-bottom:24px;}
.bp-cta{background:var(--bg2);border:1px solid var(--border);border-left:3px solid var(--orange);padding:20px 24px;margin:32px 0 0;font-family:'IBM Plex Sans',sans-serif;font-size:14px;color:var(--white);line-height:1.8;}
.skip-link{position:absolute;top:-40px;left:8px;background:#F3772C;color:#000;padding:8px 12px;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;text-decoration:none;letter-spacing:1px;z-index:9999;transition:top .15s;}.skip-link:focus{top:8px;outline:2px solid #fff;}
</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>
<a class="wa-float" data-nosnippet href="https://wa.me/918827979008?text=Hello%20Market%20Credo!%20I%20am%20interested%20in%20your%20courses.%20Please%20share%20details." target="_blank" rel="noopener noreferrer"><div class="wa-pulse"></div></a>
<div class="status-bar"><div class="sbar-inner"><div class="sbar-seg sbar-brand">MARKET CREDO</div><div class="sbar-seg sbar-info">SEBI REG: INH000006086</div><div class="sbar-seg sbar-right"><span class="blink">&bull;</span>&nbsp;BHOPAL &middot; MP &middot; INDIA</div></div></div>
${nav}
<main id="main">
<article class="bp-body">
  <div class="lp-breadcrumb" style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--dimmer);margin-bottom:20px;"><a href="../index.html" style="color:var(--dim);text-decoration:none;">HOME</a> &#9658; <a href="../blog.html" style="color:var(--dim);text-decoration:none;">BLOG</a> &#9658; ${esc(d.title).toUpperCase()}</div>
  <h1 class="article-h1">${title}</h1>
  <div class="bp-meta">By Atish Shakergaye &middot; SEBI INH000006086 &middot; Last updated: ${esc(niceDate)} &middot; ${readm} min read</div>
  <div class="tldr-box"><div class="tldr-label">TL;DR &mdash; Quick Answer</div><p style="margin:0;font-family:'IBM Plex Sans',sans-serif;font-size:14px;color:var(--white);line-height:1.9;">${esc(d.tldr)}</p></div>
${d.bodyHtml}
  <div class="bp-cta"><strong>Want to learn this hands-on in Bhopal?</strong> Market Credo runs classroom technical-analysis training with SEBI-registered analyst Atish Shakergaye, starting with a free 2-day demo. WhatsApp <a href="https://wa.me/918827979008" style="color:var(--orange);text-decoration:none;">+91-8827979008</a> or <a href="../courses.html#demo" style="color:var(--orange);text-decoration:none;">book your free demo</a>.</div>
</article>
</main>
${footer}
</body>
</html>
`;
}

function indexNow(key, urls) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      host: 'www.marketcredo.in', key,
      keyLocation: `https://www.marketcredo.in/${key}.txt`,
      urlList: urls
    });
    const r = https.request({
      hostname: 'api.indexnow.org', path: '/indexnow', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (resp) => { resp.on('data', () => {}); resp.on('end', () => resolve(resp.statusCode)); });
    r.on('error', () => resolve(0));
    r.write(payload); r.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const CRM_PASS = process.env.CRM_PASSWORD || 'marketcredo2024';
  const TOKEN = process.env.GH_TOKEN;
  const REPO = process.env.GH_REPO || 'indirashakergaye/marketcredo';
  const BRANCH = process.env.GH_BRANCH || 'master';
  const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '9f2c6a4e8b1d47f0a3e5c7b9d1f3a5e7';
  if (!TOKEN) return res.status(500).json({ error: 'GH_TOKEN not configured' });

  const body = req.body || {};
  if (String(body.password || '') !== CRM_PASS) return res.status(401).json({ error: 'Invalid password' });

  const d = body.draft || {};
  d.slug = String(d.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  if (!d.slug || !d.title || !d.bodyHtml) return res.status(400).json({ error: 'draft must include slug, title, bodyHtml' });

  const path = `blog/${d.slug}.html`;
  const postUrl = `https://www.marketcredo.in/blog/${d.slug}.html`;
  const now = new Date();
  const isoDate = now.toISOString().slice(0, 10);
  const niceDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  try {
    // 1. Refuse overwrite — never clobber an existing post.
    const exists = await gh('GET', `/repos/${REPO}/contents/${path}?ref=${BRANCH}`, TOKEN);
    if (exists.status === 200) return res.status(409).json({ error: `Post already exists: ${path}` });

    // 2. Commit the new blog page.
    const html = buildPage(d, isoDate, niceDate);
    const put = await gh('PUT', `/repos/${REPO}/contents/${path}`, TOKEN, {
      message: `Publish blog: ${d.title}`,
      content: Buffer.from(html).toString('base64'),
      branch: BRANCH
    });
    if (put.status !== 201 && put.status !== 200) return res.status(502).json({ error: 'Blog commit failed', detail: put.data });

    const warnings = [];

    // 3. Inject a card into blog.html at the BLOG_CARDS_START marker.
    try {
      const bh = await gh('GET', `/repos/${REPO}/contents/blog.html?ref=${BRANCH}`, TOKEN);
      if (bh.status === 200) {
        let content = Buffer.from(bh.data.content, 'base64').toString('utf8');
        if (content.includes('<!-- BLOG_CARDS_START -->')) {
          const card = `
  <div class="blog-card" data-category="technical-analysis">
    <span class="blog-card-tag tag-ta">${esc((d.tags && d.tags[0]) || 'TECHNICAL ANALYSIS').toUpperCase()}</span>
    <h3 class="blog-card-title">${esc(d.title)}</h3>
    <p class="blog-card-excerpt">${esc(d.metaDescription)}</p>
    <div class="blog-card-footer">
      <span class="blog-card-meta">${esc(niceDate).toUpperCase()} &middot; ${Number(d.readMinutes) || 8} MIN READ</span>
      <a class="blog-card-link" href="blog/${d.slug}.html">READ &gt;</a>
    </div>
  </div>`;
          content = content.replace('<!-- BLOG_CARDS_START -->', '<!-- BLOG_CARDS_START -->' + card);
          const up = await gh('PUT', `/repos/${REPO}/contents/blog.html`, TOKEN, {
            message: `Link new blog card: ${d.title}`,
            content: Buffer.from(content).toString('base64'),
            sha: bh.data.sha, branch: BRANCH
          });
          if (up.status !== 200 && up.status !== 201) warnings.push('blog.html update failed');
        } else warnings.push('BLOG_CARDS_START marker not found in blog.html');
      }
    } catch (e) { warnings.push('blog.html: ' + e.message); }

    // 4. Add the URL to sitemap.xml.
    try {
      const sm = await gh('GET', `/repos/${REPO}/contents/sitemap.xml?ref=${BRANCH}`, TOKEN);
      if (sm.status === 200) {
        let xml = Buffer.from(sm.data.content, 'base64').toString('utf8');
        if (!xml.includes(postUrl)) {
          const entry = `  <url>\n    <loc>${postUrl}</loc>\n    <lastmod>${isoDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`;
          xml = xml.replace('</urlset>', entry);
          const up = await gh('PUT', `/repos/${REPO}/contents/sitemap.xml`, TOKEN, {
            message: `Sitemap: add ${d.slug}`,
            content: Buffer.from(xml).toString('base64'),
            sha: sm.data.sha, branch: BRANCH
          });
          if (up.status !== 200 && up.status !== 201) warnings.push('sitemap.xml update failed');
        }
      }
    } catch (e) { warnings.push('sitemap.xml: ' + e.message); }

    // 5. Ping IndexNow (Bing/others) — fire and forget.
    let indexNowStatus = null;
    try { indexNowStatus = await indexNow(INDEXNOW_KEY, [postUrl, 'https://www.marketcredo.in/blog.html', 'https://www.marketcredo.in/sitemap.xml']); } catch (e) {}

    return res.status(200).json({ ok: true, url: postUrl, path, warnings, indexNowStatus });
  } catch (e) {
    return res.status(500).json({ error: 'Publish failed', detail: e.message });
  }
};
