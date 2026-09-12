# marketcredo.in — SEO & AI Visibility Tickets

> **Revised after codebase recon, 12 Sep 2026. The original audit was done from the
> live site and got 7 tickets wrong.** Already implemented (NOT APPLICABLE inline):
> SITEMAP-01, SITEMAP-02, SCHEMA-01, SCHEMA-04, SCHEMA-05. Two false premises
> corrected: P1's "no JSON-LD exists" and GA4-01's "zero measurement". Codebase is
> the authority.

Audit date: 11 September 2026. Twenty tickets in three priority groups.

**Important context:** this audit was performed by inspecting the live site from
outside — page HTML, sitemap, robots.txt — not by reading this source. Where a
ticket's assumption contradicts the codebase, **the codebase is right**. Stop and
report the contradiction rather than forcing the fix.

Estimated total: 14–20 hours.

| Group | Tickets | Est. | Why |
|---|---|---|---|
| P0 · Defects | 7 | 5–7 hrs | Live bugs: content Google can't find, duplicate pages competing, empty page indexed |
| P1 · Schema | 3 left | 2–3 hrs | JSON-LD already sitewide; only SCHEMA-02/06/07 remain |
| P2 · Tracking | 6 | 4–7 hrs | GA4 + events already live; gaps in event coverage/attribution |

Suggested order: all of P0 → GA4-01 (so measurement is live before traffic
changes) → P1 → rest of P2.

---

# P0 — Live defects

These cost traffic today. No design or content decisions needed.

## SITEMAP-01 — Three blog posts missing from sitemap.xml

> **NOT APPLICABLE — already handled, working as intended.** These three are
> deliberately noindexed and excluded from sitemap.xml via `scripts/exclude.js`
> (thin/duplicate content being retired through DUPE-01). Not a generator bug —
> do not add them back.

The blog index links to 9 posts. `sitemap.xml` contains 6. These three are live
and linked but absent:

- `/blog/top-5-candlestick-patterns`
- `/blog/rsi-better-entry-points`
- `/blog/head-shoulders-pattern-guide`

The last is a ~4,500-word article — the strongest single piece of content on the
site — and search engines are not being pointed at it. Root cause is likely a
filter or hardcoded list in the sitemap generator.

**Done when**
- [ ] Sitemap generator enumerates all published posts rather than a fixed list
- [ ] All 9 blog URLs present in sitemap.xml
- [ ] Sitemap resubmitted in Google Search Console and Bing Webmaster Tools

## SITEMAP-02 — Every URL reports the same lastmod date

> **NOT APPLICABLE — already implemented.** `build-sitemap.js` already derives
> `<lastmod>` from each file's git commit date (not hardcoded). The uniform
> 2026-09-11 is a side-effect of recent batch commits; incremental commits produce
> varying dates. No generator change needed.

All 22 URLs currently carry `<lastmod>2026-09-11</lastmod>` — the build date,
not each page's actual modification date. When every page appears to change on
the same day, crawlers learn to ignore the signal entirely.

Fix the root cause in the generator. Do not hardcode dates.

**Done when**
- [ ] `lastmod` derives from each page's real content-modified timestamp
- [ ] Dates vary across URLs in the generated sitemap
- [ ] A rebuild with no content change does not bump any lastmod

## DUPE-01 — Head & Shoulders exists as two competing pages

Two pages cover the identical topic, each declaring itself canonical:

- `/chart-patterns/head-and-shoulders` — ~1,200 words, in sitemap, fits the hub structure
- `/blog/head-shoulders-pattern-guide` — ~4,500–5,200 words with HDFC Bank and
  Nifty 50 worked examples, target calculation, volume confirmation, trading
  rules, FAQs. **Not in sitemap.**

They split each other's ranking signals, and the stronger one is the one search
engines cannot discover.

> **Do not delete any content.** Migrate the long article into the hub URL. The
> 1,200-word version can be discarded only where the 4,500-word version already
> covers that ground — if it says anything the long one doesn't, merge it in and
> show what was merged.

**Done when**
- [ ] Full long-form content lives at `/chart-patterns/head-and-shoulders`
- [ ] 301 redirect from `/blog/head-shoulders-pattern-guide` to the hub URL
- [ ] Blog index no longer links to the retired URL
- [ ] Single self-referencing canonical on the surviving page
- [ ] Word count verified as preserved after the move

## DUPE-02 — Candlestick post will collide with planned pattern pages

`/blog/top-5-candlestick-patterns` covers material that upcoming
`/chart-patterns/*` pages will target individually. Decide the structure now,
before twelve more pages are written into the same conflict.

