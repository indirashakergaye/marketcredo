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
  const nav = `<nav class="navbar" aria-label="Primary">
  <div class="wrap">
    <a class="brand" href="../index.html"><span class="bm">M</span><span>Market Credo<small>TECHNICAL ANALYSIS INSTITUTE</small></span></a>
    <ul class="menu" id="menu">
      <li><a href="../courses.html#courses">Courses</a></li>
      <li><a href="../about.html">Trainer</a></li>
      <li><a href="../index.html#curriculum">Curriculum</a></li>
      <li><a href="../testimonials.html">Reviews</a></li>
      <li><a href="../videos.html">Videos</a></li>
      <li><a href="../blog.html">Journal</a></li>
      <li><a href="../index.html#contact">Contact</a></li>
    </ul>
    <div class="nav-r">
      <a class="nav-phone" href="tel:+918827979008">+91 88279 79008</a>
      <a class="btn btn-green" href="../index.html#enquire">Book Free Demo</a>
      <button class="navtoggle" id="navtoggle" aria-label="Menu"><svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
    </div>
  </div>
</nav>`;
  const footer = `<footer id="contact">
  <div class="wrap">
    <div class="news">
      <div>
        <h3>Stay on top of the markets</h3>
        <p>Get bite-sized technical-analysis tips &amp; batch updates. No spam, ever.</p>
      </div>
      <form onsubmit="return subNews(event)">
        <input id="news-email" type="email" placeholder="Your email address" required/>
        <button type="submit" aria-label="Subscribe"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </form>
    </div>
    <div class="foot-grid">
      <div>
        <div class="foot-brand"><span class="bm">M</span> Market Credo</div>
        <p class="foot-about">Bhopal's professional technical analysis training institute, led by Atish Shakergaye — SEBI Registered Research Analyst with 20+ years of market experience.</p>
      </div>
      <div><div class="foot-h">Course</div><ul class="foot-links"><li><a href="../courses.html#courses">Technical Analysis</a></li><li><a href="../index.html#curriculum">Curriculum</a></li><li><a href="../index.html#enquire">Free 2-Day Demo</a></li></ul></div>
      <div><div class="foot-h">Institute</div><ul class="foot-links"><li><a href="../about.html">About the Trainer</a></li><li><a href="../faq.html">FAQ</a></li><li><a href="../blog.html">Journal</a></li><li><a href="../terms.html">Terms</a></li><li><a href="../privacy.html">Privacy</a></li></ul></div>
      <div><div class="foot-h">Contact</div><ul class="foot-links"><li><a href="tel:+918827979008">+91 88279 79008</a></li><li><a href="mailto:info@marketcredo.in">info@marketcredo.in</a></li><li><a href="https://wa.me/918827979008" target="_blank" rel="noopener">WhatsApp Us</a></li><li>Mon–Sat · 9AM–10PM</li></ul></div>
    </div>
  </div>
  <div class="addrbar"><div class="wrap"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Plot No 83, Shrinivas Tower, M.P. Nagar Zone II, Bhopal, Madhya Pradesh — 462011</div></div>
  <div class="foot-disc"><div class="wrap">DISCLAIMER: Market Credo is a trading and investment education institute. Atish Shakergaye is a SEBI Registered Research Analyst (INH000006086). All course content is strictly for educational purposes only. Trading and investing in securities involves substantial risk of loss. Past performance is not indicative of future results. Please consult a SEBI-registered advisor before making any investment decisions. Market Credo does not provide buy/sell recommendations or portfolio management services.<div class="foot-bot"><span>&copy; 2024&ndash;2026 Market Credo · All Rights Reserved</span><span>Bhopal · Madhya Pradesh · India</span><span class="g">SEBI: INH000006086</span></div></div></div>
</footer>`;

  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="theme-color" content="#34B350"/>
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
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../mc.css"/>
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5RJD0WSYV5"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-5RJD0WSYV5');</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>
${nav}
<main id="main">
<section><div class="wrap"><article class="article-wrap reveal">
  <div class="lp-breadcrumb"><a href="../index.html">Home</a> &#9658; <a href="../blog.html">Journal</a> &#9658; ${esc(d.title)}</div>
  <h1 class="article-h1">${title}</h1>
  <div class="bp-meta"><span>By Atish Shakergaye · SEBI INH000006086</span><span>Updated ${esc(niceDate)}</span><span>${readm} min read</span></div>
  <div class="tldr-box"><div class="tldr-label">TL;DR &mdash; Quick Answer</div><p>${esc(d.tldr)}</p></div>
  <div class="article-content">
${d.bodyHtml}
  </div>
  <div class="bp-cta"><strong>Want to learn this hands-on in Bhopal?</strong> Market Credo runs classroom technical-analysis training with SEBI-registered analyst Atish Shakergaye, starting with a free 2-day demo. WhatsApp <a href="https://wa.me/918827979008">+91-8827979008</a> or <a href="../index.html#enquire">book your free demo</a>.</div>
</article></div></section>
</main>
${footer}
<a class="wa-float" data-nosnippet href="https://wa.me/918827979008?text=Hello%20Market%20Credo!%20I%20am%20interested%20in%20your%20courses.%20Please%20share%20details." target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Market Credo"><span class="dot"></span><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.553 4.1 1.523 5.824L.072 23.998l6.32-1.428A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.865 0-3.608-.507-5.101-1.387l-.365-.217-3.748.847.863-3.658-.237-.375A9.938 9.938 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg></a>
<script>
var _nt=document.getElementById('navtoggle');if(_nt){_nt.addEventListener('click',function(){document.getElementById('menu').classList.toggle('open');});}
function subNews(e){e.preventDefault();var em=(document.getElementById('news-email').value||'').trim();window.open('https://wa.me/918827979008?text='+encodeURIComponent('Hello Market Credo! Please add me to your updates. Email: '+em),'_blank');return false;}
</script>
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
