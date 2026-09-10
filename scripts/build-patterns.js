#!/usr/bin/env node
/**
 * scripts/build-patterns.js — generates /chart-patterns/<slug>.html from data/patterns.json
 * + shared partials (partials/head.html, nav.html, footer.html) + a schema() function.
 *
 * CHART GATE: no pattern page ships without >= 2 annotated charts. A chart is
 * "satisfied" only when its image file actually exists in images/chart-patterns/ AND it
 * has non-empty alt text. Missing image → a visible placeholder is rendered AND the
 * build FAILS (exit 1), listing exactly which charts are still needed. This is the
 * guard against "60 pages of text with no charts".
 *
 * Output is COMMITTED to the repo (so the three build guards scan the real bytes and
 * build-sitemap derives a stable git lastmod). Run manually: `node scripts/build-patterns.js`.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.marketcredo.in';
const root = process.cwd();
const IMG_DIR = path.join('images', 'chart-patterns');

const head = fs.readFileSync(path.join('partials', 'head.html'), 'utf8');
const nav = fs.readFileSync(path.join('partials', 'nav.html'), 'utf8');
const footer = fs.readFileSync(path.join('partials', 'footer.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join('data', 'patterns.json'), 'utf8'));
const records = Array.isArray(data) ? data : (data.patterns || []);

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function chartReady(c) {
  return !!(c.file && c.alt && c.alt.trim() && fs.existsSync(path.join(IMG_DIR, c.file)));
}

// Validate the chart requirement. Returns an array of human-readable problems.
function chartProblems(rec) {
  const charts = rec.charts || [];
  const problems = [];
  if (charts.length < 2) problems.push(`only ${charts.length} chart(s) defined — need at least 2`);
  charts.forEach((c, i) => {
    if (!c.alt || !c.alt.trim()) problems.push(`chart ${i + 1} has no alt text`);
    if (!c.file || !fs.existsSync(path.join(IMG_DIR, c.file))) {
      problems.push(`chart ${i + 1} image not supplied yet (${c.file || 'no filename'})`);
    }
  });
  return problems;
}

function schema(rec) {
  const url = `${BASE}/chart-patterns/${rec.slug}`;
  const graph = [
    {
      '@type': ['Organization', 'EducationalOrganization'],
      '@id': `${BASE}/#organization`,
      'name': 'Market Credo',
      'url': BASE,
      'telephone': '+91-9993906449',
      'email': 'info@marketcredo.in',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Plot No 83, Shrinivas Tower, M.P. Nagar Zone II',
        'addressLocality': 'Bhopal', 'addressRegion': 'Madhya Pradesh',
        'postalCode': '462011', 'addressCountry': 'IN'
      }
    },
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${BASE}/` },
        { '@type': 'ListItem', 'position': 2, 'name': 'Chart Patterns', 'item': `${BASE}/chart-patterns` },
        { '@type': 'ListItem', 'position': 3, 'name': rec.breadcrumb || rec.h1, 'item': url }
      ]
    },
    {
      '@type': ['Article', 'LearningResource'],
      'headline': rec.title,
      'description': rec.metaDescription,
      'mainEntityOfPage': url,
      'author': {
        '@type': 'Person', '@id': `${BASE}/about#trainer`,
        'name': 'Atish Shakergaye', 'jobTitle': 'SEBI Registered Research Analyst', 'url': `${BASE}/about`
      },
      'publisher': { '@id': `${BASE}/#organization` },
      'image': `${BASE}/images/og-default.jpg`,
      'inLanguage': 'en',
      'learningResourceType': 'Chart pattern guide',
      'educationalLevel': 'Beginner to Advanced',
      'about': rec.about || ['Technical Analysis', 'Chart Patterns']
    }
  ];
  if (rec.faqs && rec.faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      'mainEntity': rec.faqs.map((f) => ({
        '@type': 'Question', 'name': f.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
      }))
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

function renderChart(c) {
  if (chartReady(c)) {
    return `<figure class="chart-slot">` +
      `<img src="/images/chart-patterns/${esc(c.file)}" alt="${esc(c.alt)}" width="${c.width || 1200}" height="${c.height || 675}" loading="lazy"/>` +
      `<figcaption>${esc(c.caption || '')}</figcaption></figure>`;
  }
  // Placeholder: visibly flags the gap and keeps the required alt in the markup.
  return `<figure class="chart-slot chart-missing">` +
    `<div class="chart-placeholder" role="img" aria-label="${esc(c.alt)}">` +
    `<strong>CHART REQUIRED — not yet supplied</strong><span>${esc(c.alt)}</span></div>` +
    `<figcaption>${esc(c.caption || '')}</figcaption></figure>`;
}

function renderBody(rec) {
  let s = '';
  s += `<section class="hero" id="home"><div class="wrap" style="max-width:860px;">` +
    `<span class="awardline"><span class="st">&#9733;</span> ${esc(rec.eyebrow)}</span>` +
    `<h1 class="hh">${esc(rec.h1)}</h1>` +
    `<p class="lede">${esc(rec.intro)}</p></div></section>`;

  s += `<section><div class="wrap" style="max-width:820px;">`;
  if (rec.charts[0]) s += renderChart(rec.charts[0]);
  (rec.sections || []).forEach((sec, i) => {
    s += `<div class="sh reveal"><h2>${esc(sec.h2)}</h2></div>${sec.html}`;
    if (i === 1 && rec.charts[1]) s += renderChart(rec.charts[1]);
  });
  s += `</div></section>`;

  if (rec.faqs && rec.faqs.length) {
    s += `<section id="faq" style="background:var(--mint);"><div class="wrap" style="max-width:820px;">` +
      `<div class="sh reveal"><span class="kpill">Questions?</span><h2>Frequently asked <span class="g">questions.</span></h2></div>` +
      `<div class="faq-wrap reveal">`;
    rec.faqs.forEach((f, i) => {
      s += `<details class="faq"${i === 0 ? ' open' : ''}><summary>${esc(f.q)}<span class="qi">+</span></summary><div class="fa">${esc(f.a)}</div></details>`;
    });
    s += `</div></div></section>`;
  }

  s += `<section class="lead" id="enquire"><div class="wrap" style="text-align:center;max-width:720px;">` +
    `<h2>Learn to read chart patterns properly.</h2>` +
    `<p>Study chart structure and price action from first principles with SEBI-registered analyst Atish Shakergaye. Start with a free 2-day demo.</p>` +
    `<div class="hero-cta" style="justify-content:center;">` +
    `<a class="btn btn-green" href="https://wa.me/919993906449?text=Hello%20Market%20Credo!%20I%20want%20to%20learn%20chart%20patterns." target="_blank" rel="noopener">WhatsApp Us &rarr;</a>` +
    `<a class="btn btn-ghost" href="tel:+919993906449">Call +91 99939 06449</a></div></div></section>`;
  return s;
}

function buildPage(rec) {
  const url = `${BASE}/chart-patterns/${rec.slug}`;
  const jsonld = JSON.stringify(schema(rec), null, 2);
  const headOut = head
    .replace(/{{TITLE}}/g, esc(rec.title))
    .replace(/{{DESCRIPTION}}/g, esc(rec.metaDescription))
    .replace(/{{CANONICAL}}/g, url)
    .replace('{{JSONLD}}', jsonld);
  return `${headOut}\n${nav}\n<main id="main">\n${renderBody(rec)}\n</main>\n${footer}`;
}

fs.mkdirSync('chart-patterns', { recursive: true });
const failures = [];
for (const rec of records) {
  fs.writeFileSync(path.join('chart-patterns', `${rec.slug}.html`), buildPage(rec));
  console.log(`✓ wrote chart-patterns/${rec.slug}.html`);
  const problems = chartProblems(rec);
  if (problems.length) failures.push({ slug: rec.slug, problems });
}

if (failures.length) {
  console.error('\n❌ CHART GATE FAILED — pages were generated but charts are missing:');
  for (const f of failures) {
    console.error(`  ${f.slug}:`);
    f.problems.forEach((p) => console.error(`    - ${p}`));
  }
  console.error('\nProduce each chart (see the "spec" field on every chart record), drop the WebP');
  console.error(`into ${IMG_DIR}/, then re-run. No pattern page ships without >= 2 annotated charts.`);
  process.exit(1);
}
console.log(`✅ ${records.length} pattern page(s) built; all have >= 2 charts with alt text.`);