Recommended: keep the blog post as an overview that links out to each individual
pattern page, and ensure it does not target any single pattern name on its own.

**Done when**
- [ ] Post reframed as an overview/index, linking to individual pattern pages
- [ ] Its title and H1 target the plural/overview term, not a single pattern

## INDEX-01 — Empty /chartboard is indexable, upload form unmoderated

`/chartboard` renders "No charts uploaded yet" and sits in the sitemap. An empty
indexed page drags on site-wide quality assessment. Separately it exposes a
public upload form (name, image, free text) with no visible moderation — a spam
and abuse vector.

**Done when**
- [ ] `<meta name="robots" content="noindex,follow">` on the page while empty
- [ ] URL removed from sitemap until it has content
- [ ] Server-side validation on upload: file type allowlist, size cap, text length limits
- [ ] Submissions land in a moderation queue; nothing publishes without approval
- [ ] Rate limiting on the endpoint
- [ ] noindex removed once 10+ approved charts are live

## DATE-01 — Blog index shows dates ~20 months older than the content

The index lists posts as Dec 2024 – Jan 2025. Opening a post shows
"Updated 9 Sep 2026". Visitors see apparently abandoned content before clicking.

**Done when**
- [ ] Index displays the updated date where one exists, falling back to publish date
- [ ] Both `datePublished` and `dateModified` stored per post (needed for SCHEMA-07)

## TITLE-01 — "Nifty Weekly Outlook: Key Levels to Watch" promises content it lacks

The post is a methodology guide and deliberately contains no price levels —
the correct editorial call. The title promises levels, so visitors bounce, and
for a SEBI-registered research analyst a "key levels to watch" headline reads
closer to a recommendation than to education.

```
Title: How to Read the Nifty Weekly Chart: A Framework
Slug:  /blog/how-to-read-nifty-weekly-chart
301:   /blog/nifty-weekly-outlook -> new slug
```

**Done when**
- [ ] Title, H1, meta description and slug updated
- [ ] 301 from the old URL

---

# P1 — Structured data

> **Premise corrected (12 Sep 2026):** JSON-LD already exists site-wide, inline in
> every content page's static HTML (Organization, Person, Course, FAQPage,
> BreadcrumbList, VideoObject, Article). SCHEMA-01, SCHEMA-04 and SCHEMA-05 are
> already implemented (NOT APPLICABLE below). **Only SCHEMA-02, SCHEMA-06 and
> SCHEMA-07 remain.** Keep `@id` values exactly as written — this site uses
> `/about#trainer` (not `#atish`). Only mark up content visibly present on the page.

## SCHEMA-01 — Organization + LocalBusiness, site-wide

> **NOT APPLICABLE — already implemented.** Organization/EducationalOrganization
> JSON-LD (@id `#organization`, address, geo, openingHours, real `sameAs`) is
> present site-wide, inline in each page's HTML.

Every page. Replace the `sameAs` placeholders with real profile URLs.

```json
{
  "@context": "https://schema.org",
  "@type": ["EducationalOrganization", "LocalBusiness"],
  "@id": "https://www.marketcredo.in/#organization",
  "name": "Market Credo",
  "description": "Technical analysis and chart reading institute in Bhopal, offering classroom training in chart structure, chart flow and chart behaviour.",
  "url": "https://www.marketcredo.in/",
  "telephone": "+91-99939-06449",
  "email": "info@marketcredo.in",
  "priceRange": "₹₹",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Plot No 83, Shrinivas Tower, M.P. Nagar Zone II",
    "addressLocality": "Bhopal",
    "addressRegion": "Madhya Pradesh",
    "postalCode": "462011",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 23.2332,
    "longitude": 77.4347
  },
  "areaServed": [
    { "@type": "City", "name": "Bhopal" },
    { "@type": "State", "name": "Madhya Pradesh" }
  ],
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    "opens": "09:00",
    "closes": "22:00"
  }],
  "sameAs": [
    "https://www.youtube.com/@MarketCredo",
    "https://www.instagram.com/REPLACE",
    "https://www.facebook.com/REPLACE"
  ],
  "founder": { "@id": "https://www.marketcredo.in/about#trainer" },
  "employee": { "@id": "https://www.marketcredo.in/about#trainer" }
}
```

**Done when**
- [ ] Present on all pages; `sameAs` URLs filled in
- [ ] Validates clean at validator.schema.org

## SCHEMA-02 — Person + credentials on /about

