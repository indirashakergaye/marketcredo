#!/usr/bin/env node
/**
 * scripts/build-rss.js — generates /feed.xml (RSS 2.0) from blog/*.html at build time.
 * Title = <title> (minus the " | Market Credo" suffix), description = meta description,
 * pubDate = file's last git commit date. Clean URLs (no .html).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EXCLUDE } = require('./exclude');

const BASE = 'https://www.marketcredo.in';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function commitDate(rel) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${rel}"`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch (_) {}
  return fs.statSync(rel).mtime.toISOString().slice(0, 10);
}
function rfc822(ymd) {
  const [y, m, d] = ymd.split('-');
  return `${d} ${MONTHS[+m - 1]} ${y} 00:00:00 +0530`; // day-of-week omitted (optional in RFC-822)
}
function pick(html, re) { const m = html.match(re); return m ? m[1].trim() : ''; }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const root = process.cwd();
const dir = path.join(root, 'blog');
if (!fs.existsSync(dir)) { console.log('ℹ build-rss: no blog/ dir, skipped.'); process.exit(0); }

const items = fs.readdirSync(dir)
  .filter((f) => f.endsWith('.html') && f !== 'index.html' && !EXCLUDE.has(f))
  .map((f) => {
    const rel = 'blog/' + f;
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    const title = pick(html, /<title>(.*?)<\/title>/s).replace(/\s*\|\s*Market Credo.*$/, '');
    const desc = pick(html, /<meta name="description" content="([^"]*)"/);
    return { url: `${BASE}/blog/${f.replace(/\.html$/, '')}`, title, desc, date: commitDate(rel) };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

const now = rfc822(items.length ? items[0].date : '2026-01-01');
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss version="2.0"><channel>\n' +
  `  <title>Market Credo — Journal</title>\n` +
  `  <link>${BASE}/blog</link>\n` +
  `  <description>Technical-analysis education from Market Credo, Bhopal.</description>\n` +
  `  <language>en-in</language>\n` +
  `  <lastBuildDate>${now}</lastBuildDate>\n` +
  items.map((i) =>
    `  <item>\n    <title>${esc(i.title)}</title>\n    <link>${i.url}</link>\n    <guid>${i.url}</guid>\n` +
    `    <pubDate>${rfc822(i.date)}</pubDate>\n    <description>${esc(i.desc)}</description>\n  </item>`
  ).join('\n') +
  '\n</channel></rss>\n';

fs.writeFileSync(path.join(root, 'feed.xml'), xml);
console.log(`✅ feed.xml written — ${items.length} posts.`);
