/* GA4 key-event tracking — phone_click, whatsapp_click, review_click.
   Loaded with `defer` on every public page; no-ops safely if gtag isn't present. */
(function () {
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  function on(selector, name) {
    document.querySelectorAll(selector).forEach(function (a) {
      a.addEventListener('click', function () { track(name, { page: location.pathname }); });
    });
  }
  on('a[href^="tel:"]', 'phone_click');
  on('a[href*="wa.me"]', 'whatsapp_click');
  on('a[href*="g.page"],a[href*="review"]', 'review_click');
})();
