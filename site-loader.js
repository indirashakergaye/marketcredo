/* site-loader.js — Loads site-data.json and applies CRM-managed content to ALL pages */
(function() {
  function apply(data) {
    if (!data) return;
    var c = data.content || {};
    var s = data.settings || {};
    var t = data.testimonials || [];

    /* ══════════════════════════════════════════
       DESKTOP — index.html
       ══════════════════════════════════════════ */

    /* Hero Section */
    var heroH1 = document.querySelector('.hero-h1');
    if (heroH1 && c.heroTitle) heroH1.innerHTML = c.heroTitle.replace(/\n/g, '<br/>');
    var heroH2 = document.querySelector('.hero-h2');
    if (heroH2 && c.heroSub) heroH2.textContent = c.heroSub;
    var heroDesc = document.querySelector('.hero-desc');
    if (heroDesc && c.heroDesc) heroDesc.innerHTML = c.heroDesc;

    /* Desktop Hero Stats */
    var hstats = document.querySelectorAll('.hstat');
    if (hstats.length >= 2) {
      if (c.statYears) { var v = hstats[0].querySelector('.hstat-val'); if (v) v.textContent = c.statYears; }
      if (c.statStudents) { var v2 = hstats[1].querySelector('.hstat-val'); if (v2) v2.textContent = c.statStudents; }
    }

    /* Trainer Sidebar (index.html) */
    document.querySelectorAll('.side-block .dr').forEach(function(row) {
      var key = row.querySelector('.dk');
      var val = row.querySelector('.dv');
      if (!key || !val) return;
      var k = key.textContent.trim();
      if (k === 'NAME' && s.trainerName) val.textContent = s.trainerName.toUpperCase();
      if (k === 'REG. NO.' && s.sebi) val.textContent = s.sebi;
      if (k === 'EXPERIENCE' && c.statYears) val.textContent = c.statYears + ' YEARS';
      if (k === 'STUDENTS' && c.statStudents) val.textContent = c.statStudents + ' TRAINED';
    });

    /* ══════════════════════════════════════════
       MOBILE — mobile.html
       ══════════════════════════════════════════ */

    /* Mobile Hero Headline */
    var mHeadline = document.querySelector('.hero-headline');
    if (mHeadline && c.heroTitle) mHeadline.innerHTML = c.heroTitle.replace(/\n/g, '<br/>');

    /* Mobile Hero Quote */
    var mQuote = document.querySelector('.hero-quote');
    if (mQuote && c.heroQuote) {
      mQuote.innerHTML = '\u201C' + c.heroQuote + '\u201D' +
        (c.heroQuoteTrans ? '<br/><span style="font-size:12px;color:var(--muted);font-style:normal;">' + c.heroQuoteTrans + '</span>' : '');
    }

    /* Mobile Hero Stats */
    var mstats = document.querySelectorAll('.hero-stat');
    if (mstats.length >= 1 && c.statYears) { var mv = mstats[0].querySelector('.hero-stat-val'); if (mv) mv.textContent = c.statYears; }
    if (mstats.length >= 2 && c.statStudents) { var mv2 = mstats[1].querySelector('.hero-stat-val'); if (mv2) mv2.textContent = c.statStudents; }

    /* Mobile Mentor Section */
    var mentorName = document.querySelector('.mentor-name');
    if (mentorName && s.trainerName) mentorName.textContent = s.trainerName;
    var mentorRole = document.querySelector('.mentor-role');
    if (mentorRole && s.trainerRole) mentorRole.textContent = s.trainerRole.toUpperCase();
    var mentorReg = document.querySelector('.mentor-reg');
    if (mentorReg && s.sebi) {
      var dot = mentorReg.querySelector('.mentor-reg-dot');
      mentorReg.innerHTML = (dot ? dot.outerHTML : '') + ' REG. NO: ' + s.sebi;
    }

    /* Mobile Bio */
    var bioTexts = document.querySelectorAll('.bio-text');
    if (bioTexts.length > 0 && c.mentorBio && c.mentorBio.length > 0) {
      for (var bi = 0; bi < Math.min(bioTexts.length, c.mentorBio.length); bi++) {
        bioTexts[bi].textContent = c.mentorBio[bi];
      }
    }

    /* Mobile Skills */
    var skillChips = document.querySelectorAll('.skill-chip');
    if (skillChips.length > 0 && c.skills && c.skills.length > 0) {
      for (var si = 0; si < Math.min(skillChips.length, c.skills.length); si++) {
        skillChips[si].textContent = c.skills[si];
      }
    }

    /* Mobile Experience Number */
    var expNum = document.querySelector('.exp-number');
    if (expNum && c.statYears) expNum.textContent = c.statYears;

    /* Mobile Why Cards */
    var whyCards = document.querySelectorAll('.why-card');
    if (whyCards.length > 0 && c.whyCards && c.whyCards.length > 0) {
      for (var wi = 0; wi < Math.min(whyCards.length, c.whyCards.length); wi++) {
        var wTitle = whyCards[wi].querySelector('.why-title');
        var wDesc = whyCards[wi].querySelector('.why-desc');
        if (wTitle && c.whyCards[wi].title) wTitle.textContent = c.whyCards[wi].title;
        if (wDesc && c.whyCards[wi].desc) wDesc.textContent = c.whyCards[wi].desc;
      }
    }

    /* Mobile Course Cards */
    var courseCards = document.querySelectorAll('.course-card');
    if (courseCards.length > 0 && c.courses && c.courses.length > 0) {
      for (var ci = 0; ci < Math.min(courseCards.length, c.courses.length); ci++) {
        var cTitle = courseCards[ci].querySelector('.course-title');
        var cDesc = courseCards[ci].querySelector('.course-desc');
        var cLevel = courseCards[ci].querySelector('.course-level');
        if (cTitle && c.courses[ci].title) cTitle.textContent = c.courses[ci].title;
        if (cDesc && c.courses[ci].desc) cDesc.textContent = c.courses[ci].desc;
        if (cLevel && c.courses[ci].level) cLevel.textContent = c.courses[ci].level;
      }
    }

    /* Mobile Trust Metrics */
    var trustCards = document.querySelectorAll('.trust-card');
    trustCards.forEach(function(card) {
      var val = card.querySelector('.trust-val');
      var lbl = card.querySelector('.trust-lbl');
      if (!val || !lbl) return;
      var label = lbl.textContent.trim().toLowerCase();
      if (label.indexOf('student') >= 0 && c.statStudents) val.textContent = c.statStudents;
      if (label.indexOf('year') >= 0 && c.statYears) val.textContent = c.statYears;
      if (label.indexOf('rating') >= 0 && c.statRating) val.textContent = c.statRating + '\u2605';
    });

    /* Mobile Contact Cards */
    var contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach(function(card) {
      var icon = card.querySelector('.contact-card-icon');
      var valEl = card.querySelector('.contact-card-val');
      if (!icon || !valEl) return;
      var iconText = icon.textContent.trim();
      if (iconText === '\u260E' && s.phone) {
        var ph = s.phone.replace(/[^+\d]/g, '');
        valEl.innerHTML = '<a href="tel:' + ph + '">' + s.phone + '</a>';
      }
      if (iconText === '\u2709' && s.email) {
        valEl.innerHTML = '<a href="mailto:' + s.email + '">' + s.email + '</a>';
      }
    });

    /* Mobile Menu Footer */
    var menuSebi = document.querySelector('.menu-footer-sebi');
    if (menuSebi && s.sebi) menuSebi.textContent = 'SEBI REGISTERED \u00b7 ' + s.sebi;
    var menuContact = document.querySelector('.menu-footer-contact');
    if (menuContact && s.phone) {
      var phoneLink = menuContact.querySelector('a[href^="tel:"]');
      if (phoneLink) { phoneLink.href = 'tel:' + s.phone.replace(/[^+\d]/g, ''); phoneLink.textContent = s.phone; }
    }

    /* Mobile Business Hours */
    contactCards.forEach(function(card) {
      var lbl = card.querySelector('.contact-card-lbl');
      if (lbl && lbl.textContent.trim().toLowerCase().indexOf('hour') >= 0 && c.businessHours) {
        var valEl = card.querySelector('.contact-card-val');
        if (valEl) valEl.textContent = c.businessHours;
      }
    });

    /* ══════════════════════════════════════════
       ABOUT PAGE — about.html
       ══════════════════════════════════════════ */
    var avName = document.querySelector('.av-name');
    if (avName && s.trainerName) avName.textContent = s.trainerName.toUpperCase();
    var ebNum = document.querySelector('.eb-num');
    if (ebNum && c.statYears) ebNum.textContent = c.statYears;
    var sebiPill = document.querySelector('.sebi-pill');
    if (sebiPill && s.sebi) sebiPill.textContent = 'SEBI REG. NO: ' + s.sebi;

    /* ══════════════════════════════════════════
       SHARED — ALL PAGES
       ══════════════════════════════════════════ */

    /* Phone links */
    document.querySelectorAll('a[href^="tel:"]').forEach(function(a) {
      if (s.phone) { a.href = 'tel:' + s.phone.replace(/[^+\d]/g, ''); a.textContent = s.phone; }
    });

    /* Email links */
    document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) {
      if (s.email) { a.href = 'mailto:' + s.email; a.textContent = s.email; }
    });

    /* WhatsApp links */
    if (s.whatsapp) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) {
        var txt = a.href.split('?text=')[1] || '';
        a.href = s.whatsapp + (txt ? '?text=' + txt : '');
      });
    }

    /* Social links */
    if (s.youtube) document.querySelectorAll('a[href*="youtube.com"]').forEach(function(a) { a.href = s.youtube; });
    if (s.instagram) document.querySelectorAll('a[href*="instagram.com"]').forEach(function(a) { a.href = s.instagram; });
    if (s.facebook) document.querySelectorAll('a[href*="facebook.com"]').forEach(function(a) { a.href = s.facebook; });

    /* Footer credentials (desktop) */
    document.querySelectorAll('footer .dr').forEach(function(row) {
      var key = row.querySelector('.dk');
      var val = row.querySelector('.dv');
      if (!key || !val) return;
      var k = key.textContent.trim();
      if (k === 'REG. NO.' && s.sebi) val.textContent = s.sebi;
      if (k === 'EXPERIENCE' && c.statYears) val.textContent = c.statYears + ' YEARS';
      if (k === 'STUDENTS' && c.statStudents) val.textContent = c.statStudents + ' TRAINED';
    });

    /* SEBI badge (mobile) */
    var sebiBadge = document.querySelector('.sebi-badge-text');
    if (sebiBadge && s.sebi) {
      var spans = sebiBadge.querySelectorAll('span');
      if (spans.length >= 2) spans[1].textContent = 'Research Analyst \u00b7 ' + s.sebi;
    }

    /* ══════════════════════════════════════════
       TESTIMONIALS — desktop + mobile
       ══════════════════════════════════════════ */

    /* Desktop testimonials page (testimonials.html) */
    var tGrid = document.getElementById('testimonialGrid');
    if (tGrid && t.length > 0) {
      var html = '';
      t.forEach(function(item) {
        var stars = '';
        for (var i = 0; i < 5; i++) stars += i < (parseInt(item.rating) || 5) ? '\u2605' : '\u2606';
        html += '<div class="tcard"><div class="tc-stars">' + stars + '</div>' +
          '<p class="tc-quote">\u201C' + (item.quote || '') + '\u201D</p>' +
          '<div class="tc-name">' + (item.name || '') + '</div>' +
          '<div class="tc-detail">' + (item.detail || '') + '</div></div>';
      });
      tGrid.insertAdjacentHTML('beforeend', html);
    }

    /* Mobile testimonials (testi-track) */
    var testiTrack = document.getElementById('testi-track');
    if (testiTrack && t.length > 0) {
      testiTrack.innerHTML = '';
      t.forEach(function(item) {
        var stars = '';
        for (var i = 0; i < 5; i++) stars += i < (parseInt(item.rating) || 5) ? '\u2605' : '\u2606';
        var initials = (item.name || '').split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2);
        testiTrack.innerHTML += '<div class="testi-card">' +
          '<div class="testi-stars">' + stars + '</div>' +
          '<div class="testi-text">' + (item.quote || '') + '</div>' +
          '<div class="testi-author">' +
            '<div class="testi-avatar">' + initials + '</div>' +
            '<div><div class="testi-name">' + (item.name || '') + '</div>' +
            '<div class="testi-role">' + (item.detail || '') + '</div></div>' +
          '</div></div>';
      });
    }
  }

  /* Fetch site-data.json and apply */
  fetch('/site-data.json?' + Date.now())
    .then(function(r) { return r.json(); })
    .then(apply)
    .catch(function() { /* Fallback: hardcoded HTML stays as-is */ });
})();
