#!/usr/bin/env node
/**
 * scripts/make-schematic-chart.js — draws the schematic pattern charts from data.
 *
 * Every chart record in data/patterns.json may carry a "draw" block: a synthetic
 * price path (waypoints), an optional neckline and a list of annotation marks. This
 * script turns each one into images/chart-patterns/<file> at 1200x675 WebP, so the
 * charts regenerate from data exactly like the pages do.
 *
 * WHY SCHEMATIC: SEBI's 30-day price-data rule means a real chart of a named
 * security is only usable with data at least 30 days old and the date range labelled
 * on the image. A synthetic series avoids the question entirely — there is no
 * security and no price data — and every image says so in its footer note.
 *
 * A chart record with no "draw" block is left alone: it is a hand-supplied image,
 * and this script reports it rather than overwriting it.
 *
 * Output is deterministic: same "draw" block in, same bytes out. Re-running it on an
 * unchanged patterns.json produces no git diff.
 *
 * Needs sharp, which is NOT a project dependency (the site build needs no binaries):
 *   npm install --no-save sharp && node scripts/make-schematic-chart.js
 * Usage: node scripts/make-schematic-chart.js [--only <slug>] [--check]
 *   --check  render to memory and report which files would change; writes nothing.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const W = 1200, H = 675;
const PAD = { l: 48, r: 48, t: 58, b: 62 };
const PW = W - PAD.l - PAD.r, PH = H - PAD.t - PAD.b;
const INK = '#20342A', MUTED = '#8AA093', GRID = '#ECF4EF';
const UP = '#34B350', DOWN = '#D2695C', LINE = '#20342A', MOVE = '#B8862B';
const FOOTNOTE = 'Schematic illustration — synthetic data, not a real security and not real price data.';
const IMG_DIR = path.join('images', 'chart-patterns');

let VMIN = 0, VMAX = 100, BARS = 96;
const y = (v) => PAD.t + PH - ((v - VMIN) / (VMAX - VMIN)) * PH;
const xAt = (i) => PAD.l + (i + 0.5) * (PW / BARS);

// Deterministic PRNG — the jitter must be identical on every machine and every run.
function lcg(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }

function series(waypoints, seed) {
  const rnd = lcg(seed);
  const trend = [];
  for (let i = 0; i < BARS; i++) {
    const f = i / (BARS - 1);
    let a = waypoints[0], b = waypoints[waypoints.length - 1];
    for (let k = 0; k < waypoints.length - 1; k++) {
      if (f >= waypoints[k][0] && f <= waypoints[k + 1][0]) { a = waypoints[k]; b = waypoints[k + 1]; break; }
    }
    const span = (b[0] - a[0]) || 1;
    const t = (f - a[0]) / span;
    const e = t * t * (3 - 2 * t); // smoothstep, so turns read like price rather than a zigzag
    trend.push(a[1] + (b[1] - a[1]) * e);
  }
  const bars = [];
  let prevClose = trend[0];
  for (let i = 0; i < BARS; i++) {
    const noise = (rnd() - 0.5) * 3.1 + Math.sin(i * 1.7) * 0.7;
    const close = trend[i] + noise;
    const open = prevClose + (rnd() - 0.5) * 1.6;
    const hi = Math.max(open, close) + rnd() * 2.2 + 0.4;
    const lo = Math.min(open, close) - rnd() * 2.2 - 0.4;
    bars.push({ open, close, hi, lo });
    prevClose = close;
  }
  return bars;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function text(px, py, s, o) {
  o = o || {};
  return `<text x="${(px + (o.dx || 0)).toFixed(1)}" y="${py.toFixed(1)}" fill="${o.fill || INK}" ` +
    `font-size="${o.size || 21}" font-family="Segoe UI, Helvetica, Arial, sans-serif" ` +
    `font-weight="${o.weight || 600}" text-anchor="${o.anchor || 'middle'}" paint-order="stroke" ` +
    `stroke="#FFFFFF" stroke-width="${o.halo === false ? 0 : 5}" stroke-linejoin="round">${esc(s)}</text>`;
}

function candles(bars) {
  const bw = Math.max(3, (PW / BARS) * 0.6);
  return bars.map((b, i) => {
    const cx = xAt(i), c = b.close >= b.open ? UP : DOWN;
    const yo = y(b.open), yc = y(b.close);
    const top = Math.min(yo, yc), h = Math.max(1.5, Math.abs(yc - yo));
    return `<line x1="${cx.toFixed(1)}" y1="${y(b.hi).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${y(b.lo).toFixed(1)}" stroke="${c}" stroke-width="1.6"/>` +
      `<rect x="${(cx - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${c}" rx="1"/>`;
  }).join('');
}

function svg(draw) {
  BARS = draw.bars || 96;
  const marks = draw.marks || [];
  const bars = series(draw.waypoints, draw.seed || 1);

  // Fit the vertical scale to the data AND the annotations, so the drawing fills the canvas.
  let lo = Infinity, hi = -Infinity;
  for (const b of bars) { lo = Math.min(lo, b.lo); hi = Math.max(hi, b.hi); }
  for (const m of marks) for (const v of [m.v, m.from, m.to]) if (typeof v === 'number') { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  if (draw.neckline) { lo = Math.min(lo, draw.neckline[1], draw.neckline[3]); hi = Math.max(hi, draw.neckline[1], draw.neckline[3]); }
  const padV = (hi - lo) * 0.07;
  VMIN = lo - padV; VMAX = hi + padV;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  for (let k = 0; k <= 4; k++) {
    const gy = PAD.t + (PH * k) / 4;
    s += `<line x1="${PAD.l}" y1="${gy.toFixed(1)}" x2="${W - PAD.r}" y2="${gy.toFixed(1)}" stroke="${GRID}" stroke-width="1"/>`;
  }
  s += candles(bars);
  if (draw.neckline) {
    const [f1, v1, f2, v2] = draw.neckline;
    s += `<line x1="${(PAD.l + f1 * PW).toFixed(1)}" y1="${y(v1).toFixed(1)}" x2="${(PAD.l + f2 * PW).toFixed(1)}" y2="${y(v2).toFixed(1)}" stroke="${LINE}" stroke-width="2.4" stroke-dasharray="9 6"/>`;
  }
  for (const m of marks) {
    const px = PAD.l + m.f * PW;
    if (m.t === 'label') s += text(px, y(m.v), m.s, { anchor: m.anchor, size: m.size, fill: m.fill === 'move' ? MOVE : m.fill, dx: m.dx });
    if (m.t === 'move') {
      s += `<line x1="${px.toFixed(1)}" y1="${y(m.from).toFixed(1)}" x2="${px.toFixed(1)}" y2="${y(m.to).toFixed(1)}" stroke="${MOVE}" stroke-width="2.6"/>`;
      for (const v of [m.from, m.to]) s += `<line x1="${(px - 9).toFixed(1)}" y1="${y(v).toFixed(1)}" x2="${(px + 9).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="${MOVE}" stroke-width="2.6"/>`;
    }
    if (m.t === 'dot') s += `<circle cx="${px.toFixed(1)}" cy="${y(m.v).toFixed(1)}" r="7" fill="none" stroke="${LINE}" stroke-width="2.6"/>`;
    if (m.t === 'tick') s += `<line x1="${px.toFixed(1)}" y1="${y(m.from).toFixed(1)}" x2="${px.toFixed(1)}" y2="${y(m.to).toFixed(1)}" stroke="${MUTED}" stroke-width="1.8" stroke-dasharray="5 5"/>`;
  }
  s += text(W - PAD.r, H - 22, FOOTNOTE, { anchor: 'end', size: 15, weight: 400, fill: MUTED });
  return s + `</svg>`;
}

function loadSharp() {
  try { return require('sharp'); } catch (e) {
    console.error('This script needs sharp, which is not a project dependency (the site build needs no binaries).');
    console.error('Install it for this run only:  npm install --no-save sharp');
    process.exit(2);
  }
}

function validate(draw, where) {
  const problems = [];
  if (!Array.isArray(draw.waypoints) || draw.waypoints.length < 2) problems.push('draw.waypoints must have at least 2 points');
  else {
    for (const wp of draw.waypoints) {
      if (!Array.isArray(wp) || wp.length !== 2 || wp.some((n) => typeof n !== 'number')) { problems.push(`bad waypoint ${JSON.stringify(wp)} — expected [fraction, value]`); break; }
    }
  }
  if (draw.neckline && (!Array.isArray(draw.neckline) || draw.neckline.length !== 4)) problems.push('draw.neckline must be [f1, v1, f2, v2]');
  for (const m of draw.marks || []) {
    if (!['label', 'move', 'dot', 'tick'].includes(m.t)) problems.push(`unknown mark type "${m.t}"`);
  }
  return problems.map((p) => `${where}: ${p}`);
}

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const check = args.includes('--check');

let data;
try {
  data = JSON.parse(fs.readFileSync(path.join('data', 'patterns.json'), 'utf8'));
} catch (e) {
  console.error(`Could not read data/patterns.json (${e.code === 'ENOENT' ? 'not found — run this from the repo root' : e.message}).`);
  process.exit(2);
}
const records = (Array.isArray(data) ? data : data.patterns || []).filter((r) => !only || r.slug === only);
if (only && !records.length) { console.error(`No pattern with slug "${only}" in data/patterns.json.`); process.exit(2); }

const sharp = loadSharp();
const errors = [];
let drawn = 0, unchanged = 0, handSupplied = [];

(async () => {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  for (const rec of records) {
    for (const [i, c] of (rec.charts || []).entries()) {
      const where = `${rec.slug} chart ${i + 1} (${c.file || 'no filename'})`;
      if (!c.draw) { handSupplied.push(where); continue; }
      if (!c.file) { errors.push(`${where}: chart has a draw block but no file name`); continue; }
      const bad = validate(c.draw, where);
      if (bad.length) { errors.push(...bad); continue; }
      const out = path.join(IMG_DIR, c.file);
      const buf = await sharp(Buffer.from(svg(c.draw))).resize(W, H).webp({ quality: 92 }).toBuffer();
      const same = fs.existsSync(out) && Buffer.compare(fs.readFileSync(out), buf) === 0;
      if (same) { unchanged++; console.log(`= ${c.file} (unchanged)`); continue; }
      if (check) { console.log(`~ ${c.file} WOULD CHANGE`); drawn++; continue; }
      fs.writeFileSync(out, buf);
      drawn++;
      console.log(`✓ wrote ${out}`);
    }
  }
  for (const h of handSupplied) console.log(`- ${h}: no draw block — hand-supplied image, left as is`);
  if (errors.length) {
    console.error('\n❌ DRAW SPEC INVALID:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`\n✅ ${drawn} chart(s) ${check ? 'would change' : 'written'}, ${unchanged} already up to date.`);
})();
