/* Bushin Lab — interactions
   Everything degrades gracefully: no framework, no build step. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- theme */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('bushin-theme'); } catch (e) {}
  if (saved) root.setAttribute('data-theme', saved);
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('bushin-theme', next); } catch (e) {}
      window.dispatchEvent(new Event('themechange'));
    });
  }

  /* ------------------------------------------------------------------ nav */
  var nav = document.querySelector('.nav');
  var bar = document.querySelector('.progress');
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('stuck', y > 24);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', document.body.classList.contains('menu-open'));
    });
  }
  function closeMenu() {
    document.body.classList.remove('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      closeMenu();
      if (burger) burger.focus();
    }
  });

  /* --------------------------------------------------------- scrollspy */
  var sections = [].slice.call(document.querySelectorAll('section[id]'));
  var linkFor = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
    linkFor[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var l = linkFor[e.target.id];
        if (l && e.isIntersecting) {
          Object.keys(linkFor).forEach(function (k) { linkFor[k].removeAttribute('aria-current'); });
          l.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------------------------------------------------------- reveals */
  var rv = [].slice.call(document.querySelectorAll('.rv'));
  if (reduced || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var d = parseFloat(e.target.dataset.delay || 0);
        setTimeout(function () { e.target.classList.add('in'); }, d * 1000);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* --------------------------------------------------- card spotlight */
  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      c.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });

  /* ------------------------------------------------------ stat counters */
  var stats = [].slice.call(document.querySelectorAll('[data-count]'));
  if (stats.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = parseFloat(el.dataset.count), t0 = null;
        if (reduced) { el.firstChild.nodeValue = target; cio.unobserve(el); return; }
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1100, 1);
          var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
          el.firstChild.nodeValue = v;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    stats.forEach(function (s) { cio.observe(s); });
  }

  /* ----------------------------------------------- publication filters */
  var chips = [].slice.call(document.querySelectorAll('.chip[data-filter]'));
  var pubs = [].slice.call(document.querySelectorAll('.pub'));
  var count = document.getElementById('pub-count');
  function applyFilter(key) {
    var shown = 0;
    pubs.forEach(function (p) {
      var ok = key === 'all' || (p.dataset.topics || '').split(' ').indexOf(key) > -1;
      p.hidden = !ok;
      if (ok) shown++;
    });
    if (count) count.textContent = shown;
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', 'true');
      applyFilter(c.dataset.filter);
    });
  });
  if (count) count.textContent = pubs.length;

  /* -------------------------------------------------------- last updated
     document.lastModified reflects the Last-Modified header GitHub Pages
     sends for this file, i.e. the most recent deploy. The markup carries a
     hardcoded fallback for the no-JS case.                              */
  var upd = document.getElementById('updated');
  if (upd) {
    var lm = new Date(document.lastModified);
    if (!isNaN(lm.getTime())) {
      upd.textContent = 'Last updated ' +
        lm.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }

})();
