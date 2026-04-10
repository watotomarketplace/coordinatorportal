/**
 * Interaction Layer — WL101 Portal v2
 * 
 * REPLACES: liquid-glass.js
 *
 * Minimal runtime enhancements:
 *   1. Hover card highlight (desktop only) — subtle, not glass-y
 *   2. Swipe-back navigation (mobile)
 */
(function () {
  'use strict';

  var isMobile = window.innerWidth <= 768;
  var isTouch = 'ontouchstart' in window;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── 1. HOVER CARD HIGHLIGHT (Desktop Only) ────────────
  if (!isMobile && !isTouch && window.matchMedia('(hover: hover)').matches && !prefersReducedMotion) {
    var CARD_SELECTORS = '.glass-card, .stat-card, .group-card, .user-card, .wl101-chart-card';
    var currentCard = null;

    document.addEventListener('mousemove', function (e) {
      var card = e.target.closest(CARD_SELECTORS);

      if (currentCard && currentCard !== card) {
        currentCard.style.removeProperty('--mouse-x');
        currentCard.style.removeProperty('--mouse-y');
        currentCard = null;
      }

      if (!card) return;
      currentCard = card;

      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
      card.style.setProperty('--mouse-y', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
    });

    document.addEventListener('mouseleave', function () {
      if (currentCard) {
        currentCard.style.removeProperty('--mouse-x');
        currentCard.style.removeProperty('--mouse-y');
        currentCard = null;
      }
    });
  }


  // ─── 2. SWIPE-BACK NAVIGATION (Mobile Only) ───────────
  if (isMobile && !prefersReducedMotion) {
    var swipeBackIndicator = null;
    var touchStartX = 0;
    var touchStartY = 0;
    var isSwipingBack = false;

    function ensureIndicator() {
      if (swipeBackIndicator) return;
      swipeBackIndicator = document.createElement('div');
      swipeBackIndicator.id = 'wl-swipe-back-indicator';
      document.body.appendChild(swipeBackIndicator);
    }

    document.addEventListener('touchstart', function (e) {
      if (e.touches[0].clientX > 20) return;
      var path = window.location.pathname;
      if (path === '/' || path === '/login' || path === '/dashboard') return;

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwipingBack = true;
      ensureIndicator();
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!isSwipingBack) return;
      var dx = e.touches[0].clientX - touchStartX;
      var dy = Math.abs(e.touches[0].clientY - touchStartY);

      if (dy > dx * 1.5) {
        isSwipingBack = false;
        if (swipeBackIndicator) swipeBackIndicator.classList.remove('wl-swipe-active');
        return;
      }

      if (dx > 10 && swipeBackIndicator) {
        swipeBackIndicator.classList.add('wl-swipe-active');
        swipeBackIndicator.style.opacity = String(Math.min(dx / 80, 1));
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!isSwipingBack) return;
      isSwipingBack = false;

      var dx = e.changedTouches[0].clientX - touchStartX;

      if (swipeBackIndicator) {
        swipeBackIndicator.classList.remove('wl-swipe-active');
        swipeBackIndicator.style.opacity = '0';
      }

      if (dx > 80) window.history.back();
    }, { passive: true });
  }

})();
