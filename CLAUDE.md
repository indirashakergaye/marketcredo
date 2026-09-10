# Market Credo — repo context for Claude Code

## What this is
Static marketing site for Market Credo, a technical analysis training institute
in M.P. Nagar Zone II, Bhopal. Deployed on Vercel from `master`. Every push to
master goes live — treat master as production.

## Non-negotiable compliance rules
This site is operated by a SEBI Registered Research Analyst. Two SEBI frameworks
bind every word of copy. Violating them is a regulatory problem, not a style
problem.

1. **30-day price-data rule** (SEBI circular 8 May 2026, effective 1 July 2026).
   Educational entities must not discuss or display the name of any security
   using price data from the preceding 30 days in a way that indicates future
   prices, advice or recommendations. Applies to text, charts, screenshots,
   tickers and code names. Any named security must use data at least 30 days
   old, with the date range labelled on the image.

2. **SEBI Advertisement Code.** No superlatives endorsing quality or standing.
   No return or profit claims. No past performance. No misleading testimonials.
   No SEBI logo. No celebrities.

### Banned words — scope-aware, enforced by scripts/check-compliance.js
Checked in page text, meta tags, alt attributes and JSON-LD (case-insensitive,
whole-word). This is the single source of truth, mirrored by the
CLAIM/SUBJECTIVE/TIER2 arrays in the guard.

