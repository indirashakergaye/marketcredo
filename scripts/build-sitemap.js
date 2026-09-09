#!/usr/bin/env node
/**
 * scripts/build-sitemap.js — generates sitemap.xml at build time.
 * - Scans public *.html (root + blog/), excludes admin/utility/legal/thank-you pages.
 * - Clean URLs (no .html; index.html -> /).
 * - <lastmod> = file's last git commit date (YYYY-MM-DD); falls back to file mtime
 *   if git history is unavailable (e.g. shallow/!git build env).
 * - No <changefreq>/<priority> (Google ignores them).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = 'https://www.marketcredo.in';

// Not in the public sitemap: admin tools, the blog template, thank-you (noindex),
// and the legal utility pages.
const EXCLUDE = new Set([
  'crm.html', 'blog-studio.html', 'og-generator.html', 'blog-template.html',
  'market_credo_bloomberg.html', 'chips-variants-preview.html', 'mobile.html',
  'thank-you.html', 'privacy.html', 'terms.html', '404.html',
]);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'docs', 'vendor', 'templates', 'scripts', 'api']);

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.has(e.name)) walk(path.join(dir, e.name), acc);
    } else if (e.name.endsWith('.html') && !EXCLUDE.has(e.name)) {
      acc.push(path.join(dir, e.name));
    }
  }
  return acc;
}

function lastmod(relPath) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${relPath}"`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch (_) { /* fall through to mtime */ }
  return fs.statSync(relPath).mtime.toISOString().slice(0, 10);
}

function toUrl(relPath) {
  let p = relPath.replace(/\\/g, '/').replace(/\.html$/, '');
  if (p === 'index') return BASE + '/';
  return BASE + '/' + p;
}

const root = process.cwd();
const files = walk(root, []).map((f) => path.relative(root, f).replace(/\\/g, '/'));

// Hindi layer (task 21): hi/<slug>.html is the translation of <slug>.html.
// Build the set of hi slugs so EN pages can declare reciprocal hreflang alternates.
const hiSlugs = new Set(files.filter((f) => f.startsWith('hi/')).map((f) => f.slice(3).replace(/\.html$/, '')));
const enSlug = (f) => f.replace(/\.html$/, '');               // 'about', 'blog/x', 'index'
const hasHi = (f) => !f.startsWith('hi/') && hiSlugs.has(enSlug(f) === 'index' ? 'index' : enSlug(f));
const hiUrlFor = (f) => BASE + '/hi/' + (enSlug(f) === 'index' ? '' : enSlug(f));
let useAlternates = false;

// Stable order: home, then other root pages, then blog posts — all alphabetical within group.
const rank = (u) => (u === BASE + '/' ? 0 : u.includes('/blog/') ? 2 : u.includes('/hi/') ? 3 : 1);
const entries = files
  .map((f) => {
    const e = { url: toUrl(f), lastmod: lastmod(f) };
    if (f.startsWith('hi/')) {
      // Hindi page -> reciprocal alternates back to the EN original (x-default = EN).
      const enUrl = BASE + '/' + f.slice(3).replace(/\.html$/, '').replace(/^index$/, '');
      useAlternates = true;
      e.alts = [['en-IN', enUrl], ['hi-IN', e.url], ['x-default', enUrl]];
    } else if (hasHi(f)) {
      // EN page that has a Hindi translation.
      useAlternates = true;
      e.alts = [['en-IN', e.url], ['hi-IN', hiUrlFor(f)], ['x-default', e.url]];
    }
    return e;
  })
  .sort((a, b) => rank(a.url) - rank(b.url) || a.url.localeCompare(b.url));

const ns = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
  (useAlternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : '');
const block = (e) => {
  const alts = e.alts ? e.alts.map(([lang, href]) => `\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`).join('') : '';
  return `  <url>\n    <loc>${e.url}</loc>\n    <lastmod>${e.lastmod}</lastmod>${alts}\n  </url>`;
};

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  `<urlset ${ns}>\n` +
  entries.map(block).join('\n') +
  '\n</urlset>\n';

fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
console.log(`✅ sitemap.xml written — ${entries.length} URLs${useAlternates ? ' (with hreflang alternates)' : ''}.`);
