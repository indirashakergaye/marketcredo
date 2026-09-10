'use strict';
/**
 * scripts/migrate-chrome.js — migrate pages onto the shared nav/footer partials.
 * SCOPE: replaces ONLY the <nav class="navbar"> element and the <footer id="contact">
 * element with the canonical partials. Never touches <head>, JSON-LD, the WhatsApp
 * float, or any trailing <script> (the lead path stays exactly as-is).
 *
 * The normalized-diff gate (verify-chrome-migration.js) is the auto-migrate decision:
 * a page is written ONLY if the sole change is link form. Anything else → left
 * untouched and reported as MANUAL. Usage: node scripts/migrate-chrome.js <page.html> ...
 */
const fs = require('fs');
const { linksOnlyDiff, BASE } = require('./verify-chrome-migration.js');

const NAV_RE = /<nav class="navbar"[\s\S]*?<\/nav>/;
const FOOTER_RE = /<footer id="contact">[\s\S]*?<\/footer>/;

const navPartial = fs.readFileSync('partials/nav.html', 'utf8').match(NAV_RE)[0];
const footerPartial = fs.readFileSync('partials/footer.html', 'utf8').match(FOOTER_RE)[0];

function pageUrl(file) {
  return BASE + '/' + file.replace(/\\/g, '/').replace(/\.html$/, '').replace(/(^|\/)index$/, '$1');
}

let pass = 0, manual = 0, skip = 0;
for (const file of process.argv.slice(2)) {
  const old = fs.readFileSync(file, 'utf8');
  if (!NAV_RE.test(old) || !FOOTER_RE.test(old)) { console.log(`SKIP   ${file} — no nav/footer element found`); skip++; continue; }
  const migrated = old.replace(NAV_RE, navPartial).replace(FOOTER_RE, footerPartial);
  if (linksOnlyDiff(old, migrated, pageUrl(file))) {
    fs.writeFileSync(file, migrated);
    console.log(`PASS   ${file} — auto-migrated (only link form changed)`);
    pass++;
  } else {
    console.log(`MANUAL ${file} — differs beyond links; NOT modified`);
    manual++;
  }
}
console.log(`\n${pass} migrated, ${manual} to manual pile, ${skip} skipped.`);
