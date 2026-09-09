# Lead backend setup (task 14 / 16)

The demo + newsletter forms POST to **`/api/lead`** (via `/lead.js`), which:

1. Persists the lead to a **durable store** (never the function's local disk — Vercel's fs is ephemeral):
   - **PRIMARY** = Google Sheet via Apps Script webhook (`APPS_SCRIPT_WEBHOOK_URL`).
   - **FALLBACK** = GitHub `leads.json` (`GH_TOKEN`) — what `crm.html` reads. By default this only runs when the webhook is absent or failed (see the deploy caveat below).
2. Fans out to **optional notify** sinks (Resend email, Meta CAPI) — never blocks the response.
3. On success returns `200 {ok, eventId}` → frontend fires `gtag('generate_lead')` → redirect to **`/thank-you`** (fires Meta `Lead`, deduped by `event_id`).

**If no store is configured, or all writes fail, `/api/lead` returns a non-2xx and logs a loud `console.error` — it does NOT pretend success.** `/lead.js` then opens WhatsApp with the lead details as a fallback, so nothing is lost.

## Vercel environment variables

| Variable | Purpose |
|---|---|
| **`APPS_SCRIPT_WEBHOOK_URL`** | **Primary store** — append each lead to a Google Sheet (setup below). |
| `GH_TOKEN`, `GH_REPO`, `GH_BRANCH`, `CRM_PASSWORD` | Fallback `leads.json` store + `crm.html` read. |
| `LEADS_ALWAYS_GIT` | Set to `1` to ALSO write `leads.json` even when the webhook succeeds (keeps the CRM live). |
| `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `LEAD_FROM_EMAIL` | Optional email-on-lead via Resend. |
| `META_PIXEL_ID`, `META_CAPI_TOKEN` | Optional server-side Meta CAPI `Lead` (task 16). |

`META_CAPI_TOKEN` is a **secret** (server only). The browser Pixel ID is public and goes in `pixel.js` (`window.MC_PIXEL_ID`), not an env var.

> ⚠️ **GitHub-store deploy caveat:** writing `leads.json` commits to `GH_BRANCH`. If that is
> `master`, **every lead triggers a production redeploy**. Either keep the Sheet webhook as the
> primary store (default: GitHub write is skipped when the webhook succeeds), **or** set
> `GH_BRANCH` to a non-production branch such as `leads-data` so lead commits never deploy prod.

## Google Sheet via Apps Script (primary store) — exact steps

1. Create a new Google Sheet (any name).
2. **Extensions → Apps Script**, delete the stub, and paste this **exactly**:

```javascript
// Market Credo lead capture -> Google Sheet. Appends one row per lead/newsletter signup.
var HEADERS = ['ts','type','name','phone','email','course','source','page',
               'utm_source','utm_medium','utm_campaign','utm_term','utm_content','eventId'];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents || '{}');
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);   // write header once
    sheet.appendRow(HEADERS.map(function (k) {
      return k === 'eventId' ? (d.eventId || d.event_id || '') : (d[k] != null ? d[k] : '');
    }));
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Deploy → New deployment → ⚙ → Web app.** Description: `lead capture`.
   **Execute as:** *Me*. **Who has access:** *Anyone*. Click **Deploy**, authorize when prompted.
4. Copy the **Web app URL** (ends in `/exec`).
5. In Vercel → Project → Settings → Environment Variables, add
   **`APPS_SCRIPT_WEBHOOK_URL`** = that `/exec` URL (Production + Preview). Redeploy.
6. Test: `curl -s -X POST "<your /exec URL>" -H 'Content-Type: application/json' -d '{"ts":"test","type":"lead","name":"Test","phone":"9993906449","eventId":"t1"}'` → `{"ok":true}` and a new row appears.

> When you later change the script, create a **New deployment** (or *Manage deployments → edit → new version*) — editing code alone doesn't update the live `/exec` endpoint.

## Verify
- Submit the demo form → row appears in `leads.json` (and the Sheet, if configured); you land on `/thank-you`.
- GA4 Realtime shows `generate_lead`.
- `/thank-you` is `noindex` and excluded from `sitemap.xml`.
- Meta Events Manager → Test Events shows `Lead` from **browser and server**, deduped by `event_id`.
