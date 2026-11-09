(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Sprache (DE / EN) ---------- */
  var i18n = $$('[data-en], *').filter(function (el) {
    for (var i = 0; i < el.attributes.length; i++) {
      if (el.attributes[i].name.indexOf('data-en') === 0) return true;
    }
    return false;
  });

  function setLang(lang) {
    doc.lang = lang;
    i18n.forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (a) {
        if (a.name === 'data-en') {
          if (el.getAttribute('data-de') === null) el.setAttribute('data-de', el.innerHTML);
          el.innerHTML = lang === 'en' ? a.value : el.getAttribute('data-de');
        } else if (a.name.indexOf('data-en-') === 0) {
          var attr = a.name.slice(8), key = 'data-de-' + attr;
          if (el.getAttribute(key) === null) el.setAttribute(key, el.getAttribute(attr) || '');
          el.setAttribute(attr, lang === 'en' ? a.value : el.getAttribute(key));
        }
      });
    });
    $$('#lang span').forEach(function (s, i) { s.classList.toggle('on', (i === 0) === (lang === 'de')); });
    store.set('lang', lang);
  }
  var langBtn = $('#lang');
  langBtn.addEventListener('click', function () { setLang(doc.lang === 'de' ? 'en' : 'de'); });
  if (store.get('lang') === 'en') setLang('en');

  /* ---------- Theme ---------- */
  var themeMeta = $('meta[name="theme-color"]');
  function applyTheme(t) {
    doc.setAttribute('data-theme', t);
    if (themeMeta) themeMeta.setAttribute('content', t === 'light' ? '#f6f5f1' : '#07080c');
    drawStatic();
  }
  $('#theme').addEventListener('click', function () {
    var t = doc.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    store.set('theme', t); applyTheme(t);
  });

  /* ---------- Menü (mobil) ---------- */
  var burger = $('#burger'), menu = $('#menu');
  function closeMenu() { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Reveal ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Spotlight auf Karten ---------- */
  $$('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Scroll: Fortschritt, Timeline, aktive Navigation ---------- */
  var bar = $('.progress i'), timeline = $('#timeline'), chapters = $$('.chapter');
  var sections = $$('main section[id]'), links = $$('.menu a');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var vh = window.innerHeight;
    var max = doc.scrollHeight - vh;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);

    var r = timeline.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / r.height));
    timeline.style.setProperty('--p', p.toFixed(4));
    chapters.forEach(function (c) {
      c.classList.toggle('on', c.getBoundingClientRect().top < vh * 0.6);
    });

    var cur = '';
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= vh * 0.35) cur = s.id; });
    links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Projekt-Pipelines ---------- */
  $$('[data-pipe]').forEach(function (card) {
    var steps = $$('.pipe li', card), i = -1, timer = null;
    if (reduce) { steps.forEach(function (s) { s.classList.add('active'); }); return; }
    function tick() {
      i = (i + 1) % (steps.length + 1);
      steps.forEach(function (s, idx) { s.classList.toggle('active', idx === i); });
    }
    if (!('IntersectionObserver' in window)) { steps.forEach(function (s) { s.classList.add('active'); }); return; }
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { if (!timer) { tick(); timer = setInterval(tick, 1100); } }
      else { clearInterval(timer); timer = null; }
    }, { threshold: 0.35 }).observe(card);
  });

  /* ---------- E-Mail kopieren ---------- */
  var copyBtn = $('#copy'), note = $('#copied'), mail = $('#mail');
  copyBtn.addEventListener('click', function () {
    var text = mail.textContent.trim();
    function done() {
      var en = doc.lang === 'en';
      note.textContent = en ? 'Address copied' : 'Adresse kopiert';
      var label = $('span', copyBtn), old = label.innerHTML;
      label.textContent = en ? 'Copied ✓' : 'Kopiert ✓';
      setTimeout(function () { label.innerHTML = old; note.textContent = ''; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  });

  /* ---------- Hero-Hintergrund: Blueprint-Raster -> neuronales Netz ---------- */
  var canvas = $('#net'), ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = 1, gap = 52, pts = [], cols = 0, rows = 0;
  var mouse = { x: -9999, y: -9999, active: false }, running = false, visible = true, t0 = performance.now();

  function size() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gap = W < 700 ? 40 : 54;
    cols = Math.ceil(W / gap) + 1; rows = Math.ceil(H / gap) + 1;
    pts = [];
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      pts.push({ bx: x * gap, by: y * gap, x: x * gap, y: y * gap, ph: Math.random() * 6.28 });
    }
  }

  function palette() {
    var light = doc.getAttribute('data-theme') === 'light';
    return {
      a: light ? [180, 95, 6] : [255, 180, 84],
      b: light ? [31, 95, 224] : [120, 165, 255],
      dot: light ? 'rgba(13,17,23,' : 'rgba(255,255,255,'
    };
  }

  function frame(now) {
    var P = palette(), t = (now - t0) / 1000, R = Math.min(260, W * 0.4);
    var mx = mouse.x, my = mouse.y;
    if (!mouse.active) { // Auto-Cursor, damit die Fläche auch ohne Maus (Touch) lebt
      mx = W * (0.62 + 0.28 * Math.sin(t * 0.35));
      my = H * (0.45 + 0.28 * Math.sin(t * 0.5 + 1.2));
    }
    ctx.clearRect(0, 0, W, H);
    var i, p, dx, dy, d, f;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      p.x = p.bx + Math.sin(t * 0.6 + p.ph) * 2.2;
      p.y = p.by + Math.cos(t * 0.5 + p.ph) * 2.2;
      dx = mx - p.x; dy = my - p.y; d = Math.sqrt(dx * dx + dy * dy);
      if (d < R) { f = Math.pow(1 - d / R, 2) * 14; p.x += dx / (d || 1) * f; p.y += dy / (d || 1) * f; }
      p.d = d;
    }
    ctx.lineWidth = 1;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      var k = Math.max(0, p.x / W), col = [
        P.a[0] + (P.b[0] - P.a[0]) * k, P.a[1] + (P.b[1] - P.a[1]) * k, P.a[2] + (P.b[2] - P.a[2]) * k
      ].map(Math.round).join(',');
      var near = p.d < R ? Math.pow(1 - p.d / R, 1.6) : 0;
      // Blueprint-Raster (rechts und unten)
      var x = i % cols, y = (i / cols) | 0, nb = [];
      if (x < cols - 1) nb.push(pts[i + 1]);
      if (y < rows - 1) nb.push(pts[i + cols]);
      if (near > 0.02) { // Netz: Diagonalen nur in der Nähe des Cursors
        if (x < cols - 1 && y < rows - 1) nb.push(pts[i + cols + 1]);
        if (x > 0 && y < rows - 1) nb.push(pts[i + cols - 1]);
      }
      for (var j = 0; j < nb.length; j++) {
        var q = nb[j], qn = q.d < R ? Math.pow(1 - q.d / R, 1.6) : 0;
        var a = 0.045 + 0.55 * Math.max(near, qn) * (0.5 + 0.5 * Math.min(near, qn) / (Math.max(near, qn) || 1));
        ctx.strokeStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      ctx.fillStyle = near > 0.05 ? 'rgba(' + col + ',' + (0.35 + near * 0.65).toFixed(2) + ')' : P.dot + '0.16)';
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 + near * 2.4, 0, 6.283); ctx.fill();
    }
  }

  function loop(now) {
    if (!running) return;
    frame(now);
    requestAnimationFrame(loop);
  }
  function start() { if (!running && visible && !document.hidden && !reduce) { running = true; requestAnimationFrame(loop); } }
  function stop() { running = false; }
  function drawStatic() { if (W) frame(performance.now()); }

  size(); drawStatic();
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { size(); drawStatic(); }, 120); });
  var hero = canvas.parentElement;
  hero.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = e.pointerType === 'mouse';
  });
  hero.addEventListener('pointerleave', function () { mouse.active = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  start();
})();
