#!/usr/bin/env node
/**
 * scripts/check-nap.js — NAP guard (runs on every Vercel build via package.json "build").
 * Fails the build (exit 1) if any PUBLIC *.html contains:
 *   - an Indian mobile number other than 9993906449, or
 *   - a 6-digit pincode other than 462011.
 * Admin/internal pages and node_modules/docs are excluded.
 * Single source of truth: nap-data.json.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const CORRECT_PHONE = '9993906449';
const CORRECT_PIN = '462011';

// Internal/admin pages are not public-facing NAP surfaces.
const EXCLUDE_FILES = new Set([
  'crm.html',
  'blog-studio.html',
  'og-generator.html',
  'blog-template.html',
  'market_credo_bloomberg.html',
  'chips-variants-preview.html',
  'mobile.html',
]);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'docs', 'vendor', 'templates', 'data', 'partials']);

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) walk(path.join(dir, entry.name), acc);
    } else if (entry.name.endsWith('.html') && !EXCLUDE_FILES.has(entry.name)) {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

// Matches Indian mobile numbers with optional +91 / spacing / dashes.
const PHONE_RE = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;
// Standalone 6-digit token (pincode candidate).
const PIN_RE = /(?<!\d)\d{6}(?!\d)/g;

const root = process.cwd();
const files = walk(root, []);
const errors = [];

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');

  for (const m of html.match(PHONE_RE) || []) {
    const last10 = m.replace(/\D/g, '').slice(-10);
    if (last10.length === 10 && last10 !== CORRECT_PHONE) {
      errors.push(`${rel}: wrong phone "${m.trim()}" (normalised ${last10}) — expected ${CORRECT_PHONE}`);
    }
  }

  for (const m of html.match(PIN_RE) || []) {
    if (m !== CORRECT_PIN) {
      errors.push(`${rel}: unexpected 6-digit number "${m}" — expected pincode ${CORRECT_PIN}`);
    }
  }
}

if (errors.length) {
  console.error('❌ NAP check FAILED:');
  for (const e of [...new Set(errors)]) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✅ NAP check passed — ${files.length} public HTML files scanned; only phone ${CORRECT_PHONE} and pincode ${CORRECT_PIN} present.`);
