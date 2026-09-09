/* mc-guide — floating bull mascot + first-visit guided tour.
   - Renders a lightweight inline-SVG bull immediately (no perf cost).
   - Upgrades to a real 3D <model-viewer> ONLY if /models/bull.glb exists (HEAD check),
     so the heavy WebGL library never loads until the owner supplies the model.
   - Runs a 3-step guided tour on first visit (localStorage-gated); click the bull to replay. */
(function () {
  var KEY = 'mc_tour_v1';
  var GLB = '/models/bull.glb';

  var STEPS = [
    { sel: '#home', step: 'Step 1 of 3', title: 'Namaste! 👋', text: 'Main Market Credo ka guide hoon. Yahan aap charts ki language seekhte ho — SEBI-registered analyst Atish Shakergaye ke saath.' },
    { sel: '#curriculum', step: 'Step 2 of 3', title: '52-module curriculum', text: 'Poora syllabus — chart structure, flow, patterns aur behaviour — 8 phases mein. Yahin dekh sakte ho.' },
    { sel: '#enquire', step: 'Step 3 of 3', title: 'Free 2-day demo', text: 'Apna naam aur number bharo — free 2-day demo book ho jayega. No cost, no commitment.' }
  ];

  // Cute, on-brand bull mascot (green + white, amber nose ring).
  var BULL =
    '<svg viewBox="0 0 100 100" role="img" aria-label="Market Credo bull guide">' +
    '<circle cx="50" cy="52" r="46" fill="#34B350"/>' +
    '<path d="M30 40C19 31 17 21 23 16c4 10 8 16 15 20z" fill="#fff"/>' +
    '<path d="M70 40C81 31 83 21 77 16c-4 10-8 16-15 20z" fill="#fff"/>' +
    '<ellipse cx="50" cy="55" rx="26" ry="24" fill="#fff"/>' +
    '<circle cx="41" cy="50" r="3.6" fill="#173d24"/>' +
    '<circle cx="59" cy="50" r="3.6" fill="#173d24"/>' +
    '<ellipse cx="50" cy="67" rx="14" ry="10" fill="#eafff0"/>' +
    '<circle cx="45" cy="67" r="2.3" fill="#173d24"/>' +
    '<circle cx="55" cy="67" r="2.3" fill="#173d24"/>' +
    '<circle cx="50" cy="72" r="3.4" fill="none" stroke="#F2AA32" stroke-width="2.2"/>' +
    '</svg>';

  var guide = document.createElement('button');
  guide.className = 'mc-guide';
  guide.type = 'button';
  guide.setAttribute('aria-label', 'Site guide — start the Market Credo tour');
  guide.innerHTML = BULL;
  document.body.appendChild(guide);
  guide.addEventListener('click', function () { start(); });

  // ---- optional 3D upgrade (only if the model file exists) ----
  fetch(GLB, { method: 'HEAD' }).then(function (r) {
    if (!r.ok) return;
    import('https://cdn.jsdelivr.net/npm/@google/model-viewer@4/dist/model-viewer.min.js').then(function () {
      var mv = document.createElement('model-viewer');
      mv.setAttribute('src', GLB);
      mv.setAttribute('alt', '3D bull mascot — Market Credo');
      mv.setAttribute('camera-controls', '');
      mv.setAttribute('auto-rotate', '');
      mv.setAttribute('disable-zoom', '');
      mv.setAttribute('interaction-prompt', 'none');
      mv.setAttribute('shadow-intensity', '1');
      mv.addEventListener('error', function () { guide.innerHTML = BULL; }); // fall back to SVG
      guide.innerHTML = '';
      guide.appendChild(mv);
    }).catch(function () { /* keep SVG */ });
  }).catch(function () { /* keep SVG */ });

  // ---- guided tour ----
  var tip = null, cur = null;
  function clearHi() { if (cur) { cur.classList.remove('mc-highlight'); cur = null; } }
  function end() { clearHi(); if (tip) { tip.remove(); tip = null; } try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  function show(i) {
    var s = STEPS[i], el = document.querySelector(s.sel), last = i >= STEPS.length - 1;
    clearHi();
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('mc-highlight'); cur = el; }
    if (!tip) { tip = document.createElement('div'); tip.className = 'mc-tip'; document.body.appendChild(tip); }
    tip.innerHTML = '<div class="mc-step"></div><h4></h4><p></p><div class="mc-tip-row"><button class="mc-skip" type="button"></button><button class="mc-next" type="button"></button></div>';
    tip.querySelector('.mc-step').textContent = s.step;
    tip.querySelector('h4').textContent = s.title;
    tip.querySelector('p').textContent = s.text;
    tip.querySelector('.mc-skip').textContent = last ? 'Close' : 'Skip';
    tip.querySelector('.mc-next').textContent = last ? 'Done ✓' : 'Next →';
    tip.querySelector('.mc-skip').onclick = end;
    tip.querySelector('.mc-next').onclick = function () { last ? end() : show(i + 1); };
  }
  function start() { show(0); }

  // Auto-run once, on first visit, after the page is idle (never blocks load).
  var seen = false; try { seen = !!localStorage.getItem(KEY); } catch (e) {}
  if (!seen) (window.requestIdleCallback || function (f) { setTimeout(f, 1400); })(function () { start(); });
})();
