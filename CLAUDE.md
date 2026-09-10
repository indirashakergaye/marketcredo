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

### Banned words — two tiers (enforced by scripts/check-compliance.js)
These are checked in page text, meta tags, alt attributes and JSON-LD
(case-insensitive, whole-word). The list here is the single source of truth,
mirrored by the TIER1/TIER2 arrays in the guard.

**Tier 1 — HARD BLOCK (SEBI Advertisement Code). Any occurrence fails the build.**
Never write these superlatives / standing or outcome claims anywhere:
best, No. 1, number one, top-rated, leading, premier, finest, unmatched,
guaranteed, assured, sure shot, accuracy %, multibagger

**Tier 2 — WARN ONLY (trading vocabulary). The build passes; hits are printed for
human review.** These are legitimate in an educational sentence ("we do not give
tips or signals") but must never appear as a recommendation — review each in
context, do not blanket-remove:
tips, calls, signals, target, stop loss, profit, returns, earn

**Documented exemption:** `terms.html` §9 "No Guaranteed Returns" is a
SEBI-protective legal disclaimer whose exact wording ("no guaranteed or assured
returns") is required and must never be reworded or removed. The guard exempts
that one comment-delimited block (between the `<!-- 9. ... -->` and
`<!-- 10. ... -->` markers) via `EXEMPT_REGIONS` in check-compliance.js — a narrow
region skip, NOT a file-level skip; the rest of terms.html is still scanned. If
that block is edited so a marker moves, the exemption self-disables and the words
re-flag.

### Never
- Never invent a testimonial, review, student name, statistic or outcome.
- Never add Review or AggregateRating schema for a review you cannot verify
  exists in the repo or in a source I have given you.
- Never write market commentary, price levels, or anything naming a specific
  security.
- Never reference ScoutStack. It is a separate brand with a separate NAP.

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
- Plain static HTML at repo root. No framework, no bundler, no HTML templating.
- Vercel, `cleanUrls: true`, `trailingSlash: false`. URL = filename minus .html.
- Build: `node scripts/check-nap.js && node scripts/build-sitemap.js && node scripts/build-rss.js`
- `check-nap.js` fails the build on a wrong phone or pincode. Follow this pattern
  for any new guard.
- `build-sitemap.js` already derives lastmod from git commit dates.
- No partials: all 26 pages repeat nav and footer as literal HTML.
- JSON-LD is hardcoded per page (33 inline blocks). No shared schema source.
- `site-loader.js` and `/site-data.json` are ORPHANED DEAD CODE — not referenced
  by any live page and never fetched. All user-visible text and every JSON-LD
  value are static in the raw HTML; editing site-data.json has no effect.
- Admin pages (/crm, /blog-studio, /og-generator) are Basic-auth gated in
  middleware.js and excluded from the sitemap.

## Conventions
- URLs: clean, no trailing slash, no .html. Never change a live URL without
  adding a 301.
- Internal links: root-relative (`/about`), never relative (`about`, `../about`).
  The existing nav uses relative links in ~115 places — that is a known debt to
  fix before any nested directory is added, not a precedent to follow.
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
