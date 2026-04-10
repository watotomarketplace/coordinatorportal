/**
 * WL101 Portal — iOS 26 Experience Engine
 *
 * Transforms the mobile web app into a native iOS feel:
 *   1. Lock Screen with clock, widgets, swipe-to-unlock
 *   2. Home Screen app launcher with dock & search
 *   3. App zoom transitions (icon → fullscreen)
 *   4. App Switcher (horizontal card carousel)
 *   5. Gesture system (swipe up → home, hold → switcher)
 *   6. Spring physics animations
 *
 * Layers on top of mobile-v2.js (which provides tab bar, iOS nav, control center)
 */
(function () {
  'use strict';

  // ─── GUARDS ──────────────────────────────────────────
  var isMobile = window.innerWidth <= 768;
  if (!isMobile) return; // Desktop keeps normal experience

  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // ─── STATE ───────────────────────────────────────────
  var _lockScreenDismissed = false;
  var _isInApp = false;
  var _appHistory = []; // Track recently visited apps for switcher
  var _switcherOpen = false;
  var _jiggleMode = false;
  var _longPressTimer = null;
  var _userSession = null;

  // ─── DOCK APPS (persistent at bottom of home screen) ─
  var DOCK_APPS = [
    { id: 'dashboard', label: 'Home', path: '/dashboard', color: 'linear-gradient(135deg, #FF9966, #FF5E62)' },
    { id: 'groups', label: 'Groups', path: '/groups', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { id: 'reports', label: 'Reports', path: '/weekly-reports', color: 'linear-gradient(135deg, #00b09b, #96c93d)' },
    { id: 'attendance', label: 'Attendance', path: '/attendance', color: 'linear-gradient(135deg, #f6d365, #fda085)' }
  ];

  // ─── UTILITIES ───────────────────────────────────────
  function isLoginPage() { return window.location.pathname === '/login'; }
  function isDashboardPage() {
    var p = window.location.pathname;
    return p === '/dashboard' || p === '/' || p === '';
  }

  function navigateTo(path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function fetchSession() {
    if (_userSession) return Promise.resolve(_userSession);
    return fetch('/api/auth/session', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) { _userSession = data.user || data; return _userSession; })
      .catch(function () { return null; });
  }

  function getIconSVG(appId) {
    var icons = window.__ICONS__;
    var map = {
      'dashboard': 'home', 'students': 'students', 'users': 'users',
      'groups': 'groups', 'attendance': 'attendance', 'reports': 'reports',
      'analytics': 'analytics', 'checkpoints': 'checkpoints', 'audit': 'audit',
      'import': 'batch', 'tech-support': 'techSupport', 'exports': 'exports',
      'settings': 'settings'
    };
    if (icons && map[appId] && icons[map[appId]]) {
      return icons[map[appId]];
    }
    return null;
  }

  function formatTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate() {
    return new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function getGreeting(name) {
    var h = new Date().getHours();
    var g = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    return name ? g + ', ' + name : g;
  }


  // ═══════════════════════════════════════════════════════
  //  1. LOCK SCREEN
  // ═══════════════════════════════════════════════════════
  function createLockScreen() {
    if (isLoginPage()) return;
    if (document.getElementById('ios-lock-screen')) return;

    var ls = document.createElement('div');
    ls.id = 'ios-lock-screen';

    // Clock section
    var clockHTML =
      '<div class="ios-lock-clock">' +
        '<div class="ios-lock-time">' + formatTime() + '</div>' +
        '<div class="ios-lock-date">' + formatDate() + '</div>' +
      '</div>';

    // Widgets section
    var widgetsHTML =
      '<div class="ios-lock-widgets">' +
        '<div class="ios-lock-widget">' +
          '<div class="ios-lock-widget-title">WL101 Program</div>' +
          '<div class="ios-lock-widget-value">Week <span id="ios-widget-week">--</span></div>' +
          '<div class="ios-lock-widget-sub">of 13</div>' +
        '</div>' +
        '<div class="ios-lock-widget">' +
          '<div class="ios-lock-widget-title">Students</div>' +
          '<div class="ios-lock-widget-value" id="ios-widget-students">--</div>' +
          '<div class="ios-lock-widget-sub">enrolled</div>' +
        '</div>' +
      '</div>';

    // Swipe hint
    var swipeHTML =
      '<div class="ios-lock-swipe">' +
        '<div class="ios-lock-swipe-text">Swipe up to open</div>' +
        '<div class="ios-lock-swipe-arrow"></div>' +
      '</div>';

    ls.innerHTML = clockHTML + widgetsHTML + swipeHTML;
    document.body.appendChild(ls);

    // Update clock
    setInterval(function () {
      var el = ls.querySelector('.ios-lock-time');
      if (el) el.textContent = formatTime();
    }, 10000);

    // Load widget data
    fetchSession().then(function () {
      fetch('/api/stats', { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var weekEl = document.getElementById('ios-widget-week');
          var studentsEl = document.getElementById('ios-widget-students');
          if (weekEl && data.currentWeek) weekEl.textContent = data.currentWeek;
          if (studentsEl && data.totalStudents) studentsEl.textContent = data.totalStudents.toLocaleString();
        })
        .catch(function () {});
    });

    // Setup swipe-to-unlock
    setupLockScreenGesture(ls);
  }

  function setupLockScreenGesture(ls) {
    if (!isTouch) {
      // Desktop fallback: click to dismiss
      ls.addEventListener('click', function () { unlockScreen(); });
      return;
    }

    var startY = 0;
    var currentY = 0;
    var tracking = false;

    ls.addEventListener('touchstart', function (e) {
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    ls.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      currentY = e.touches[0].clientY;
      var delta = startY - currentY;

      if (delta > 0) {
        // Moving up — slide lock screen up proportionally
        var pct = Math.min(delta / window.innerHeight, 1);
        ls.style.transform = 'translateY(' + (-delta * 0.6) + 'px) scale(' + (1 - pct * 0.05) + ')';
        ls.style.opacity = 1 - pct * 0.5;
        ls.style.transition = 'none';
      }
    }, { passive: true });

    ls.addEventListener('touchend', function () {
      if (!tracking) return;
      tracking = false;
      var delta = startY - currentY;

      if (delta > 120) {
        unlockScreen();
      } else {
        // Snap back with spring
        ls.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        ls.style.transform = '';
        ls.style.opacity = '';
      }
    }, { passive: true });
  }

  function unlockScreen() {
    var ls = document.getElementById('ios-lock-screen');
    if (!ls || _lockScreenDismissed) return;

    _lockScreenDismissed = true;
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);

    ls.classList.add('ios-unlocking');
    setTimeout(function () {
      ls.classList.add('ios-unlocked');
      ls.remove();
    }, 500);
  }


  // ═══════════════════════════════════════════════════════
  //  2. HOME SCREEN ENHANCEMENT
  // ═══════════════════════════════════════════════════════
  // The home screen is created by mobile-v2.js. We enhance it
  // after it's built by adding dock, search bar, and better styling.

  function enhanceHomeScreen() {
    var hs = document.getElementById('wl-home-screen');
    if (!hs) return;
    if (hs.dataset.ios26Enhanced) return;
    hs.dataset.ios26Enhanced = 'true';

    // Add status bar at top
    if (!hs.querySelector('.ios-home-statusbar')) {
      var statusbar = document.createElement('div');
      statusbar.className = 'ios-home-statusbar';
      statusbar.innerHTML =
        '<span class="ios-home-statusbar-time">' + formatTime() + '</span>' +
        '<span class="ios-home-statusbar-icons">' +
          '<span style="font-size:11px">5G</span>' +
          '<span style="font-size:11px">100%</span>' +
        '</span>';
      hs.insertBefore(statusbar, hs.firstChild);

      // Update status bar time
      setInterval(function () {
        var el = statusbar.querySelector('.ios-home-statusbar-time');
        if (el) el.textContent = formatTime();
      }, 30000);
    }

    // Add search bar after greeting
    var greeting = hs.querySelector('.wl-home-greeting');
    if (greeting && !hs.querySelector('.ios-home-search')) {
      var search = document.createElement('div');
      search.className = 'ios-home-search';
      search.innerHTML =
        '<span class="ios-home-search-icon">\uD83D\uDD0D</span>' +
        '<input class="ios-home-search-input" type="text" placeholder="Search apps..." />';
      greeting.parentNode.insertBefore(search, greeting.nextSibling);

      // Search filtering
      var input = search.querySelector('input');
      input.addEventListener('input', function () {
        var query = this.value.toLowerCase();
        hs.querySelectorAll('.wl-app-icon').forEach(function (icon) {
          var label = icon.querySelector('.wl-app-icon-label');
          if (label) {
            var match = !query || label.textContent.toLowerCase().indexOf(query) !== -1;
            icon.style.display = match ? '' : 'none';
          }
        });
      });
    }

    // Add page dots
    if (!hs.querySelector('.ios-home-dots')) {
      var dots = document.createElement('div');
      dots.className = 'ios-home-dots';
      dots.innerHTML =
        '<div class="ios-home-dot active"></div>' +
        '<div class="ios-home-dot"></div>';
      var grid = hs.querySelector('.wl-app-grid');
      if (grid) {
        grid.parentNode.insertBefore(dots, grid.nextSibling);
      }
    }

    // Create dock
    createHomeDock(hs);

    // Setup long press for jiggle mode
    setupJiggleMode(hs);

    // Attach zoom transition to app icons
    attachZoomTransitions(hs);
  }

  function createHomeDock(hs) {
    if (document.querySelector('.ios-home-dock')) return;

    var dock = document.createElement('div');
    dock.className = 'ios-home-dock';

    DOCK_APPS.forEach(function (app) {
      var icon = document.createElement('div');
      icon.className = 'ios-dock-icon';
      icon.style.background = app.color;
      icon.dataset.path = app.path;
      icon.dataset.appId = app.id;
      icon.setAttribute('aria-label', app.label);

      var svg = getIconSVG(app.id);
      if (svg) {
        icon.innerHTML = svg;
        var svgEl = icon.querySelector('svg');
        if (svgEl) {
          svgEl.style.width = '28px';
          svgEl.style.height = '28px';
          svgEl.style.position = 'relative';
          svgEl.style.zIndex = '1';
        }
      } else {
        // Fallback emoji
        var emojis = { dashboard: '\uD83C\uDFE0', groups: '\uD83C\uDFD8\uFE0F', reports: '\uD83D\uDCDD', attendance: '\uD83D\uDCC5' };
        icon.textContent = emojis[app.id] || '';
      }

      icon.addEventListener('click', function (e) {
        e.preventDefault();
        openApp(app.path, icon);
      });

      dock.appendChild(icon);
    });

    document.body.appendChild(dock);
  }


  // ═══════════════════════════════════════════════════════
  //  3. APP ZOOM TRANSITION
  // ═══════════════════════════════════════════════════════
  function attachZoomTransitions(container) {
    container.querySelectorAll('.wl-app-icon').forEach(function (icon) {
      // Remove existing click handlers by cloning
      if (icon.dataset.iosZoom) return;
      icon.dataset.iosZoom = 'true';

      icon.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var path = icon.dataset.path;
        var imgEl = icon.querySelector('.wl-app-icon-img');
        if (path && imgEl) {
          openApp(path, imgEl);
        }
      }, true);
    });
  }

  function openApp(path, sourceEl) {
    if (_jiggleMode) return; // Don't open in edit mode

    // Track in history for app switcher
    var existing = _appHistory.findIndex(function (a) { return a.path === path; });
    if (existing > -1) _appHistory.splice(existing, 1);

    // Find app info
    var allApps = window.__WL_APP_GRID__ || [];
    var appInfo = allApps.find(function (a) { return a.path === path; }) || { path: path, label: path.replace('/', ''), color: '#333' };
    _appHistory.unshift(appInfo);
    if (_appHistory.length > 8) _appHistory.pop();

    // Instant navigate — transitions removed per user request
    _isInApp = true;
    document.body.classList.add('ios-in-app');
    navigateTo(path);

    if (navigator.vibrate) navigator.vibrate(10);
  }

  function returnToHomeScreen() {
    _isInApp = false;
    document.body.classList.remove('ios-in-app');
    document.body.classList.add('wl-home-active');

    // Navigate to dashboard (home screen will show)
    navigateTo('/dashboard');

    // Clean up any stale state on the home screen overlay
    var hs = document.getElementById('wl-home-screen');
    if (hs) {
      hs.classList.remove('ios-app-opening');
      hs.style.display = '';
      hs.style.filter = '';
      hs.style.transform = '';
      enhanceHomeScreen();
    }
  }


  // ═══════════════════════════════════════════════════════
  //  4. APP SWITCHER
  // ═══════════════════════════════════════════════════════
  function createAppSwitcher() {
    var existing = document.getElementById('ios-app-switcher');
    if (existing) existing.remove();

    var switcher = document.createElement('div');
    switcher.id = 'ios-app-switcher';

    var cards = document.createElement('div');
    cards.className = 'ios-switcher-cards';

    if (_appHistory.length === 0) {
      // Show at least current page
      var current = window.location.pathname;
      _appHistory.push({ path: current, label: current.replace('/', '') || 'Home', color: '#333' });
    }

    _appHistory.forEach(function (app) {
      var card = document.createElement('div');
      card.className = 'ios-switcher-card';
      card.dataset.path = app.path;

      var preview = document.createElement('div');
      preview.className = 'ios-switcher-preview';

      var iconDiv = document.createElement('div');
      iconDiv.className = 'ios-switcher-preview-icon';
      iconDiv.style.background = app.color || '#333';

      var svg = getIconSVG(app.id);
      if (svg) {
        iconDiv.innerHTML = svg;
        var svgEl = iconDiv.querySelector('svg');
        if (svgEl) { svgEl.style.width = '24px'; svgEl.style.height = '24px'; }
      } else {
        iconDiv.textContent = app.icon || '\uD83D\uDCF1';
      }

      var name = document.createElement('div');
      name.className = 'ios-switcher-preview-name';
      name.textContent = app.label || app.path;

      preview.appendChild(iconDiv);
      preview.appendChild(name);
      card.appendChild(preview);

      // Tap to open app
      card.addEventListener('click', function () {
        closeAppSwitcher();
        setTimeout(function () { openApp(app.path, null); }, 100);
      });

      // Swipe up to close app from switcher
      setupSwitcherCardDismiss(card);

      cards.appendChild(card);
    });

    switcher.appendChild(cards);

    // Tap background to close
    switcher.addEventListener('click', function (e) {
      if (e.target === switcher) closeAppSwitcher();
    });

    document.body.appendChild(switcher);
    requestAnimationFrame(function () {
      switcher.classList.add('ios-switcher-visible');
    });
    _switcherOpen = true;

    if (navigator.vibrate) navigator.vibrate(15);
  }

  function setupSwitcherCardDismiss(card) {
    if (!isTouch) return;

    var startY = 0;
    card.addEventListener('touchstart', function (e) {
      startY = e.touches[0].clientY;
    }, { passive: true });

    card.addEventListener('touchmove', function (e) {
      var delta = startY - e.touches[0].clientY;
      if (delta > 0) {
        card.style.transform = 'translateY(' + (-delta * 0.5) + 'px) scale(' + Math.max(0.8, 1 - delta / 800) + ')';
        card.style.opacity = Math.max(0, 1 - delta / 300);
        card.style.transition = 'none';
      }
    }, { passive: true });

    card.addEventListener('touchend', function (e) {
      var delta = startY - e.changedTouches[0].clientY;
      if (delta > 100) {
        // Dismiss card
        card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        card.style.transform = 'translateY(-120%) scale(0.7)';
        card.style.opacity = '0';
        setTimeout(function () { card.remove(); }, 300);

        // Remove from history
        var path = card.dataset.path;
        _appHistory = _appHistory.filter(function (a) { return a.path !== path; });
      } else {
        // Snap back
        card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        card.style.transform = '';
        card.style.opacity = '';
      }
    }, { passive: true });
  }

  function closeAppSwitcher() {
    var switcher = document.getElementById('ios-app-switcher');
    if (switcher) {
      switcher.classList.remove('ios-switcher-visible');
      setTimeout(function () { switcher.remove(); }, 300);
    }
    _switcherOpen = false;
  }


  // ═══════════════════════════════════════════════════════
  //  5. JIGGLE MODE (Long Press Edit)
  // ═══════════════════════════════════════════════════════
  function setupJiggleMode(container) {
    container.querySelectorAll('.wl-app-icon').forEach(function (icon) {
      if (icon.dataset.iosJiggle) return;
      icon.dataset.iosJiggle = 'true';

      icon.addEventListener('touchstart', function () {
        _longPressTimer = setTimeout(function () {
          _jiggleMode = true;
          container.classList.add('ios-jiggle-mode');
          if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
        }, 600);
      }, { passive: true });

      icon.addEventListener('touchend', function () {
        clearTimeout(_longPressTimer);
      }, { passive: true });

      icon.addEventListener('touchmove', function () {
        clearTimeout(_longPressTimer);
      }, { passive: true });
    });

    // Tap background to exit jiggle
    container.addEventListener('click', function (e) {
      if (_jiggleMode && !e.target.closest('.wl-app-icon')) {
        _jiggleMode = false;
        container.classList.remove('ios-jiggle-mode');
      }
    });
  }


  // ═══════════════════════════════════════════════════════
  //  6. GESTURE SYSTEM
  // ═══════════════════════════════════════════════════════
  function setupGestures() {
    if (!isTouch) return;

    var swipeStartY = 0;
    var swipeStartX = 0;
    var swipeStartTime = 0;
    var isSwipingFromBottom = false;

    // ── Swipe Up from Bottom → Home or App Switcher ──
    document.addEventListener('touchstart', function (e) {
      if (isLoginPage()) return;
      if (_switcherOpen) return;
      if (e.target.closest('.modal-overlay')) return;
      if (e.target.closest('#wl-control-center')) return;
      if (e.target.closest('#ios-lock-screen')) return;

      var y = e.touches[0].clientY;
      if (y > window.innerHeight - 30) {
        swipeStartY = y;
        swipeStartX = e.touches[0].clientX;
        swipeStartTime = Date.now();
        isSwipingFromBottom = true;
      }
    }, { passive: true });

    var holdTimeout = null;
    document.addEventListener('touchmove', function (e) {
      if (!isSwipingFromBottom) return;

      var deltaY = swipeStartY - e.touches[0].clientY;

      // If holding at a pause point, trigger app switcher
      if (deltaY > 60 && deltaY < 150 && !holdTimeout) {
        holdTimeout = setTimeout(function () {
          if (isSwipingFromBottom && _isInApp) {
            isSwipingFromBottom = false;
            createAppSwitcher();
          }
        }, 200);
      }

      if (deltaY > 150 || deltaY < 40) {
        clearTimeout(holdTimeout);
        holdTimeout = null;
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      clearTimeout(holdTimeout);
      holdTimeout = null;

      if (!isSwipingFromBottom) return;
      isSwipingFromBottom = false;

      var deltaY = swipeStartY - e.changedTouches[0].clientY;
      var deltaX = Math.abs(e.changedTouches[0].clientX - swipeStartX);
      var elapsed = Date.now() - swipeStartTime;

      // Quick swipe up → go home
      if (deltaY > 100 && deltaY > deltaX * 1.5 && elapsed < 500) {
        if (_isInApp && !_switcherOpen) {
          returnToHomeScreen();
        }
      }
    }, { passive: true });

    // ── Swipe Left from Right Edge → Back ──
    var edgeStartX = 0;
    var edgeTracking = false;

    document.addEventListener('touchstart', function (e) {
      if (e.touches[0].clientX < 15 && _isInApp) {
        edgeStartX = e.touches[0].clientX;
        edgeTracking = true;
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!edgeTracking) return;
      edgeTracking = false;
      var deltaX = e.changedTouches[0].clientX - edgeStartX;
      if (deltaX > 80) {
        // Swipe right from left edge → go back
        if (window.history.length > 1) {
          window.history.back();
        } else {
          returnToHomeScreen();
        }
        if (navigator.vibrate) navigator.vibrate(10);
      }
    }, { passive: true });
  }


  // ═══════════════════════════════════════════════════════
  //  7. SCROLL-AWARE NAV BAR
  // ═══════════════════════════════════════════════════════
  function setupScrollAwareNav() {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var nav = document.getElementById('wl-ios-nav');
        if (nav) {
          nav.classList.toggle('wl-nav-scrolled', window.scrollY > 10);
        }
        ticking = false;
      });
    }, { passive: true });
  }


  // ═══════════════════════════════════════════════════════
  //  8. ROUTE CHANGE HANDLER
  // ═══════════════════════════════════════════════════════
  var _lastPath = window.location.pathname;

  function onRouteChange() {
    var path = window.location.pathname;

    if (isLoginPage()) {
      _isInApp = false;
      document.body.classList.remove('ios-in-app');
      return;
    }

    if (isDashboardPage()) {
      // On home screen — ensure app state is off
      _isInApp = false;
      document.body.classList.remove('ios-in-app');
      document.body.classList.add('wl-home-active');
      setTimeout(enhanceHomeScreen, 200);
    } else {
      // In an app
      _isInApp = true;
      document.body.classList.add('ios-in-app');
      document.body.classList.remove('wl-home-active');
    }
  }


  // ═══════════════════════════════════════════════════════
  //  9. EXPOSE APP GRID FOR TRANSITIONS
  // ═══════════════════════════════════════════════════════
  // Read the APP_GRID from mobile-v2.js context
  function captureAppGrid() {
    // We'll define our own copy since mobile-v2 uses a closure
    window.__WL_APP_GRID__ = [
      { id: 'dashboard', label: 'Home', icon: '\uD83C\uDFE0', path: '/dashboard', color: 'linear-gradient(135deg, #FF9966, #FF5E62)' },
      { id: 'students', label: 'Students', icon: '\uD83C\uDF93', path: '/students', color: 'linear-gradient(135deg, #56CCF2, #2F80ED)' },
      { id: 'users', label: 'Users', icon: '\uD83D\uDC65', path: '/admin', color: 'linear-gradient(135deg, #11998e, #38ef7d)' },
      { id: 'groups', label: 'Groups', icon: '\uD83C\uDFD8\uFE0F', path: '/groups', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
      { id: 'attendance', label: 'Attendance', icon: '\uD83D\uDCC5', path: '/attendance', color: 'linear-gradient(135deg, #f6d365, #fda085)' },
      { id: 'reports', label: 'Reports', icon: '\uD83D\uDCDD', path: '/weekly-reports', color: 'linear-gradient(135deg, #00b09b, #96c93d)' },
      { id: 'analytics', label: 'Analytics', icon: '\uD83D\uDCCA', path: '/reports', color: 'linear-gradient(135deg, #8E2DE2, #4A00E0)' },
      { id: 'checkpoints', label: 'Checkpoints', icon: '\uD83C\uDFAF', path: '/checkpoints', color: 'linear-gradient(135deg, #e17055, #d63031)' },
      { id: 'audit', label: 'Audit', icon: '\uD83D\uDEE1\uFE0F', path: '/audit', color: 'linear-gradient(135deg, #F2994A, #F2C94C)' },
      { id: 'import', label: 'Batch Tool', icon: '\uD83D\uDCE6', path: '/import', color: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
      { id: 'tech-support', label: 'Tech Support', icon: '\uD83D\uDD27', path: '/tech-support', color: 'linear-gradient(135deg, #0984e3, #6c5ce7)' },
      { id: 'exports', label: 'Exports', icon: '\uD83D\uDCE5', path: '/exports', color: 'linear-gradient(135deg, #fd79a8, #e84393)' },
      { id: 'settings', label: 'Settings', icon: '\u2699\uFE0F', path: '/settings', color: 'linear-gradient(135deg, #718096, #4a5568)' }
    ];
  }


  // ═══════════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════════
  function init() {
    captureAppGrid();

    // Lock screen disabled — user prefers direct access
    // (lock screen functions remain but are not called)

    // Setup gestures
    setupGestures();
    setupScrollAwareNav();

    // Watch for home screen creation by mobile-v2.js
    var observer = new MutationObserver(function () {
      var hs = document.getElementById('wl-home-screen');
      if (hs && !hs.dataset.ios26Enhanced) {
        enhanceHomeScreen();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // If home screen already exists
    var hs = document.getElementById('wl-home-screen');
    if (hs) enhanceHomeScreen();

    // Route monitoring
    setInterval(function () {
      var path = window.location.pathname;
      if (path !== _lastPath) {
        _lastPath = path;
        onRouteChange();
      }
    }, 200);

    window.addEventListener('popstate', function () {
      setTimeout(onRouteChange, 50);
    });

    // Handle initial state — if not on dashboard, we're in an app
    if (!isDashboardPage() && !isLoginPage()) {
      _isInApp = true;
      document.body.classList.add('ios-in-app');
      _lockScreenDismissed = true; // Skip lock screen if deep-linked
      var ls = document.getElementById('ios-lock-screen');
      if (ls) ls.remove();
    }
  }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