**Why scope matters:** a superlative about *our own institute* ("Bhopal's premier
institute," "the best course") is SEBI Advertisement Code exposure. The same word
inside *teaching prose about a market concept* ("the most powerful reversal
signal," "RSI works best at support") is not a claim about us — it is educational
copy. So the rule is split by where the word appears.

**CLAIM — HARD BLOCK EVERYWHERE (fails the build), no exception.** Standing
superlatives and outcome/return claims, wherever they appear — marketing page or
blog, title, meta, JSON-LD or body:
guaranteed, assured, sure shot, accuracy %, multibagger, premier, No. 1, #1,
number one, number 1, top-rated, finest, unmatched, top institute,
India's best, Bhopal's best
(`No. 1` requires the period form — it does NOT match "no 1:2 ratio".)

**SUBJECTIVE — HARD BLOCK on marketing copy, WARN-ONLY in blog body.** These are
hard-blocked on the marketing pages (index, bhopal-stock-market-course, courses,
about, faq, videos, life, testimonials) AND inside any blog post's title, meta
tags and JSON-LD. Inside `blog/*.html` **body prose only**, they drop to warn-only
(teaching language, not a claim about us):
best, leading, most powerful, world-class, most trusted, most respected

**TIER 2 — WARN ONLY everywhere. The build passes; hits are printed for review.**
Legitimate in an educational sentence ("we do not give tips or signals") but never
as a recommendation — review each in context, do not blanket-remove:
tips, calls, signals, target, stop loss, profit, returns, earn

**Documented exemption:** `terms.html` §9 "No Guaranteed Returns" is a
SEBI-protective legal disclaimer whose exact wording ("no guaranteed or assured
returns") is required and must never be reworded or removed. The guard exempts
that one comment-delimited block (between the `<!-- 9. ... -->` and
`<!-- 10. ... -->` markers) via `EXEMPT_REGIONS` in check-compliance.js — a narrow
region skip, NOT a file-level skip; the rest of terms.html is still scanned. If
that block is edited so a marker moves, the exemption self-disables and the words
re-flag.

**Testimonial exemption:** the testimonials block in
`bhopal-stock-market-course.html` (between the `<!-- TESTIMONIALS -->` and
`<!-- FAQ -->` markers) is exempt via `EXEMPT_REGIONS`. Reason: quoted
third-party (student) speech is not our marketing copy — rewording a real review
to remove a superlative would fabricate the testimonial, which is worse than the
word. The banned-word rules bind OUR copy, not what a student is quoted saying.
Same narrow region-skip pattern as the terms.html §9 exemption.

**Quoted-warning exemption:** the "Realistic claims" bullet in
`blog/start-trading-journey.html` quotes the exact phrase scammers use
("guaranteed returns") in order to warn readers away from it. A banned phrase
quoted to warn against it is not a claim — rewording it would weaken the
investor-protection message to satisfy a lint rule. Exempt via `EXEMPT_REGIONS`,
scoped to that single list item only.

### Never
- Never invent a testimonial, review, student name, statistic or outcome.
- Never add Review or AggregateRating schema for a review you cannot verify
  exists in the repo or in a source I have given you.
- Never write market commentary, price levels, or anything naming a specific
  security.
- Never reference ScoutStack. It is a separate brand with a separate NAP.
- Never name a specific security alongside a price level, a chart example, or an
  outcome. Teaching examples use generic placeholders ("a stock at Rs 2,500",
  "Stock A") or schematic charts with no ticker. Naming an index as an index is
  fine; naming it with a price level is not. /blog/nifty-weekly-outlook is the
  model — it states outright that no specific prices are used, on purpose.

## Canonical facts — use these exactly, never from memory
Name:    Market Credo
Trainer: Atish Shakergaye
Address: Plot No. 83, Shrinivas Tower, M.P. Nagar Zone II, Bhopal, Madhya Pradesh 462011
Phone:   +91 99939 06449
Email:   info@marketcredo.in
Hours:   Mon-Sat 09:00-22:00 IST
Geo:     23.2332, 77.4347
SEBI Reg: INH000006086 (Research Analyst)
Brand colour: #28A064
Course: Technical Analysis & Chart Reading, 2 months, classroom, batches of 8-10,
Rs 24,999, free 2-day demo, completion certificate, 52 modules, 60+ patterns.

The old phone number 8827979008 belongs to a different brand. If you ever find
it in this repo, that is a bug — flag it, do not "fix" it silently.

## Section 3b compliance route
The SEBI registration number INH000006086 and the "SEBI Registered Research
Analyst" credential may be used in page copy, titles, meta descriptions and
footer — they are factual disclosures, not endorsements. What must never appear
is any superlative endorsing quality or standing, any return or profit claim, or
any past performance reference. The Tier 1 word list is the binding constraint;
the credential is not. Decision by the registered analyst, 10 Sep 2026.

## Repo structure — known facts
- Plain static HTML at repo root. No framework, no bundler, no runtime templating.
  There is now a build-time generator and shared chrome partials — see below.
- Vercel, `cleanUrls: true`, `trailingSlash: false`. URL = filename minus .html.
- The guards scan every public page. Not public, and skipped: the admin tools, the
  blog template and the bloomberg mock — `scripts/exclude.js` is the list.
- Build: `node scripts/check-nap.js && node scripts/check-compliance.js && node scripts/build-sitemap.js && node scripts/build-rss.js`
  `build-patterns.js`, `make-schematic-chart.js`, `build-og.js` and
  `migrate-chrome.js` are NOT wired into `npm run build` — run them by hand and
  commit their output.
- `check-nap.js` fails the build on a wrong phone or pincode. Follow this pattern
  for any new guard.
- `check-compliance.js` fails the build on any Tier-1 (CLAIM) banned word; Tier-2
  hits print for review but do not block. See the banned-words section above.
- `build-sitemap.js` already derives lastmod from git commit dates.
- **Shared chrome partials** live in `partials/`: `head.html`, `nav.html`,
  `footer.html`, `tail.html`. Most pages now carry the canonical nav and footer
  byte-for-byte — every blog post, every generated chart-pattern page, and the
  newer top-level pages. A handful of older pages still carry hand-written chrome,
  and this is the list to check before touching shared markup: index,
  bhopal-stock-market-course, courses, life, blog, blog-template, thank-you and
  the three admin pages. For the split as it stands today, compare
  each page's `<nav class="navbar">` and `<footer id="contact">` against the
  partials (whitespace-normalised) rather than trusting a count written here.
  **The partials are build-time sources, NOT runtime includes. Nothing fetches
  them in the browser. Editing a partial does NOT update the pages that use it —
  each page holds its own copy of the chrome, and `scripts/migrate-chrome.js` has
  to be re-run to re-stamp them.** Change shared chrome in two steps, always: edit
  the partial, then re-stamp.
- `scripts/migrate-chrome.js` stamps the nav/footer partials into a page. It
  replaces ONLY the `<nav class="navbar">` and `<footer id="contact">` elements
  and never touches `<head>`, JSON-LD, the WhatsApp float or trailing scripts.
  The decision gate is `scripts/verify-chrome-migration.js`: a page is rewritten
  only if the normalized diff — every internal href/src resolved to absolute,
  whitespace collapsed — is identical, i.e. nothing changed but link form.
  Anything else is reported MANUAL and left untouched. Use it for the remaining
  pages rather than hand-editing chrome.
- **Pattern pages are generated, never hand-written.** `scripts/build-patterns.js`
  builds `/chart-patterns/<slug>.html` from `data/patterns.json` using the
  partials plus an inline `schema()`. Edit the JSON, re-run the script; never edit
  the generated HTML. CHART GATE: the run exits 1 unless every pattern has at
  least 2 charts whose WebP actually exists in `images/chart-patterns/` and that
  carry alt text — the guard against shipping text-only pattern pages. Pages are
  still written when the gate fails, with visible placeholders, so a failing run
  must not be committed. Which pattern pages exist is whatever `data/patterns.json`
  defines — read the JSON, do not count the files.
- **The charts are generated from data too.** `scripts/make-schematic-chart.js`
  draws each chart from the `draw` block on its chart record — a synthetic price
  path, an optional neckline and a list of annotation marks — and writes the WebP
  into `images/chart-patterns/`. Synthetic means no named security and no real
  price data, which is what keeps the pattern pages clear of the 30-day rule; every
  image carries a footer note saying so. Output is deterministic, so re-running on
  unchanged data produces no diff, and `--check` reports what would change without
  writing. A chart record with no `draw` block is a hand-supplied image and is left
  alone. The script needs sharp, installed for the run only
  (`npm install --no-save sharp`) and deliberately not a project dependency — the
  site build needs no binaries.
- `scripts/exclude.js` is the single source of truth for what stays out of the
  generated feeds: `EXCLUDE` (admin tools, blog-template, the bloomberg mock,
  thank-you, privacy, terms, 404, and the three noindexed blog posts) and
  `EXCLUDE_DIRS` (non-public trees). Both `build-sitemap.js` and `build-rss.js`
  import it, so a page can never be syndicated in one feed and hidden in the
  other. Add exclusions there, not in either builder.
- JSON-LD is hardcoded per page — one `@graph` block per page as the rule, though
  a few pages carry more than one. No shared schema source, except pattern pages
  whose graph comes from build-patterns.js.
- `site-loader.js` and `/site-data.json` are ORPHANED DEAD CODE — not referenced
  by any live page and never fetched. All user-visible text and every JSON-LD
  value are static in the raw HTML; editing site-data.json has no effect.
- Admin pages (/crm, /blog-studio, /og-generator) are Basic-auth gated in
  middleware.js and excluded from the sitemap.
- `9f2c6a4e8b1d47f0a3e5c7b9d1f3a5e7.txt` at the root is the IndexNow key file
  (its content is the key itself), matched by the default `INDEXNOW_KEY` in
  `api/publish-file.js`. It is live verification, not junk — never delete or
  rename it.

## Conventions
- URLs: clean, no trailing slash, no .html. Never change a live URL without
  adding a 301.
- Internal links: root-relative (`/about`), never relative (`about`, `../about`).
  The nav and footer debt is cleared on the migrated pages and in the partials,
  which are root-relative throughout — that is why /chart-patterns/ could be added
  safely. A couple of hundred relative hrefs still remain in body copy and on the
  pages that carry hand-written chrome — a real cleanup, not a five-minute one.
  Still debt, still not a precedent: write new links root-relative.
- Titles: under 60 characters. Meta descriptions: 140-155 characters. Every page
  unique.
- Exactly one `<h1>` per page. Real semantic heading elements, never styled divs.
- Images: WebP, descriptive filename, descriptive alt text, explicit width and
  height.
- Schema: one `<script type="application/ld+json">` per page using `@graph`.

## How to work in this repo
- Do one batch of work at a time. Show me the diff before committing.
- Never push directly to master. Branch, then PR.
- After any change, tell me exactly which URLs are affected and what to check.
- If a task requires content I have not given you (a chart, a real review, a
  student quote), stop and ask. Do not fill the gap.
