/* GA4 key-event tracking — phone_click, whatsapp_click, review_click.
   Loaded with `defer` on every public page; no-ops safely if gtag isn't present. */
(function () {
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  function fb(name) { if (typeof window.fbq === 'function') window.fbq('track', name); }
  function on(selector, name, fbEvent) {
    document.querySelectorAll(selector).forEach(function (a) {
      a.addEventListener('click', function () { track(name, { page: location.pathname }); if (fbEvent) fb(fbEvent); });
    });
  }
  on('a[href^="tel:"]', 'phone_click', 'Contact');
  on('a[href*="wa.me"]', 'whatsapp_click', 'Contact');
  on('a[href*="g.page"],a[href*="review"]', 'review_click');
})();
