/* lead.js — upgrades the demo + newsletter forms to POST /api/lead, then:
   - gtag('generate_lead')  - redirect to /thank-you (fires Meta Lead there)
   Loaded with `defer` AFTER each page's inline sendLead/subNews, so it overrides them.
   If the API call fails, it falls back to the original WhatsApp behaviour — no lead lost. */
(function () {
  function genId() {
    try { return crypto.randomUUID(); } catch (e) { return 'e' + Date.now() + Math.random().toString(16).slice(2); }
  }
  function val(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
  function utms() {
    var p = new URLSearchParams(location.search), o = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) { if (p.get(k)) o[k] = p.get(k); });
    return o;
  }
  function post(payload) {
    return fetch('/api/lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json().catch(function () { return {}; }); });
  }
  function sourceName() { return location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'home'; }

  window.sendLead = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var name = val('lf-name'), phone = val('lf-phone'), course = val('lf-course') || 'Technical Analysis Course';
    var source = sourceName(), eid = genId();
    var waText = 'Hello Market Credo! I would like to book a demo.\n\nName: ' + name + '\nPhone: ' + phone + '\nInterested in: ' + course;
    var fallback = function () { window.open('https://wa.me/919993906449?text=' + encodeURIComponent(waText), '_blank'); };
    var payload = Object.assign({ type: 'lead', name: name, phone: phone, course: course, source: source, page: location.pathname, eid: eid, company: val('lf-company') }, utms());
    post(payload).then(function () {
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { course: course, source: source });
      location.href = '/thank-you?src=' + encodeURIComponent(source) + '&course=' + encodeURIComponent(course) + '&eid=' + encodeURIComponent(eid);
    }).catch(fallback);
    return false;
  };

  window.subNews = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var email = val('news-email'), source = sourceName(), eid = genId();
    var fallback = function () { window.open('https://wa.me/919993906449?text=' + encodeURIComponent('Hello Market Credo! Please add me to your updates. Email: ' + email), '_blank'); };
    post({ type: 'newsletter', email: email, source: source, page: location.pathname, eid: eid, company: val('news-company') }).then(function () {
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { course: 'newsletter', source: source });
      var input = document.getElementById('news-email');
      if (input) { input.value = ''; input.placeholder = "Thanks — you're subscribed!"; }
    }).catch(fallback);
    return false;
  };
})();
