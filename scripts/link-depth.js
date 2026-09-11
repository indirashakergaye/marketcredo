#!/usr/bin/env node
/**
 * scripts/link-depth.js — internal-link reachability auditor.
 *
 * Builds the internal link graph from the local HTML (root + blog + chart-patterns),
 * BFS from the homepage "/", and reports click-depth + in-degree for every page.
 * Orphans (unreachable) and pages deeper than 3 clicks are the discovery risk:
 * IndexNow/sitemaps announce a URL exists, but internal links are what make Google
 * crawl it and keep it in the index.
 *
 * Relative links are resolved against each page's canonical clean URL (no trailing
 * slash, per trailingSlash:false), i.e. exactly how a browser resolves them — so a
 * relative link that resolves to the wrong place shows up as a broken edge.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const HOST = 'https://www.marketcredo.in';

function fileToPath(rel) {
  let p = rel.replace(/\\/g, '/').replace(/\.html$/, '');
  if (p === 'index') return '/';
  if (p.endsWith('/index')) p = p.slice(0, -'/index'.length);
  return '/' + p;
}
// enumerate pages
const files = [];
for (const d of ['.', 'blog', 'chart-patterns']) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) if (f.endsWith('.html')) files.push(d === '.' ? f : d + '/' + f);
}
const pathToFile = {};
for (const f of files) pathToFile[fileToPath(f)] = f;
const valid = new Set(Object.keys(pathToFile));

function normalize(p) {
  if (!p) return null;
  p = p.split('#')[0].split('?')[0];
  if (!p) return null;
  if (/^(mailto:|tel:|javascript:)/i.test(p)) return null;
  try {
    const u = new URL(p, HOST + (arguments[1] || '/'));
    if (u.hostname && !/(^|\.)marketcredo\.in$/i.test(u.hostname)) return null; // external
    let out = u.pathname.replace(/\.html$/, '');
    if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1);
    return out || '/';
  } catch { return null; }
}

// build edges
const edges = {};            // path -> Set(targets)
const indeg = {};            // path -> Set(sources)
for (const p of valid) { edges[p] = new Set(); indeg[p] = new Set(); }
for (const f of files) {
  const src = fileToPath(f);
  const html = fs.readFileSync(f, 'utf8');
  const hrefs = [...html.matchAll(/<a\s[^>]*href\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
  for (const h of hrefs) {
    const tgt = normalize(h, src);
    if (tgt && valid.has(tgt) && tgt !== src) { edges[src].add(tgt); indeg[tgt].add(src); }
  }
}

// BFS from home
const depth = { '/': 0 };
let frontier = ['/'];
while (frontier.length) {
  const next = [];
  for (const u of frontier) for (const v of edges[u] || []) if (!(v in depth)) { depth[v] = depth[u] + 1; next.push(v); }
  frontier = next;
}

const TARGETS = ['/fees','/videos','/life','/review-us','/chartboard','/blog','/chart-patterns','/chart-patterns/head-and-shoulders','/chart-patterns/double-top','/blog/nifty-weekly-outlook','/blog/moving-averages-sma-vs-ema','/blog/risk-management-2-percent-rule','/blog/start-trading-journey','/blog/trading-psychology-losses','/blog/understanding-support-resistance'];

console.log('Pages in graph:', valid.size, '| reachable from /:', Object.keys(depth).length, '\n');

console.log('=== FULL REACHABILITY TABLE (all ' + valid.size + ' pages) ===');
console.log('depth  in-deg  status   url');
const allRows = [...valid].map((p) => ({ p, d: (p in depth) ? depth[p] : Infinity, ind: indeg[p].size }))
  .sort((a, b) => (a.d - b.d) || a.p.localeCompare(b.p));
for (const r of allRows) {
  const status = r.p === '/' ? 'HOME' : r.d === Infinity ? 'ORPHAN' : r.d > 3 ? 'DEEP>3' : r.ind <= 1 ? 'WEAK' : 'ok';
  console.log(`  ${r.d === Infinity ? '∞' : r.d}      ${String(r.ind).padStart(2)}     ${status.padEnd(7)}  ${r.p}`);
}
console.log('');

console.log('=== THE 15 UNKNOWN-TO-GOOGLE URLS ===');
console.log('depth  in-deg  status  url');
for (const t of TARGETS) {
  if (!valid.has(t)) { console.log(`  n/a    -      MISSING  ${t} (no such page file)`); continue; }
  const d = (t in depth) ? depth[t] : Infinity;
  const ind = indeg[t].size;
  const status = d === Infinity ? 'ORPHAN' : d > 3 ? 'DEEP>3' : ind <= 1 ? 'WEAK' : 'ok';
  const from = ind <= 3 ? '  <= from: ' + [...indeg[t]].join(', ') : '';
  console.log(`  ${d === Infinity ? '∞' : d}      ${String(ind).padStart(2)}     ${status.padEnd(7)} ${t}${from}`);
}
console.log('\n(WEAK = 1 or 0 internal linking pages; DEEP>3 = beyond 3 clicks; ORPHAN = unreachable from home.)');

// also flag any site page (not just targets) that is orphaned
const orphans = [...valid].filter((p) => !(p in depth) && p !== '/');
if (orphans.length) { console.log('\nAll orphaned pages on the site (unreachable from /):'); orphans.sort().forEach((p) => console.log('   ' + p + '  (in-deg ' + indeg[p].size + ')')); }
