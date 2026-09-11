#!/usr/bin/env node
/**
 * scripts/gsc-coverage.js — per-URL index-coverage puller for Search Console.
 *
 * WHY THIS SHAPE: the Search Console API has NO bulk "Index Coverage report"
 * endpoint (the 5-indexed / 20-not-indexed screen in the UI is not exposed).
 * Per-URL index status comes only from the URL Inspection API
 * (urlInspection.index.inspect), one URL per call. So this script enumerates the
 * URLs we publish and inspects each, reporting the exact coverageState/verdict
 * Google holds for it.
 *
 * KEY: read from GOOGLE_APPLICATION_CREDENTIALS or GSC_KEY env var; falls back to
 * the in-repo path for a first run. MOVE THE KEY OUT OF THE REPO and set the env
 * var — the fallback exists only so the first run works.
 *
 * Run:  node scripts/gsc-coverage.js
 * Needs (local only, not for deploy):  npm i --no-save @googleapis/searchconsole google-auth-library
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Key path comes ONLY from the environment — never from inside the repo, so a
// credential path is never committed. Set GOOGLE_APPLICATION_CREDENTIALS to the
// key's location (kept outside the repo, e.g. C:\Users\HOME\.secrets\...).
const KEYFILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GSC_KEY;
const HOST = 'https://www.marketcredo.in';
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

function fail(msg) { console.error('\n✗ ' + msg + '\n'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- enumerate the URLs we publish (root + blog + chart-patterns) ----
function toUrl(rel) {
  let p = rel.replace(/\\/g, '/').replace(/\.html$/, '');
  if (p === 'index') return HOST + '/';
  if (p.endsWith('/index')) p = p.slice(0, -'/index'.length);
  return HOST + '/' + p;
}
function collectUrls() {
  const dirs = ['.', 'blog', 'chart-patterns'];
  const set = new Set([HOST + '/']);
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith('.html')) continue;
      const rel = d === '.' ? f : d + '/' + f;
      set.add(toUrl(rel));
    }
  }
  return [...set].sort();
}

async function main() {
  if (!KEYFILE) fail('set GOOGLE_APPLICATION_CREDENTIALS to your service-account key path (kept outside the repo).');
  if (!fs.existsSync(KEYFILE)) fail(`key not found at ${KEYFILE} — check GOOGLE_APPLICATION_CREDENTIALS.`);

  let GoogleAuth, searchconsole;
  try {
    ({ GoogleAuth } = require('google-auth-library'));
    ({ searchconsole } = require('@googleapis/searchconsole'));
  } catch (e) {
    fail('deps missing. Run: npm i --no-save @googleapis/searchconsole google-auth-library');
  }

  const authClient = await new GoogleAuth({ keyFile: KEYFILE, scopes: SCOPES }).getClient();
  const gsc = searchconsole({ version: 'v1', auth: authClient });

  // 1) resolve the property this service account can see
  let sites;
  try { sites = (await gsc.sites.list()).data.siteEntry || []; }
  catch (e) { fail('sites.list failed: ' + (e.errors ? JSON.stringify(e.errors) : e.message)); }
  console.log('Properties visible to this service account:');
  sites.forEach((s) => console.log(`  ${s.permissionLevel.padEnd(16)} ${s.siteUrl}`));
  const match = sites.find((s) => s.siteUrl === 'sc-domain:marketcredo.in')
    || sites.find((s) => /marketcredo\.in/.test(s.siteUrl));
  if (!match) fail('service account cannot see any marketcredo.in property. Add it as a user in GSC.');
  const siteUrl = match.siteUrl;
  console.log(`\nUsing property: ${siteUrl}\n`);

  // 2) inspect each URL
  const urls = collectUrls();
  console.log(`Inspecting ${urls.length} URL(s) via URL Inspection API…\n`);
  const rows = [];
  for (const u of urls) {
    try {
      const r = (await gsc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl } })).data;
      const i = (r.inspectionResult && r.inspectionResult.indexStatusResult) || {};
      rows.push({
        url: u, verdict: i.verdict || '-', coverage: i.coverageState || '-',
        robots: i.robotsTxtState || '-', indexing: i.indexingState || '-',
        fetch: i.pageFetchState || '-', lastCrawl: i.lastCrawlTime || '-',
        userCanonical: i.userCanonical || '', googleCanonical: i.googleCanonical || '',
      });
    } catch (e) {
      const msg = e.errors ? e.errors.map((x) => x.message).join('; ') : e.message;
      rows.push({ url: u, verdict: 'ERROR', coverage: msg, robots: '', indexing: '', fetch: '', lastCrawl: '', userCanonical: '', googleCanonical: '' });
    }
    await sleep(300); // stay well under 600/min
  }

  // 3) report: grouped summary + per-URL detail
  const byCoverage = {};
  rows.forEach((r) => { (byCoverage[r.coverage] = byCoverage[r.coverage] || []).push(r); });
  console.log('===== SUMMARY BY COVERAGE STATE =====');
  Object.entries(byCoverage).sort((a, b) => b[1].length - a[1].length)
    .forEach(([state, list]) => console.log(`  ${String(list.length).padStart(2)}  ${state}`));

  console.log('\n===== PER-URL DETAIL =====');
  rows.sort((a, b) => a.coverage.localeCompare(b.coverage) || a.url.localeCompare(b.url));
  for (const r of rows) {
    console.log(`\n${r.url}`);
    console.log(`   verdict=${r.verdict}  coverage="${r.coverage}"`);
    if (r.robots !== '-' || r.indexing !== '-' || r.fetch !== '-') console.log(`   robots=${r.robots}  indexing=${r.indexing}  fetch=${r.fetch}  lastCrawl=${r.lastCrawl}`);
    if (r.userCanonical && r.userCanonical !== r.googleCanonical) console.log(`   userCanonical=${r.userCanonical}\n   googleCanonical=${r.googleCanonical || '(none chosen)'}`);
  }
  fs.writeFileSync('gsc-coverage.out.json', JSON.stringify({ siteUrl, generatedFor: urls.length, rows }, null, 2));
  console.log('\n(Full data written to gsc-coverage.out.json — gitignored.)');
}
main().catch((e) => fail(e.stack || e.message));
