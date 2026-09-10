#!/usr/bin/env node
/**
 * scripts/exclude.js — single source of truth for pages kept OUT of generated
 * feeds. Both build-sitemap.js and build-rss.js import from here so a page is
 * never syndicated in one feed but hidden in the other.
 *
 * EXCLUDE holds admin tools, the blog template, thank-you (noindex), the legal
 * utility pages, and the three noindexed blog posts (a noindexed page must not
 * appear in the sitemap OR the RSS feed). EXCLUDE_DIRS holds non-public trees.
 */
'use strict';

const EXCLUDE = new Set([
  'crm.html', 'blog-studio.html', 'og-generator.html', 'blog-template.html',
  'market_credo_bloomberg.html', 'chips-variants-preview.html', 'mobile.html',
  'thank-you.html', 'privacy.html', 'terms.html', '404.html',
  'head-shoulders-pattern-guide.html', 'rsi-better-entry-points.html', 'top-5-candlestick-patterns.html',
]);

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'docs', 'vendor', 'templates', 'scripts', 'api', 'data', 'partials']);

module.exports = { EXCLUDE, EXCLUDE_DIRS };
