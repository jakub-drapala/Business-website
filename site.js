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

  /* === INIT === */
  initReveal('');
  initCounters();
})();
