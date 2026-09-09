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

// Stable order: home, then other root pages, then blog posts — all alphabetical within group.
const rank = (u) => (u === BASE + '/' ? 0 : u.includes('/blog/') ? 2 : 1);
const entries = files
  .map((f) => ({ url: toUrl(f), lastmod: lastmod(f) }))
  .sort((a, b) => rank(a.url) - rank(b.url) || a.url.localeCompare(b.url));

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries.map((e) => `  <url>\n    <loc>${e.url}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`).join('\n') +
  '\n</urlset>\n';

fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
console.log(`✅ sitemap.xml written — ${entries.length} URLs.`);
