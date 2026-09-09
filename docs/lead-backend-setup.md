# Lead backend setup (task 14 / 16)

The demo + newsletter forms now POST to **`/api/lead`** (via `/lead.js`), which:

1. Saves every lead to **`leads.json`** in the repo (primary store; this is what **`crm.html`** reads). This works as soon as `GH_TOKEN` is set — it already is if the CRM works today.
2. Fans out to **optional** sinks if their env vars are present (each is skipped otherwise and never blocks the response).
3. Returns `200 {ok, eventId}` → the frontend fires `gtag('generate_lead')` and redirects to **`/thank-you`**, which fires the Meta `Lead` event (same `event_id` → deduped with the server CAPI event).

If `/api/lead` ever fails, `/lead.js` falls back to opening WhatsApp directly — no lead is lost.

## Vercel environment variables

| Variable | Required? | Purpose |
|---|---|---|
| `GH_TOKEN`, `GH_REPO`, `GH_BRANCH`, `CRM_PASSWORD` | existing | The `leads.json` store + CRM read (already in use). |
| `APPS_SCRIPT_WEBHOOK_URL` | optional | Also append each lead to a Google Sheet (see below). |
| `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `LEAD_FROM_EMAIL` | optional | Email you on every lead via Resend. |
| `META_PIXEL_ID`, `META_CAPI_TOKEN` | optional (task 16) | Server-side Meta Conversions API `Lead` event. |

`META_CAPI_TOKEN` is a **secret** (server only). The browser Pixel ID is public and goes in `pixel.js` (`window.MC_PIXEL_ID`), not in an env var.

## Optional: Google Sheet via Apps Script

1. Create a Google Sheet. Header row: `ts, type, name, phone, email, course, source, page, utm_source, utm_medium, utm_campaign, event_id`.
2. Extensions → Apps Script, paste:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  var d = JSON.parse(e.postData.contents);
  sheet.appendRow([d.ts, d.type, d.name, d.phone, d.email, d.course, d.source,
                   d.page, d.utm_source, d.utm_medium, d.utm_campaign, d.eventId || d.event_id]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Deploy → **New deployment** → type **Web app** → Execute as *Me*, Who has access *Anyone* → copy the `/exec` URL → set it as `APPS_SCRIPT_WEBHOOK_URL` in Vercel.

## Verify
- Submit the demo form → row appears in `leads.json` (and the Sheet, if configured); you land on `/thank-you`.
- GA4 Realtime shows `generate_lead`.
- `/thank-you` is `noindex` and excluded from `sitemap.xml`.
- Meta Events Manager → Test Events shows `Lead` from **browser and server**, deduped by `event_id`.
