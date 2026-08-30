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

  /* ------------------------------------------------------- hero lattice
     A living biosynthetic network: nodes drift, bonds form when they come
     within range, and occasionally a reactive intermediate walks the lattice and
     leaves a crosslink behind — biosynthesis, abstracted.                 */
  var cv = document.getElementById('lattice');
  if (cv && !reduced) {
    var ctx = cv.getContext('2d');
    var w, h, dpr, nodes = [], radicals = [], links = [], raf;
    var COLORS = { amber: '#ffb228', ember: '#ff5f3d', cyan: '#4fd1c5' };

    function palette() {
      var light = root.getAttribute('data-theme') === 'light';
      return {
        node: light ? 'rgba(20,20,28,' : 'rgba(238,240,244,',
        bond: light ? 'rgba(60,60,75,' : 'rgba(160,170,190,'
      };
    }
    var pal = palette();
    window.addEventListener('themechange', function () { pal = palette(); });

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var density = Math.round((w * h) / 15500);
      var n = Math.max(38, Math.min(density, 130));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.5 + 0.7,
          hot: 0
        });
      }
      links = [];
      radicals = [];
      for (var k = 0; k < 3; k++) spawnRadical();
    }

    function spawnRadical() {
      if (!nodes.length) return;
      var from = nodes[(Math.random() * nodes.length) | 0];
      radicals.push({
        from: from,
        to: nearest(from),
        t: 0,
        speed: 0.006 + Math.random() * 0.008,
        color: Math.random() < 0.5 ? COLORS.amber : COLORS.ember
      });
    }

    function nearest(a) {
      var best = null, bd = Infinity;
      for (var i = 0; i < nodes.length; i++) {
        var b = nodes[i];
        if (b === a) continue;
        var d = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
        if (d < bd) { bd = d; best = b; }
      }
      return best || a;
    }

    var mouse = { x: -9999, y: -9999 };
    cv.parentElement.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    cv.parentElement.addEventListener('pointerleave', function () {
      mouse.x = mouse.y = -9999;
    });

    var MAX = 132;
    function frame() {
      ctx.clearRect(0, 0, w, h);

      /* bonds */
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        a.hot *= 0.955;

        /* gentle repulsion from the pointer — the lattice breathes */
        var mdx = a.x - mouse.x, mdy = a.y - mouse.y;
        var md2 = mdx * mdx + mdy * mdy;
        if (md2 < 16000 && md2 > 1) {
          var f = (1 - md2 / 16000) * 0.55;
          var md = Math.sqrt(md2);
          a.x += (mdx / md) * f; a.y += (mdy / md) * f;
        }

        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX) {
            var alpha = (1 - d / MAX) * 0.3;
            ctx.strokeStyle = pal.bond + alpha.toFixed(3) + ')';
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      /* persistent crosslinks laid down by radicals */
      for (var L = links.length - 1; L >= 0; L--) {
        var l = links[L];
        l.life -= 0.0035;
        if (l.life <= 0) { links.splice(L, 1); continue; }
        ctx.strokeStyle = hexA(l.color, l.life * 0.75);
        ctx.lineWidth = 1.35;
        ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y); ctx.lineTo(l.b.x, l.b.y); ctx.stroke();
      }

      /* nodes */
      for (var n2 = 0; n2 < nodes.length; n2++) {
        var p = nodes[n2];
        ctx.fillStyle = pal.node + (0.28 + p.hot * 0.6).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + p.hot * 2.4, 0, 6.2832); ctx.fill();
      }

      /* radicals */
      for (var r2 = radicals.length - 1; r2 >= 0; r2--) {
        var rad = radicals[r2];
        rad.t += rad.speed;
        var x = rad.from.x + (rad.to.x - rad.from.x) * rad.t;
        var y = rad.from.y + (rad.to.y - rad.from.y) * rad.t;
        var g = ctx.createRadialGradient(x, y, 0, x, y, 16);
        g.addColorStop(0, hexA(rad.color, 0.95));
        g.addColorStop(1, hexA(rad.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 16, 0, 6.2832); ctx.fill();

        if (rad.t >= 1) {
          rad.to.hot = 1;
          if (links.length < 26) links.push({ a: rad.from, b: rad.to, life: 1, color: rad.color });
          rad.from = rad.to;
          rad.to = Math.random() < 0.25 ? nodes[(Math.random() * nodes.length) | 0] : nearest(rad.to);
          rad.t = 0;
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function hexA(hex, a) {
      var v = parseInt(hex.slice(1), 16);
      return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a.toFixed(3) + ')';
    }

    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(cv); else window.addEventListener('resize', resize);
    resize();
    frame();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { raf = requestAnimationFrame(frame); }
    });
  }

  /* ---------------------------------------------------------- year */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
