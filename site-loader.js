/* site-loader.js — Loads site-data.json and applies CRM-managed content to pages */
(function() {
  function apply(data) {
    if (!data) return;
    var c = data.content || {};
    var s = data.settings || {};
    var t = data.testimonials || [];

    /* ── HERO SECTION (index.html) ── */
    var heroH1 = document.querySelector('.hero-h1');
    if (heroH1 && c.heroTitle) {
      heroH1.innerHTML = c.heroTitle.replace(/\n/g, '<br/>');
    }
    var heroH2 = document.querySelector('.hero-h2');
    if (heroH2 && c.heroSub) heroH2.textContent = c.heroSub;

    var heroDesc = document.querySelector('.hero-desc');
    if (heroDesc && c.heroDesc) heroDesc.innerHTML = c.heroDesc;

    /* ── HERO STATS ── */
    var hstats = document.querySelectorAll('.hstat');
    if (hstats.length >= 2) {
      if (c.statYears) hstats[0].querySelector('.hstat-val').textContent = c.statYears;
      if (c.statStudents) hstats[1].querySelector('.hstat-val').textContent = c.statStudents;
    }

    /* ── MOBILE HERO STATS ── */
    var mstats = document.querySelectorAll('.hero-stat');
    if (mstats.length >= 2) {
      if (c.statYears) { var mv = mstats[0].querySelector('.hero-stat-val'); if (mv) mv.textContent = c.statYears; }
      if (c.statStudents) { var mv2 = mstats[1].querySelector('.hero-stat-val'); if (mv2) mv2.textContent = c.statStudents; }
    }

    /* ── MOBILE HERO HEADLINE ── */
    var mHeadline = document.querySelector('.hero-headline');
    if (mHeadline && c.heroTitle) {
      mHeadline.innerHTML = c.heroTitle.replace(/\n/g, '<br/>');
    }

    /* ── TRAINER SIDEBAR (index.html) ── */
    var sideRows = document.querySelectorAll('.side-block .dr');
    if (sideRows.length > 0) {
      sideRows.forEach(function(row) {
        var key = row.querySelector('.dk');
        var val = row.querySelector('.dv');
        if (!key || !val) return;
        var k = key.textContent.trim();
        if (k === 'NAME' && s.trainerName) val.textContent = s.trainerName.toUpperCase();
        if (k === 'REG. NO.' && s.sebi) val.textContent = s.sebi;
        if (k === 'EXPERIENCE' && c.statYears) val.textContent = c.statYears + ' YEARS';
        if (k === 'STUDENTS' && c.statStudents) val.textContent = c.statStudents + ' TRAINED';
      });
    }

    /* ── ABOUT PAGE ── */
    var avName = document.querySelector('.av-name');
    if (avName && s.trainerName) avName.textContent = s.trainerName.toUpperCase();
    var ebNum = document.querySelector('.eb-num');
    if (ebNum && c.statYears) ebNum.textContent = c.statYears;
    var sebiPill = document.querySelector('.sebi-pill');
    if (sebiPill && s.sebi) sebiPill.textContent = 'SEBI REG. NO: ' + s.sebi;

    /* ── MOBILE MENTOR SECTION ── */
    var mentorName = document.querySelector('.mentor-name');
    if (mentorName && s.trainerName) mentorName.textContent = s.trainerName;

    /* ── FOOTER CONTACT ── */
    var telLinks = document.querySelectorAll('a[href^="tel:"]');
    telLinks.forEach(function(a) { if (s.phone) { a.href = 'tel:' + s.phone.replace(/[^+\d]/g, ''); a.textContent = s.phone; } });

    var mailLinks = document.querySelectorAll('a[href^="mailto:"]');
    mailLinks.forEach(function(a) { if (s.email) { a.href = 'mailto:' + s.email; a.textContent = s.email; } });

    /* ── FOOTER CREDENTIALS ── */
    var footRows = document.querySelectorAll('footer .dr');
    footRows.forEach(function(row) {
      var key = row.querySelector('.dk');
      var val = row.querySelector('.dv');
      if (!key || !val) return;
      var k = key.textContent.trim();
      if (k === 'REG. NO.' && s.sebi) val.textContent = s.sebi;
      if (k === 'EXPERIENCE' && c.statYears) val.textContent = c.statYears + ' YEARS';
      if (k === 'STUDENTS' && c.statStudents) val.textContent = c.statStudents + ' TRAINED';
    });

    /* ── WHATSAPP LINKS ── */
    if (s.whatsapp) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) {
        var txt = a.href.split('?text=')[1] || '';
        a.href = s.whatsapp + (txt ? '?text=' + txt : '');
      });
    }

    /* ── SOCIAL LINKS ── */
    if (s.youtube) document.querySelectorAll('a[href*="youtube.com"]').forEach(function(a) { a.href = s.youtube; });
    if (s.instagram) document.querySelectorAll('a[href*="instagram.com"]').forEach(function(a) { a.href = s.instagram; });
    if (s.facebook) document.querySelectorAll('a[href*="facebook.com"]').forEach(function(a) { a.href = s.facebook; });

    /* ── TESTIMONIALS (testimonials.html) ── */
    var tGrid = document.getElementById('testimonialGrid');
    if (tGrid && t.length > 0) {
      var html = '';
      t.forEach(function(item) {
        var stars = '';
        for (var i = 0; i < 5; i++) stars += i < (parseInt(item.rating) || 5) ? '\u2605' : '\u2606';
        html += '<div class="tcard">' +
          '<div class="tc-stars">' + stars + '</div>' +
          '<p class="tc-quote">\u201C' + (item.quote || '') + '\u201D</p>' +
          '<div class="tc-name">' + (item.name || '') + '</div>' +
          '<div class="tc-detail">' + (item.detail || '') + '</div>' +
          '</div>';
      });
      tGrid.insertAdjacentHTML('beforeend', html);
    }
  }

  /* Fetch site-data.json and apply */
  fetch('/site-data.json?' + Date.now())
    .then(function(r) { return r.json(); })
    .then(apply)
    .catch(function() { /* Fallback: hardcoded HTML stays as-is */ });
})();
