# How to add a page

All pages are static HTML served from the repo root (clean URLs — no `.html` in links).
`npm run build` runs the NAP guard and regenerates `sitemap.xml`, so **new pages are added
to the sitemap automatically** once the file exists in the repo root (or `blog/`).

---

## 1. A dedicated course page (task 13)

Pages to create from `templates/course.html`:

| Slug (file at repo root) | Course |
|---|---|
| `technical-analysis-course-bhopal.html` | Technical Analysis |
| `price-action-course-bhopal.html` | Price Action |
| `candlestick-patterns-course.html` | Candlestick Patterns |
| `chart-patterns-course.html` | Chart Patterns |
| `free-demo-class-bhopal.html` | Free 2-Day Demo |
| `weekend-stock-market-course-bhopal.html` | Weekend batch |
| `fees.html` | Fees |

> `courses.html`'s Course schema already links to `/price-action-course-bhopal` and
> `/free-demo-class-bhopal`, so creating those two removes the only forward-references.

**Steps**
1. Copy `templates/course.html` to the repo root as `<slug>.html`.
2. **Delete the `<meta name="robots" content="noindex, nofollow"/>` line.**
3. Replace every `{{PLACEHOLDER}}`:
   - `{{LANG}}` → `en-IN`
   - `{{TITLE}}` → keyword-first, ≤60 chars, unique (e.g. `Price Action Course in Bhopal | Market Credo`)
   - `{{DESCRIPTION}}` → ≤155 chars, unique
   - `{{SLUG}}` → the slug **without** `.html` (e.g. `price-action-course-bhopal`)
   - `{{H1}}`, `{{HERO_EYEBROW}}`, `{{HERO_SUB}}`
   - `{{COURSE_NAME}}`, `{{COURSE_DESCRIPTION}}`, `{{COURSE_ABOUT}}` (e.g. `"Price Action","Chart Structure"`)
   - `{{FAQ_Q1..3}}` / `{{FAQ_A1..3}}` — keep the visible FAQ (`{{FAQ_HTML}}`) and the JSON-LD identical
   - `{{BREADCRUMB_NAME}}`, `{{BODY}}` (owner copy — educational framing only), `{{WA_COURSE}}`
   - `{{RELATED_COURSE_1/2}}` + labels → two other course slugs (keeps ≥2 internal course links)
   - `{{HREFLANG}}` → leave empty until the Hindi version exists (see §3)
4. Content rules: **no** price targets, "levels to watch", or buy/sell calls; keep the footer disclaimer; **never** add `AggregateRating`/`Review`/ratings.
5. Link the new page from `courses.html` and/or the homepage where relevant.
6. `npm run build` → confirm the URL appears in `sitemap.xml`.
7. Validate at <https://validator.schema.org/> (expect Course + FAQ + Breadcrumb, 0 errors).

---

## 2. A blog post

Use `blog-template.html` (reference) — or the AI pipeline (`blog-studio.html` → `api/generate-blog` → `api/publish-file`, which already emits clean URLs + wires `blog.html` + sitemap + IndexNow). Checklist is inside `blog-template.html`. Keep author linked to `about#trainer`, image 1200×630, ≥2 course links + demo CTA, and the compliance rule at the top of the template.

---

## 3. Hindi layer + hreflang (task 21)

Hindi pages live under **`/hi/`** (e.g. `hi/technical-analysis-course-bhopal.html`), with `<html lang="hi-IN">`.

**When BOTH the EN and HI versions exist**, add the SAME three tags to the `<head>` of **each** (the `{{HREFLANG}}` slot in the template):

```html
<link rel="alternate" hreflang="en-IN" href="https://www.marketcredo.in/technical-analysis-course-bhopal"/>
<link rel="alternate" hreflang="hi-IN" href="https://www.marketcredo.in/hi/technical-analysis-course-bhopal"/>
<link rel="alternate" hreflang="x-default" href="https://www.marketcredo.in/technical-analysis-course-bhopal"/>
```

> ⚠️ Do **not** add hreflang to an EN page before its Hindi counterpart exists — it would
> point at a 404 and create GSC hreflang errors. Add both sides together (reciprocal).

**Language switch** — add to the nav of both versions (EN → HI and HI → EN):
```html
<li><a href="/hi/technical-analysis-course-bhopal" hreflang="hi-IN">हिंदी</a></li>
```

**Sitemap alternates** — once Hindi pages exist, add `xhtml:link` alternates in `sitemap.xml`.
`scripts/build-sitemap.js` can be extended to emit these automatically (add the
`xmlns:xhtml` namespace and, for each EN page with a `hi/<slug>` counterpart, output
`<xhtml:link rel="alternate" hreflang="hi-IN" href=".../hi/<slug>"/>`). Left as a follow-up
so the current sitemap stays valid until Hindi content lands.
