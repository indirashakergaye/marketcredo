'use strict';
/**
 * scripts/verify-chrome-migration.js — the normalized-diff gate for the chrome migration.
 *
 * Two versions of a page are "equivalent apart from link normalisation" when, after
 * (a) resolving every internal href/src to an ABSOLUTE url (so `about`, `/about` and
 * `../about` all collapse to the same string) and (b) collapsing whitespace, the two
 * strings are identical. The migration only rewrites the <nav> and <footer> elements,
 * so anything the gate reports beyond link form is a real content change → that page
 * must NOT be auto-migrated (it goes to the manual pile).
 *
 * Exports normalize()/linksOnlyDiff() for the migrator; also runnable as a CLI:
 *   node scripts/verify-chrome-migration.js <oldFile> <newFile> <pageUrl>
 */
const BASE = 'https://www.marketcredo.in';

function resolveLinks(html, pageUrl) {
  return html.replace(/\b(href|src)\s*=\s*"([^"]*)"/gi, (m, attr, val) => {
    let abs;
    try { abs = new URL(val, pageUrl).href; } catch (e) { abs = val; }
    return `${attr}="${abs}"`;
  });
}

function normalize(html, pageUrl) {
  return resolveLinks(html, pageUrl).replace(/\s+/g, ' ').trim();
}

function linksOnlyDiff(oldHtml, newHtml, pageUrl) {
  return normalize(oldHtml, pageUrl) === normalize(newHtml, pageUrl);
}

module.exports = { normalize, linksOnlyDiff, BASE };

if (require.main === module) {
  const fs = require('fs');
  const [oldF, newF, url] = process.argv.slice(2);
  const ok = linksOnlyDiff(fs.readFileSync(oldF, 'utf8'), fs.readFileSync(newF, 'utf8'), url);
  console.log(ok ? 'PASS (links-only)' : 'FAIL (differs beyond links)');
  process.exit(ok ? 0 : 1);
}
