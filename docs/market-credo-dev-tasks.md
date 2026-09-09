# Market Credo — Website Dev Tasks (extract of Master Checklist v7)

**Date:** 9 Sept 2026 · **Stack:** static HTML + mc.css on Vercel, GA4 (G-5RJD0WSYV5), JSON-LD har page par · **Canonical plan:** market-credo-master-checklist-v7.md — ye file uska dev extract hai, item numbers wahi hain (v7 #n).

**Priority:** P0 = aaj (config-level, 1–2 ghante) · P1 = is hafte · P2 = agle 2–4 hafte · P3 = uske baad. Har task ke end mein "Check" = done maanne ki condition.

**Canonical NAP (single source — nap-data.json):** Market Credo — Technical Analysis Institute · +91 99939 06449 · info@marketcredo.in · Plot No 83, Shrinivas Tower, M.P. Nagar Zone II, Bhopal, MP 462011

---

1. **P0 · Phone replace + deploy (v7 #1).** Files: index.html (text ×3, `wa.me/918827979008` ×5, `tel:+918827979008` ×2, JSON-LD `"telephone"`), bhopal-stock-market-course.html (×7), faq.html (×3), crm.html (×20), nap-data.json (`phone`, `phoneInternational`), plus har page ka JSON-LD. Naya: `+91-9993906449`, `wa.me/919993906449`, `tel:+919993906449`. Deploy karo.
   Check: `curl -s https://www.marketcredo.in | grep -c 8827979008` → 0, same for /bhopal-stock-market-course.html aur /faq.html.

2. **P0 · NAP lint script (v7 #2).** `scripts/check-nap.js` — saare public *.html scan kare; agar koi 10-digit number 9993906449 ke alawa mile, ya pincode 462011 ke alawa mile, to exit 1. `package.json` mein `"build": "node scripts/check-nap.js"` (Vercel build command). Aage se galat number deploy hi nahi hoga.
   Check: purana number daalke build fail ho.

3. **P0 · Admin pages ko auth ke peeche (v7 #5 + security).** `/crm.html` abhi public HTTP 200 hai — robots Disallow protection nahi hai. Root par `middleware.js`:
   ```js
   import { next } from '@vercel/edge';
   export const config = { matcher: ['/crm.html','/blog-studio.html','/og-generator.html','/blog-template.html','/market_credo_bloomberg.html','/chips-variants-preview.html'] };
   export default function middleware(req) {
     const [scheme, encoded] = (req.headers.get('authorization') || '').split(' ');
     if (scheme === 'Basic' && encoded) {
       const [u, p] = atob(encoded).split(':');
       if (u === process.env.ADMIN_USER && p === process.env.ADMIN_PASS) return next();
     }
     return new Response('Auth required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="MC Admin"' } });
   }
   ```
   Env vars ADMIN_USER / ADMIN_PASS Vercel project settings mein. `mobile.html` delete karo (sirf redirect page hai).
   Check: `curl -sI https://www.marketcredo.in/crm.html` → 401.

4. **P0 · robots.txt rewrite (v7 #5).** Disallow + noindex ek saath nahi chalta — Disallow ki wajah se Google noindex dekh nahi paata. Item 3 ke baad poora robots.txt sirf:
   ```
   User-agent: *
   Allow: /
   Disallow: /api/

   Sitemap: https://www.marketcredo.in/sitemap.xml
   ```
   Check: GSC → robots.txt report → koi error nahi.

5. **P0 · Redirect chain → ek 308 (v7 #18).** Abhi `http://marketcredo.in` → 308 → `https://marketcredo.in` → 307 → `https://www.marketcredo.in`. Vercel Dashboard → Project → Domains → `marketcredo.in` → "Redirect to www.marketcredo.in" → status **308**. Agar 307 vercel.json/middleware se aa raha hai, wahan `permanent: true`. Backup vercel.json rule:
   ```json
   "redirects": [{ "source": "/(.*)", "has": [{ "type": "host", "value": "marketcredo.in" }], "destination": "https://www.marketcredo.in/$1", "permanent": true }]
   ```
   Check: `curl -sI https://marketcredo.in/` → `HTTP/2 308` + `location: https://www.marketcredo.in/`.

6. **P0 · Security headers (v7 #18).** vercel.json:
   ```json
   "headers": [{ "source": "/(.*)", "headers": [
     { "key": "X-Content-Type-Options", "value": "nosniff" },
     { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
     { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
     { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
     { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
   ]}]
   ```
   Check: securityheaders.com par A grade.

7. **P1 · Clean URLs — naye pages se PEHLE (v7 #22 prerequisite).** vercel.json mein `"cleanUrls": true, "trailingSlash": false`. Vercel `/about.html` → `/about` ko khud 308 kar deta hai. Phir sab internal hrefs, `<link rel="canonical">`, og:url, JSON-LD `url`/BreadcrumbList `item`, sitemap — sab bina `.html`. GBP website link bhi update. Ye ab karo jab 22 pages hain, 50 hone ke baad nahi.
   Check: `curl -sI https://www.marketcredo.in/about.html` → 308 → `/about`; canonical `/about`.

8. **P1 · Internal linking to money page (v7 #34).** index.html ke nav aur hero CTA mein seedha `/bhopal-stock-market-course` link; courses.html se bhi. Abhi homepage ke sab course links `courses.html#courses` / `#curriculum` anchors par jaate hain — money page homepage se orphan hai.
   Check: homepage HTML mein `bhopal-stock-market-course` ≥ 2 baar.

9. **P1 · Organization schema → LocalBusiness multi-type (v7 #17).** index.html JSON-LD `#organization` block:
   ```json
   "@type": ["EducationalOrganization", "LocalBusiness"],
   "telephone": "+91-9993906449",
   "priceRange": "₹₹",
   "image": "https://www.marketcredo.in/images/og-default.jpg",
   "sameAs": ["https://www.youtube.com/@MarketCredo","https://www.instagram.com/marketcredo","https://www.facebook.com/marketcredo","<LinkedIn URL>"]
   ```
   Baaki fields (address, geo, openingHours) already hain — openingHours GBP ke final hours se match kare. AggregateRating kabhi nahi (v7 #6).
   Check: Rich Results Test → "Local business" detected, 0 errors.

10. **P1 · Course schema align (v7 #17).** courses.html ki ItemList mein abhi 2 Course hain — course-list rich result ke liye min 3 (homepage par 3 hain, wahi teen). Har Course mein `name`, `description`, `provider` (→ `#organization`), `url` (apna dedicated page, item 13). `CourseInstance` courses.html aur bhopal page dono se hatao. `Offer.price` = final price (v7 #21), ek hi number.
    Check: Rich Results Test on /courses → "Course list", 3 items, 0 errors.

11. **P1 · meta keywords tag hatao (v7 #18).** index.html par hai; `grep -l 'name="keywords"' *.html` se baaki dhundho.
    Check: grep → 0 files.

12. **P1 · Title tags keyword-first (v7 #24).** index.html: `Technical Analysis Course in Bhopal | Market Credo, MP Nagar`. Har page ka title/description unique, 60/155 chars ke andar. Inner pages ka "MARKET CREDO | ..." prefix hatao — keyword pehle, brand baad mein.
    Check: Screaming Frog / GSC mein duplicate titles 0.

13. **P2 · Dedicated course pages (v7 #22, #23, #27).** Ek template (`templates/course.html`) se: `/technical-analysis-course-bhopal`, `/price-action-course-bhopal`, `/candlestick-patterns-course`, `/chart-patterns-course`, `/free-demo-class-bhopal`, `/weekend-stock-market-course-bhopal`, `/fees`. Har page: unique title/H1/description, BreadcrumbList, FAQPage (min 3 Q), Course schema (provider → `#organization`), tel + wa.me CTA, footer disclaimer. Content AJ dega — dev sirf template + wiring.
    Check: har URL 200, canonical self, sitemap mein, Rich Results 0 errors.

14. **P2 · Lead capture backend (v7 #19).** Abhi `sendLead()` seedha WhatsApp kholta hai — lead kahin save nahi hoti. Banao `api/lead.js` (Vercel serverless):
    - POST JSON {name, phone, course, source, utm_*, page}; server-side validation; honeypot field; 5/min per IP rate limit.
    - Save: Google Sheet via Apps Script web-app webhook (sabse simple) ya Supabase. Email/WhatsApp notify AJ ko (optional: Resend).
    - Response 200 → frontend `gtag('event','generate_lead',{course, source})` → redirect `/thank-you?src=<source>` (noindex) → wahan WhatsApp button prefilled text ke saath: `Hi, main <course> ke free demo ke liye <source> se aaya hoon` — wa.me UTM nahi leta, ye text hi attribution hai.
    - `subNews()` (newsletter form) bhi isi endpoint par `type=newsletter`.
    Check: test lead Sheet mein dikhe, GA4 Realtime mein generate_lead, thank-you page GSC mein index na ho.

15. **P1 · GA4 key events (v7 #64).** Footer script har page par:
    ```js
    document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.addEventListener('click',()=>gtag('event','phone_click',{page:location.pathname})));
    document.querySelectorAll('a[href*="wa.me"]').forEach(a=>a.addEventListener('click',()=>gtag('event','whatsapp_click',{page:location.pathname})));
    document.querySelectorAll('a[href*="g.page"],a[href*="review"]').forEach(a=>a.addEventListener('click',()=>gtag('event','review_click')));
    ```
    GA4 Admin → Events → `phone_click`, `whatsapp_click`, `generate_lead`, `review_click` ko Key events mark karo. GA4 ↔ Search Console link.
    Check: GA4 Realtime mein click par event aaye.

16. **P1 · Meta Pixel + Conversions API (ads prerequisite, v7 #61).** Pixel base code har page; `fbq('track','Contact')` WhatsApp click par; `fbq('track','Lead')` thank-you page par. `api/lead.js` se server-side CAPI event (Lead) `_fbp`/`_fbc` cookies ke saath — same `event_id` browser aur server dono mein (dedup). Google Ads conversion GA4 se import.
    Check: Meta Events Manager → Test Events mein Lead browser + server dono dikhe, dedup OK.

17. **P1 · Sitemap generator (v7 #5, #18).** `scripts/build-sitemap.js` build par chale: public *.html scan (admin/thank-you/privacy exclude), `lastmod` = git last-commit date ya file mtime — hardcoded 2026-07-31 nahi. `changefreq`/`priority` hata do (Google ignore karta hai). Clean URLs ke baad bina `.html`.
    Check: aaj badle pages ka lastmod aaj ka; GSC sitemap "Success".

18. **P1 · Homepage images (v7 #18, #24).** 3–4 asli photos (classroom, AJ chart ke saamne, batch) — WebP, max 1600px, `width`/`height` attribute, descriptive alt ("Market Credo classroom, MP Nagar Bhopal"), hero ke neeche wali `loading="lazy"`, hero wali `fetchpriority="high"`. Abhi homepage par ek bhi `<img>` nahi hai.
    Check: PageSpeed mobile LCP < 2.5s, CLS 0.

19. **P1 · YouTube embed facade (CWV).** Homepage par 3 iframes load par hi aa rahe hain. `lite-youtube-embed` (ya apna thumbnail + click-to-load) use karo; VideoObject schema teeno ke liye (videos.html par pattern already hai, wahi copy).
    Check: initial load par youtube.com se koi request nahi; Rich Results → Video detected.

20. **P1 · Fonts + CSS.** `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` head mein sabse upar; ya Jost ko self-host karo (`/fonts/jost-*.woff2`, `font-display: swap`). mc.css minify + Vercel cache headers (`Cache-Control: public, max-age=31536000, immutable` for /fonts, /images, css with hash).
    Check: PageSpeed "Eliminate render-blocking" warning gone.

21. **P2 · Hindi layer (v7 #29).** `/hi/` folder, `<html lang="hi-IN">`, har EN page par teen hreflang tags:
    ```html
    <link rel="alternate" hreflang="en-IN" href="https://www.marketcredo.in/technical-analysis-course-bhopal">
    <link rel="alternate" hreflang="hi-IN" href="https://www.marketcredo.in/hi/technical-analysis-course-bhopal">
    <link rel="alternate" hreflang="x-default" href="https://www.marketcredo.in/technical-analysis-course-bhopal">
    ```
    Hindi page par bhi wahi teen (reciprocal). Sitemap mein `xhtml:link` alternates. Language switch link header mein.
    Check: GSC → International targeting/hreflang koi error nahi.

22. **P2 · Blog template (v7 #30, #31).** Article schema already hai — `author` → about page ka Person `@id`, `dateModified` real, `image` 1200×630. Har post ke end mein 2–3 course-page links + demo CTA (template level, taki v7 #34 automatic ho). "Related posts" cluster ke hisaab se. Optional: `/feed.xml` RSS.
    Check: Rich Results → Article 0 errors; har post mein ≥2 course links.

23. **P1 · review-us page (v7 #10).** `/review-us` par GBP ka short review link (Dashboard → "Ask for reviews") + QR (classroom standee ke liye same URL). Click par `review_click` event. Page noindex mat karo — ye "Market Credo reviews" search par rank kar sakta hai.
    Check: link GBP review dialog seedha khole.

24. **P1 · Compliance on-page fix (v7 #30, #56).** `blog/nifty-weekly-outlook.html` — H1 "Key Levels to Watch" aur usi tone ka content hatao; framing "Nifty ka chart structure — is hafte kya dikha" (education, koi level/target). Weekly template mein ye rule bake karo taki har issue mein repeat na ho.
    Check: page par "target", "level to watch", "buy", "sell" — grep 0.

25. **P2 · Trainer entity page (v7 #28).** about.html already ProfilePage + EducationalOccupationalCredential hai — theek hai. Add: media mentions section (Article links), `sameAs` LinkedIn + YouTube + IG, `knowsAbout`, `alumniOf`. Clean URL ke baad `/about` rakho ya `/atish-shakergaye` — ek chuno, doosre se 308.
    Check: Google par "Atish Shakergaye" — ye page top result.

26. **Ongoing · Har deploy se pehle:** `node scripts/check-nap.js` pass · Rich Results Test on changed templates · `curl -sI` on 3 URLs (apex, www, ek inner page) · GSC URL Inspection on 1 changed page. Ye 5 min ka ritual hai — isse "kuch na kuch bach jata hai" nahi hoga.

---

**Execution order:** 1 → 2 → 3 → 4 → 5 → 6 (aaj) · 7 → 8 → 9 → 10 → 11 → 12 → 15 → 16 → 17 → 18 → 19 → 20 → 23 → 24 (is hafte, ~2–3 dev days) · 14 (2 dev days, ads se pehle zaroori) · 13 → 21 → 22 → 25 (content ke saath, 2–4 hafte).
