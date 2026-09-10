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
