/* Meta Pixel base code. Inert until you set the Pixel ID below.
   TODO(owner): paste your Meta Pixel ID (public client-side ID, NOT a secret).
   The server-side Conversions API token is separate — set META_CAPI_TOKEN + META_PIXEL_ID
   in Vercel env vars (used by api/lead.js). Use the SAME pixel id in both places. */
window.MC_PIXEL_ID = ''; // e.g. '1234567890123456'
(function () {
  var id = window.MC_PIXEL_ID;
  if (!id) return; // no pixel configured yet -> do nothing
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', id);
  fbq('track', 'PageView');
})();
