# Market Credo — marketcredo.in

Technical analysis training institute in Bhopal, India. Marketing site.

## Business facts (use these verbatim; never invent or alter)

- Name: Market Credo
- Address: Plot No 83, Shrinivas Tower, M.P. Nagar Zone II, Bhopal, Madhya Pradesh 462011
- Phone: +91 99939 06449 / Email: info@marketcredo.in
- Hours: Monday–Saturday, 9:00 AM – 10:00 PM
- Geo: 23.2332, 77.4347
- Trainer: Atish Shakergaye, SEBI Registered Research Analyst, reg. INH000006086
- Course: Technical Analysis & Chart Reading. 2 months, 52 modules, ₹24,999,
  batches of 8–10 students, free 2-day demo
- YouTube: https://www.youtube.com/@MarketCredo

## Hard rules — do not break these

1. **NEVER add `Review` or `AggregateRating` schema anywhere on this site.**
   Google ignores self-serving review markup, and the owner is a SEBI-registered
   research analyst where testimonial advertising is restricted.
2. **NEVER mark up content in JSON-LD that is not visibly rendered on the page.**
   Google treats that as structured data spam and it can trigger a manual action.
3. **NEVER write marketing copy containing** guaranteed returns, profit claims,
   past performance, buy/sell recommendations, or superlatives like "best",
   "No. 1", "leading", "top". This is a regulatory constraint, not a style
   preference.
4. **NEVER delete article content when consolidating pages.** Migrate it.
   If you believe content should be removed, ask first.
5. **Do not change pricing, the trainer's credentials, or the SEBI registration
   number** under any circumstance.

## Conventions

- Every page needs a unique title under 60 characters and a self-referencing canonical.
- JSON-LD `@id` values form one entity graph. Keep these exact:
  - `https://www.marketcredo.in/#organization`
  - `https://www.marketcredo.in/about#atish`
- Redirects must resolve in a single hop. No chains.
- Mobile-first. Target LCP under 2.5s on mobile.

## Working style for this repo

- One ticket per commit, message prefixed with the ticket ID (e.g. `SITEMAP-01: ...`).
- Before editing an unfamiliar area, read the surrounding files first.
- After any change touching routes or the sitemap, print the resulting URL list.
- If a ticket's assumption does not match the codebase, **stop and report it**
  rather than improvising a fix. The tickets were written by auditing the live
  site from outside, not by reading this source — so the code is the authority.

## Where the work is defined

All 20 tickets live in `docs/seo-tickets.md`. Read that file before starting
any implementation session.
