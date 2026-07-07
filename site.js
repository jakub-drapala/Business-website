/* j-soft.me — progressive enhancement. Strona dziala w pelni bez tego pliku. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Hamburger (przeniesiony z inline onclick) --- */
  var nav = document.querySelector('nav');
  var burger = document.querySelector('.hamburger');
  if (nav && burger) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('nav-open');
    });
  }

  /* --- Nav po przewinieciu --- */
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('nav-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --- Scroll reveal --- */
  var REVEAL_SELECTOR = '.section-header, .problem-card, .svc-card, .trust-item';
  function initReveal(extraSelector) {
    var selector = extraSelector ? REVEAL_SELECTOR + ', ' + extraSelector : REVEAL_SELECTOR;
    var targets = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (reduceMotion || !('IntersectionObserver' in window) || !targets.length) return;
    var perParent = new Map();
    targets.forEach(function (el) {
      var n = perParent.get(el.parentElement) || 0;
      el.style.setProperty('--reveal-delay', (n * 60) + 'ms');
      perParent.set(el.parentElement, n + 1);
      el.classList.add('reveal');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* --- Liczniki trust-grid --- */
  function initCounters() {
    var nums = document.querySelectorAll('.trust-num');
    if (reduceMotion || !('IntersectionObserver' in window) || !nums.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        animateCount(entry.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(nums, function (el) { io.observe(el); });
  }
  function animateCount(el) {
    var m = el.textContent.trim().match(/^(\d+)([\s\S]*)$/);
    if (!m) return;
    var target = parseInt(m[1], 10);
    var suffix = m[2];
    var t0 = null;
    var DUR = 600;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var t = Math.min((ts - t0) / DUR, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* --- Interaktywna os procesu --- */
  function initProcess() {
    var grid = document.querySelector('.process-grid');
    if (!grid) return false;
    var steps = Array.prototype.slice.call(grid.querySelectorAll('.process-step'));
    if (steps.length < 2) return false;

    var track = document.createElement('div');
    track.className = 'process-track';
    var panel = document.createElement('div');
    panel.className = 'process-panel';

    var nodes = steps.map(function (step, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'process-node';
      btn.innerHTML =
        '<span class="process-node-num">' + step.querySelector('.process-num').textContent + '</span>' +
        '<span class="process-node-name">' + step.querySelector('.process-name').textContent + '</span>';
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () { activate(i, false); });
      track.appendChild(btn);
      return btn;
    });

    track.addEventListener('keydown', function (e) {
      var current = nodes.indexOf(document.activeElement);
      if (current === -1) return;
      var next = e.key === 'ArrowRight' ? current + 1 : (e.key === 'ArrowLeft' ? current - 1 : null);
      if (next === null || !nodes[next]) return;
      e.preventDefault();
      nodes[next].focus();
      activate(next, false);
    });

    function activate(i, instant) {
      nodes.forEach(function (n, j) {
        n.classList.toggle('is-active', j === i);
        n.setAttribute('aria-expanded', String(j === i));
      });
      var desc = steps[i].querySelector('.process-desc');
      var more = steps[i].querySelector('.process-more');
      var html = '<p class="process-panel-desc">' + desc.innerHTML + '</p>' +
                 (more ? '<p class="process-panel-more">' + more.innerHTML + '</p>' : '');
      if (!instant && !reduceMotion) {
        panel.classList.remove('is-shown');
        panel.innerHTML = html;
        void panel.offsetWidth;
        panel.classList.add('is-shown');
      } else {
        panel.innerHTML = html;
        panel.classList.add('is-shown');
      }
    }

    grid.hidden = true;
    grid.parentElement.insertBefore(track, grid);
    grid.parentElement.insertBefore(panel, grid);
    activate(0, true);
    return true;
  }

  /* === INIT === */
  var hasTimeline = initProcess();
  initReveal(hasTimeline ? '.process-track, .process-panel' : '.process-step');
  initCounters();
})();
