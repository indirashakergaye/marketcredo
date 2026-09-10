#!/usr/bin/env node
/**
 * scripts/build-og.js — per-page OG image generator (Approach A: committed PNGs).
 *
 * STAGED / UNRENDERED. To activate:
 *   1. npm i @resvg/resvg-js
 *   2. Add Jost .ttf files to /fonts/ (e.g. Jost-Regular.ttf, Jost-Medium.ttf,
 *      Jost-SemiBold.ttf, Jost-Bold.ttf) — the generator loads every /fonts/*.ttf.
 * Then `node scripts/build-og.js` renders /images/og/<slug>.png (1200x630) per blog
 * post from partials/og-template.svg. Pointing each page's og:image/twitter:image at
 * its /images/og/<slug>.png is a separate wiring commit once images exist.
 *
 * With no dependency/fonts present it prints a STAGED message and renders nothing.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const TPL = fs.readFileSync(path.join('partials', 'og-template.svg'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Pages that get an OG image. Blog posts for now; extend with pattern pages later.
function targets() {
  const out = [];
  for (const f of fs.readdirSync('blog')) {
    if (!f.endsWith('.html') || f === 'index.html') continue;
    const s = fs.readFileSync(path.join('blog', f), 'utf8');
    const m = s.match(/<title>(.*?)<\/title>/s);
    const title = (m ? m[1] : f).replace(/\s*\|\s*Market Credo.*$/, '').trim();
    out.push({ slug: f.replace(/\.html$/, ''), title, eyebrow: 'Market Credo · Journal' });
  }
  return out;
}

// Greedy word-wrap; cap at 4 lines so the title always fits the canvas.
function wrapLines(title, max) {
  const words = title.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

function titleTspans(title) {
  return wrapLines(title, 20)
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 76}">${esc(l)}</tspan>`)
    .join('');
}

function svgFor(t) {
  return TPL.replace(/{{EYEBROW}}/g, esc(t.eyebrow)).replace('{{TITLE_TSPANS}}', titleTspans(t.title));
}

// ---- render (staged: no-op until dependency + fonts are present) ----
let Resvg;
try { Resvg = require('@resvg/resvg-js').Resvg; }
catch (e) {
  console.log('STAGED: @resvg/resvg-js is not installed. Run `npm i @resvg/resvg-js`');
  console.log('and add Jost .ttf files to /fonts/, then re-run. Generator + template are ready;');
  console.log(`${targets().length} OG image(s) will be produced.`);
  process.exit(0);
}
const fontFiles = fs.existsSync('fonts')
  ? fs.readdirSync('fonts').filter((f) => /\.ttf$/i.test(f)).map((f) => path.join('fonts', f))
  : [];
if (!fontFiles.length) {
  console.log('STAGED: no Jost .ttf found in /fonts/. Add them, then re-run.');
  process.exit(0);
}
fs.mkdirSync(path.join('images', 'og'), { recursive: true });
for (const t of targets()) {
  const r = new Resvg(svgFor(t), {
    font: { fontFiles, defaultFontFamily: 'Jost', loadSystemFonts: false },
    fitTo: { mode: 'width', value: 1200 },
  });
  fs.writeFileSync(path.join('images', 'og', `${t.slug}.png`), r.render().asPng());
  console.log(`wrote images/og/${t.slug}.png`);
}
console.log('✅ OG images rendered.');