`/about` lists **13 certifications** from NISM, NSE, BSE and IRDA (2005–2018).
This is the site's strongest differentiator and is currently invisible to
machines. Three are shown below as a pattern — **read the actual page, extract
all 13 with exact names and issuing bodies, and include every one.** Print the
extracted list for review.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.marketcredo.in/about#trainer",
  "name": "Atish Shakergaye",
  "jobTitle": "Founder & Lead Trainer",
  "description": "SEBI Registered Research Analyst with over 20 years of experience in the Indian securities market. Teaches technical analysis and chart reading at Market Credo, Bhopal.",
  "url": "https://www.marketcredo.in/about",
  "worksFor": { "@id": "https://www.marketcredo.in/#organization" },
  "knowsAbout": [
    "Technical Analysis",
    "Chart Patterns",
    "Price Action",
    "Support and Resistance",
    "Indian Stock Market"
  ],
  "hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Professional Registration",
      "name": "SEBI Registered Research Analyst",
      "identifier": "INH000006086",
      "recognizedBy": {
        "@type": "GovernmentOrganization",
        "name": "Securities and Exchange Board of India",
        "url": "https://www.sebi.gov.in/"
      }
    },
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Certification",
      "name": "EXACT NAME FROM /about",
      "recognizedBy": {
        "@type": "Organization",
        "name": "National Institute of Securities Markets"
      }
    },
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Certification",
      "name": "EXACT NAME FROM /about",
      "recognizedBy": {
        "@type": "Organization",
        "name": "National Stock Exchange of India"
      }
    }
  ]
}
```

**Done when**
- [ ] All 13 certifications present with exact names and issuers
- [ ] Visible link added on /about to SEBI's public intermediary lookup so the
      registration can be independently verified

## SCHEMA-03 — Course + CourseInstance + Offer

On `/courses`, `/curriculum`, `/fees`, `/bhopal-stock-market-course`.

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": "https://www.marketcredo.in/courses#technical-analysis",
  "name": "Technical Analysis & Chart Reading",
  "description": "A 2-month classroom course covering 52 modules across chart structure, chart flow and chart behaviour, including support and resistance, trend lines, gap analysis and 60+ chart patterns.",
  "url": "https://www.marketcredo.in/courses",
  "provider": { "@id": "https://www.marketcredo.in/#organization" },
  "educationalLevel": "Beginner to Advanced",
  "inLanguage": ["en-IN", "hi-IN"],
  "teaches": [
    "Support and resistance",
    "Trend lines",
    "Gap analysis",
    "Chart patterns",
    "Price action reading"
  ],
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "Onsite",
    "courseWorkload": "P2M",
    "maximumAttendeeCapacity": 10,
    "location": {
      "@type": "Place",
      "name": "Market Credo",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Plot No 83, Shrinivas Tower, M.P. Nagar Zone II",
        "addressLocality": "Bhopal",
        "addressRegion": "Madhya Pradesh",
        "postalCode": "462011",
        "addressCountry": "IN"
      }
    },
    "instructor": { "@id": "https://www.marketcredo.in/about#trainer" }
  },
  "offers": {
    "@type": "Offer",
    "price": "24999",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "url": "https://www.marketcredo.in/fees",
    "category": "Paid"
  }
}
```

**Done when**
- [ ] Passes Google's Rich Results Test for Course

## SCHEMA-04 — FAQPage

> **NOT APPLICABLE — already implemented.** FAQPage JSON-LD exists on /faq,
> /bhopal-stock-market-course, /fees, /curriculum, / and blog posts — marking up
> only the visible Q&A.

