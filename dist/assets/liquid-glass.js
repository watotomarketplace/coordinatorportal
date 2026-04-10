/**
 * Liquid Glass — Interactive Behaviors
 *
 * Runtime enhancements for Apple Liquid Glass design:
 * 1. Mouse-tracking radial highlight on glass cards (desktop only)
 * 2. Auto-tag glass elements with .lg-glass class
 * 3. Swipe-back navigation (mobile, left edge)
 * 4. Tab swipe navigation (mobile)
 */
(function () {
  'use strict';

  const isMobile = window.innerWidth <= 768;
  const isTouch = 'ontouchstart' in window;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── 1. MOUSE-TRACKING RADIAL HIGHLIGHT (Desktop Only) ────
  if (!isMobile && !isTouch && window.matchMedia('(hover: hover)').matches) {
    const GLASS_SELECTORS = '.glass-card, .stat-card, .group-card, .user-card';
    let currentCard = null;
    let rafId = null;

    document.addEventListener('mousemove', function (e) {
      const card = e.target.closest(GLASS_SELECTORS);

      // Remove glow from previous card
      if (currentCard && currentCard !== card) {
        currentCard.classList.remove('lg-mouse-glow');
        currentCard = null;
      }

      if (!card) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        return;
      }

      currentCard = card;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function () {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
        card.style.setProperty('--mouse-x', x);
        card.style.setProperty('--mouse-y', y);
        card.classList.add('lg-mouse-glow');
        rafId = null;
      });
    });

    // Clean up when mouse leaves the viewport
    document.addEventListener('mouseleave', function () {
      if (currentCard) {
        currentCard.classList.remove('lg-mouse-glow');
        currentCard = null;
      }
    });
  }


  // ─── 2. AUTO-TAG GLASS ELEMENTS ────────────────────────────
  // MutationObserver that tags elements with inline backdrop-filter
  // so they get the specular ::before from liquid-glass.css.
  function tagGlassElements() {
    var candidates = document.querySelectorAll(
      '[style*="backdrop-filter"], [style*="glass-layer"], [style*="glass-bg"]'
    );
    candidates.forEach(function (el) {
      if (el.dataset.lgTagged) return;
      // Skip very small elements (icons, badges)
      if (el.offsetWidth < 60 || el.offsetHeight < 40) return;
      el.dataset.lgTagged = '1';
      el.classList.add('lg-glass');
    });
  }

  // Run periodically (debounced via MutationObserver)
  var tagTimer = null;
  var observer = new MutationObserver(function () {
    if (tagTimer) clearTimeout(tagTimer);
    tagTimer = setTimeout(tagGlassElements, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // Initial pass
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tagGlassElements);
  } else {
    setTimeout(tagGlassElements, 500);
  }


  // ─── 3. SWIPE-BACK NAVIGATION (Mobile Only) ───────────────
  if (isMobile && !prefersReducedMotion) {
    var swipeBackIndicator = null;
    var touchStartX = 0;
    var touchStartY = 0;
    var isSwipingBack = false;

    function ensureIndicator() {
      if (swipeBackIndicator) return;
      swipeBackIndicator = document.createElement('div');
      swipeBackIndicator.id = 'lg-swipe-back-indicator';
      document.body.appendChild(swipeBackIndicator);
    }

    document.addEventListener('touchstart', function (e) {
      var touch = e.touches[0];
      // Only trigger from the left 20px edge
      if (touch.clientX > 20) return;
      // Don't trigger on home/login pages
      var path = window.location.pathname;
      if (path === '/' || path === '/login' || path === '/dashboard') return;

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isSwipingBack = true;
      ensureIndicator();
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!isSwipingBack) return;
      var touch = e.touches[0];
      var dx = touch.clientX - touchStartX;
      var dy = Math.abs(touch.clientY - touchStartY);

      // Cancel if vertical swipe dominates
      if (dy > dx * 1.5) {
        isSwipingBack = false;
        if (swipeBackIndicator) swipeBackIndicator.classList.remove('lg-swipe-active');
        return;
      }

      if (dx > 10 && swipeBackIndicator) {
        swipeBackIndicator.classList.add('lg-swipe-active');
        // Scale indicator opacity based on progress
        var progress = Math.min(dx / 80, 1);
        swipeBackIndicator.style.opacity = String(progress);
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!isSwipingBack) return;
      isSwipingBack = false;

      var touch = e.changedTouches[0];
      var dx = touch.clientX - touchStartX;

      if (swipeBackIndicator) {
        swipeBackIndicator.classList.remove('lg-swipe-active');
        swipeBackIndicator.style.opacity = '0';
      }

      // Trigger back navigation if swiped > 80px
      if (dx > 80) {
        window.history.back();
      }
    }, { passive: true });
  }


  // ─── 4. TAB SWIPE NAVIGATION (Mobile Only) ────────────────
  if (isMobile && !prefersReducedMotion) {
    var tabTouchStartX = 0;
    var tabTouchStartY = 0;
    var tabSwiping = false;

    // Known tab paths in order
    var TAB_PATHS = ['/dashboard', '/students', '/groups', '/attendance', '/reports'];

    document.addEventListener('touchstart', function (e) {
      var touch = e.touches[0];
      // Don't start tab swipe from edges (that's swipe-back)
      if (touch.clientX < 25 || touch.clientX > window.innerWidth - 25) return;
      // Only on main pages
      if (!TAB_PATHS.includes(window.location.pathname)) return;

      tabTouchStartX = touch.clientX;
      tabTouchStartY = touch.clientY;
      tabSwiping = true;
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!tabSwiping) return;
      tabSwiping = false;

      var touch = e.changedTouches[0];
      var dx = touch.clientX - tabTouchStartX;
      var dy = Math.abs(touch.clientY - tabTouchStartY);

      // Must be predominantly horizontal and > 100px
      if (Math.abs(dx) < 100 || dy > Math.abs(dx) * 0.6) return;

      var currentIdx = TAB_PATHS.indexOf(window.location.pathname);
      if (currentIdx === -1) return;

      var nextIdx = dx < 0 ? currentIdx + 1 : currentIdx - 1;
      if (nextIdx < 0 || nextIdx >= TAB_PATHS.length) return;

      // Navigate using React Router if available, otherwise pushState
      var nextPath = TAB_PATHS[nextIdx];
      if (window.__REACT_ROUTER_NAVIGATE__) {
        window.__REACT_ROUTER_NAVIGATE__(nextPath);
      } else {
        window.history.pushState({}, '', nextPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, { passive: true });
  }

})();
