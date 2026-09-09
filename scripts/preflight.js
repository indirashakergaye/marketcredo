#!/usr/bin/env node
/**
 * scripts/preflight.js — the task-26 pre-deploy ritual, one shot.
 *
 *   node scripts/preflight.js                         # local checks only
 *   node scripts/preflight.js https://www.marketcredo.in   # local + live checks
 *
 * Local checks always run and gate exit code. Live checks run only when a base URL is
 * given and are reported PASS/WARN/FAIL (network hiccups are WARN, not hard failures).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ADMIN = new Set(['crm.html', 'blog-studio.html', 'og-generator.html', 'blog-template.html', 'market_credo_bloomberg.html', 'chips-variants-preview.html']);
let hardFail = 0;
const line = (s) => console.log(s);
const ok = (m) => line('  ✅ ' + m);
const bad = (m) => { line('  ❌ ' + m); hardFail++; };
const warn = (m) => line('  ⚠️  ' + m);

function publicHtml() {
  const out = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    if (e.isDirectory()) { if (!['node_modules', '.git', 'docs', 'vendor', 'templates', 'scripts', 'api'].includes(e.name)) walk(path.join(d, e.name)); }
    else if (e.name.endsWith('.html') && !ADMIN.has(e.name)) out.push(path.join(d, e.name));
  });
  walk(process.cwd());
  return out;
}

line('\n== LOCAL ==');

// 1. NAP guard + generators (runs the real build).
try { execSync('node scripts/check-nap.js', { stdio: 'pipe' }); ok('NAP guard passed'); }
catch (e) { bad('NAP guard FAILED:\n' + (e.stdout || e.stderr || e).toString()); }
try { execSync('node scripts/build-sitemap.js && node scripts/build-rss.js', { stdio: 'pipe' }); ok('sitemap.xml + feed.xml generated'); }
catch (e) { bad('sitemap/feed generation FAILED: ' + e.message); }

// 2. JSON-LD validity on every public page.
let jsonOk = 0, jsonBad = 0;
for (const f of publicHtml()) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []) {
    const body = m.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    try { JSON.parse(body); jsonOk++; } catch (e) { jsonBad++; bad(`invalid JSON-LD in ${path.relative(process.cwd(), f)}: ${e.message}`); }
  }
}
if (!jsonBad) ok(`JSON-LD valid on all public pages (${jsonOk} blocks)`);

// 3. No foreign phone number (the old ScoutStack number).
const hits = publicHtml().concat(['api/lead.js', 'api/publish-file.js', 'lead.js', 'pixel.js', 'mc-events.js'].filter(fs.existsSync))
  .filter((f) => fs.readFileSync(f, 'utf8').includes('8827979008'));
hits.length ? bad('old number 8827979008 found in: ' + hits.join(', ')) : ok('no old number (8827979008) anywhere');

// 4. No .html in public hrefs (clean URLs).
const htmlHref = publicHtml().filter((f) => /href="[^"]*\.html"/.test(fs.readFileSync(f, 'utf8')));
htmlHref.length ? bad('.html href found in: ' + htmlHref.map((f) => path.relative(process.cwd(), f)).join(', ')) : ok('no .html hrefs on public pages');

// 5. thank-you is noindex.
try { /noindex/.test(fs.readFileSync('thank-you.html', 'utf8')) ? ok('thank-you.html is noindex') : bad('thank-you.html missing noindex'); }
catch (_) { warn('thank-you.html not found'); }

// ---- LIVE ----
const base = process.argv[2];
(async () => {
  if (base) {
    line('\n== LIVE (' + base + ') ==');
    const www = base.replace(/\/$/, '');
    const apex = www.replace('://www.', '://');
    const get = (u, opts) => fetch(u, Object.assign({ redirect: 'manual', headers: { 'user-agent': 'mc-preflight' } }, opts));
    const check = async (label, fn) => { try { await fn(); } catch (e) { warn(`${label}: ${e.message}`); } };

    await check('apex -> www 308', async () => {
      const r = await get(apex + '/');
      (r.status === 308 || r.status === 301) && (r.headers.get('location') || '').includes('www.')
        ? ok(`apex ${r.status} -> ${r.headers.get('location')}`) : warn(`apex returned ${r.status} (expected 308 -> www)`);
    });
    await check('www / 200 + security headers', async () => {
      const r = await get(www + '/');
      r.status === 200 ? ok('www / -> 200') : warn('www / -> ' + r.status);
      ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'strict-transport-security'].forEach((h) =>
        r.headers.get(h) ? ok(`header ${h}: ${r.headers.get(h)}`) : warn(`missing header ${h}`));
    });
    await check('clean URL redirect', async () => {
      const r = await get(www + '/about.html');
      (r.status === 308 || r.status === 301) ? ok(`/about.html ${r.status} -> ${r.headers.get('location')}`) : warn(`/about.html -> ${r.status} (expected 308 -> /about)`);
    });
    await check('/about 200', async () => { const r = await get(www + '/about'); ok('/about -> ' + r.status); });
    await check('/crm 401 (auth)', async () => {
      const r = await get(www + '/crm');
      r.status === 401 ? ok('/crm -> 401 (protected)') : warn(`/crm -> ${r.status} (expected 401 — set ADMIN_USER/ADMIN_PASS)`);
    });
    await check('robots.txt', async () => {
      const t = await (await fetch(www + '/robots.txt')).text();
      t.includes('Disallow: /api/') ? ok('robots.txt disallows /api/') : warn('robots.txt unexpected');
    });
    await check('sitemap.xml', async () => {
      const t = await (await fetch(www + '/sitemap.xml')).text();
      /\.html<\/loc>/.test(t) ? warn('sitemap has .html locs') : ok('sitemap.xml clean (no .html locs)');
    });
  } else {
    line('\n(no URL arg — skipping live checks. Pass e.g. https://www.marketcredo.in to run them.)');
  }

  line('');
  if (hardFail) { line(`❌ preflight FAILED — ${hardFail} local issue(s). Do not deploy.`); process.exit(1); }
  line('✅ preflight local checks passed.' + (base ? ' Review any ⚠️ live warnings above.' : ''));
})();