On `/faq` and `/bhopal-stock-market-course` (which has a 9-question FAQ block).
Google retired FAQ rich results for most sites in 2023, but the markup still
helps AI engines parse the Q&A structure. Mark up only questions visible on the
page, verbatim.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the fee for the technical analysis course in Bhopal?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Technical Analysis & Chart Reading course at Market Credo, M.P. Nagar Bhopal, is priced at ₹24,999. It is a 2-month classroom programme covering 52 modules, taught in batches of 8 to 10 students."
      }
    },
    {
      "@type": "Question",
      "name": "Is there a free demo class?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Market Credo offers a 2-day demo class before enrolment so students can see the teaching method and curriculum before committing."
      }
    }
  ]
}
```

**Done when**
- [ ] Every marked-up question appears verbatim on the rendered page

## SCHEMA-05 — BreadcrumbList on nested pages

> **NOT APPLICABLE — already implemented.** BreadcrumbList JSON-LD is emitted on
> every /chart-patterns/* page (27 pages total), matching the visible breadcrumb.

All `/chart-patterns/*` pages. Generate per page, not hardcoded.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home",
      "item": "https://www.marketcredo.in/" },
    { "@type": "ListItem", "position": 2, "name": "Chart Patterns",
      "item": "https://www.marketcredo.in/chart-patterns" },
    { "@type": "ListItem", "position": 3, "name": "Head and Shoulders",
      "item": "https://www.marketcredo.in/chart-patterns/head-and-shoulders" }
  ]
}
```

**Done when**
- [ ] Generated dynamically per pattern page
- [ ] Visible breadcrumb UI matches the markup

## SCHEMA-06 — VideoObject for embedded videos

Six YouTube videos are embedded on `/videos` with no video markup. One block per
embed. `duration` is ISO 8601 (`PT9M32S`); `uploadDate` is the YouTube upload
date, not the page date.

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "VIDEO TITLE",
  "description": "One or two sentences describing what the video covers.",
  "thumbnailUrl": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
  "uploadDate": "2026-09-15T10:00:00+05:30",
  "duration": "PT9M32S",
  "embedUrl": "https://www.youtube.com/embed/VIDEO_ID",
  "contentUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "inLanguage": "hi-IN",
  "publisher": { "@id": "https://www.marketcredo.in/#organization" },
  "creator": { "@id": "https://www.marketcredo.in/about#trainer" }
}
```

If real YouTube metadata (video ID, duration, upload date) is not available in
the codebase, list what is needed rather than guessing.

**Done when**
- [ ] One block per embedded video, fields populated from real YouTube metadata

## SCHEMA-07 — Article markup + visible bylines on blog posts

Posts carry no per-post byline — only a general "curated by" line on the index.
For a site whose authority rests on one named, registered analyst, the author
signal should be explicit on every article.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "POST TITLE",
  "description": "Meta description text.",
  "datePublished": "2026-01-12T09:00:00+05:30",
  "dateModified": "2026-09-09T11:30:00+05:30",
  "author": { "@id": "https://www.marketcredo.in/about#trainer" },
  "publisher": { "@id": "https://www.marketcredo.in/#organization" },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.marketcredo.in/blog/POST-SLUG"
  },
  "image": "https://www.marketcredo.in/path/to/post-image.png"
}
```

**Done when**
- [ ] Visible byline on every post: "Atish Shakergaye, SEBI Registered Research
      Analyst", linking to /about
- [ ] Visible "Updated" date on posts and on all `/chart-patterns/*` pages

---

# P2 — Measurement and new assets

Without this group there is no way to tell whether any of the above produced
leads. **GA4-01 goes in early** despite sitting at P2 — it must be collecting
before traffic changes.

## GA4-01 — Conversion-event alignment

> **Premise corrected (12 Sep 2026):** GA4 is NOT missing. `G-5RJD0WSYV5` is
> installed site-wide; `mc-events.js` already fires `phone_click`, `whatsapp_click`
> and `review_click` (with page param); `lead.js` fires `generate_lead` and posts
> to `/api/lead`. The gap is event *alignment*, not "zero measurement".

Remaining work:
- Add the three missing events: `demo_form_submit`, `newsletter_signup`, `fees_page_view`.
- Fix the form-ID mismatch: `lead.js` expects `lf-*` IDs + `window.sendLead`, but the
  live demo form (courses) uses `fname`/`submitBooking()` and posts to `/api/lead`
  itself — so its `generate_lead` never fires. Reconcile so the demo form fires
  `demo_form_submit`.
- Mark the five events as conversions in the GA4 property.
- Link Search Console to GA4.

**Done when**
- [ ] `demo_form_submit`, `newsletter_signup`, `fees_page_view` fire, verified in GA4 DebugView
- [ ] Demo-form ID mismatch resolved so it reports a conversion
- [ ] Five events marked as conversions; Search Console linked to GA4

## WA-01 — Per-page WhatsApp prefill so enquiries self-identify

Every WhatsApp link currently sends identical prefilled text. Varying it per page
turns the inbox itself into an attribution report with no tooling.

```
/fees
  Hi, I saw the fees page - I want to book a free demo

/bhopal-stock-market-course
  Hi, I'm in Bhopal and want to join the demo class

/courses and /curriculum
  Hi, I have a question about the technical analysis course

/demo
  Hi, I want to book the free 2-day demo class

Google Business Profile link
  Hi, I found you on Google Maps

YouTube description link
  Hi, I watched your YouTube video
```

**Done when**
- [ ] Prefill text varies by source page
- [ ] Each link also fires `whatsapp_click` with the source page as a parameter

## PAGE-01 — New /demo landing page

"Book Free Demo" buttons are scattered with no single destination. One page
becomes the target for Google Business Profile, YouTube descriptions, the
Instagram bio and any future ads — and therefore the one place conversion can be
measured.

Build consistent with the existing design system. Read the other pages first;
do not invent a new visual language. Use placeholder copy marked `TODO`, not
lorem ipsum — final copy will be supplied.

Must contain:
- What the 2-day demo covers and how long each session runs
- What to bring; whether a laptop is needed
- Address, embedded map, nearby landmarks
- WhatsApp and `tel:` buttons, plus a short form (name, phone, preferred timing)
- Next batch date
- The standard SEBI risk disclaimer in the footer

**Done when**
- [ ] Page live at `/demo`, in sitemap, mobile-first
- [ ] Form submission fires `demo_form_submit`

## FILE-01 — llms.txt

Currently 404. Adoption is unproven — Google has said publicly it does not use
the file — so treat this as a cheap hedge, not a priority. Serve as `text/plain`
at `/llms.txt`.

```
# Market Credo

> Technical analysis and chart reading institute in M.P. Nagar Zone II,
> Bhopal, Madhya Pradesh. Classroom training led by Atish Shakergaye,
> a SEBI Registered Research Analyst (INH000006086) with 20+ years of
> experience in the Indian securities market.

Market Credo teaches a 2-month, 52-module classroom course in technical
analysis, built around three pillars: chart structure, chart flow and
chart behaviour. Batches are limited to 8-10 students. The institute
does not provide buy or sell recommendations.

## Courses
- [Technical Analysis & Chart Reading](https://www.marketcredo.in/courses): 2-month classroom course, 52 modules, Rs 24,999
- [Curriculum](https://www.marketcredo.in/curriculum): Module-by-module breakdown
- [Fees](https://www.marketcredo.in/fees): Pricing and payment details

## Location & Contact
- [Bhopal course page](https://www.marketcredo.in/bhopal-stock-market-course): Address, directions, landmarks, local FAQs
- Address: Plot No 83, Shrinivas Tower, M.P. Nagar Zone II, Bhopal, MP 462011
- Phone: +91 99939 06449
- Hours: Monday to Saturday, 9:00 AM to 10:00 PM

## Learning Resources
- [Chart Patterns Library](https://www.marketcredo.in/chart-patterns): Reference pages for individual chart patterns
- [Journal](https://www.marketcredo.in/blog): Articles on technical analysis, risk management and trading psychology

## About
- [Trainer](https://www.marketcredo.in/about): Atish Shakergaye, SEBI Registered Research Analyst INH000006086
- [FAQ](https://www.marketcredo.in/faq)
```

**Done when**
- [ ] Returns 200 with `Content-Type: text/plain`

## IMG-01 — Chart images are invisible to search

Annotated charts are the site's most distinctive asset and a genuine Google
Images opportunity, but carry generic filenames and weak alt text.

Before renaming anything, print the full list of current image filenames and
proposed new names for approval in one pass.

- Descriptive filenames: `nifty-double-top-daily-chart.png`, not `IMG_4471.png`
- Alt text describing what the chart shows, not just the pattern name
- Add an `image` field to each pattern page's schema
- Lazy-load below-fold images; serve WebP with explicit width and height

**Done when**
- [ ] All chart images renamed and given real alt text
- [ ] Width/height attributes set; mobile LCP under 2.5s on PageSpeed Insights

## REVIEW-01 — Remove star ratings from the testimonials page

Six testimonials each display a 5-star rating. Two reasons to pull the stars
while a compliance opinion is pending: Google ignores self-serving review markup
on your own site, so there is no ranking upside; and SEBI's advertisement code
restricts testimonials in research-analyst advertising.

Keep the testimonial text. Remove the star graphics. Add no review schema.

**Done when**
- [ ] Star rating graphics removed; testimonial text retained
- [ ] No `Review` or `AggregateRating` markup on any page
- [ ] Link added pointing visitors to the Google Business Profile for reviews

---

# Validation before sign-off

- [ ] Every JSON-LD block validates clean at https://validator.schema.org/
- [ ] Course markup passes Google's Rich Results Test
- [ ] No markup describes content absent from the rendered page
- [ ] All 301s resolve in a single hop — no redirect chains
- [ ] Sitemap resubmitted in Search Console and Bing Webmaster Tools
- [ ] Search Console Enhancements monitored for two weeks post-deploy
- [ ] Mobile Core Web Vitals unchanged or improved

**Two things to avoid.** Do not add `Review` or `AggregateRating` schema — see
REVIEW-01. Do not mark up content that isn't visible on the page; Google treats
that as structured data spam and it can trigger a manual action.

---

Questions on any ticket: Atish Shakergaye — +91 99939 06449 / info@marketcredo.in
