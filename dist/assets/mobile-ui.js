/**
 * Mobile UI Addon — WL101 Portal (iOS 26 Liquid Glass)
 *
 * Features:
 *   1. Login screen — hide dock, clean lockscreen layout
 *   2. Home screen — iOS app grid + swipeable dock
 *   3. In-app navigation — swipe-up to home + home indicator
 *   4. Dashboard widget enhancement
 *   5. Floating tab bar (in-app pages)
 *   6. Control Center (swipe-down from top)
 *   7. Simplified top bar (username + role only)
 *   8. Pull-to-refresh, swipe-to-dismiss, table-to-card
 */
(function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────
  var isMobile = window.innerWidth <= 768;
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var _userSession = null;
  var _sessionPromise = null;
  var _homeScreenBuilt = false;
  var _controlCenterBuilt = false;
  var _lastPath = window.location.pathname;

  // ─── Icon Mapping (emoji id → window.__ICONS__ key) ─────
  var ICON_MAP = {
    'dashboard': 'home', 'students': 'students', 'users': 'users',
    'groups': 'groups', 'attendance': 'attendance', 'reports': 'reports',
    'analytics': 'analytics', 'checkpoints': 'checkpoints', 'audit': 'audit',
    'import': 'batch', 'tech-support': 'techSupport', 'exports': 'exports',
    'settings': 'settings'
  };

  function getIconSVG(appId, fallbackEmoji) {
    var icons = window.__ICONS__;
    if (icons && ICON_MAP[appId] && icons[ICON_MAP[appId]]) {
      return icons[ICON_MAP[appId]];
    }
    return fallbackEmoji || '';
  }

  // ─── App Grid Definition ────────────────────────────────
  var APP_GRID = [
    { id: 'dashboard', label: 'Home', icon: '\uD83C\uDFE0', path: '/dashboard', color: 'linear-gradient(135deg, #FF9966, #FF5E62)', roles: null },
    { id: 'students', label: 'Students', icon: '\uD83C\uDF93', path: '/students', color: 'linear-gradient(135deg, #56CCF2, #2F80ED)', roles: ['Admin','LeadershipTeam','Pastor','Coordinator','TechSupport'] },
    { id: 'users', label: 'Users', icon: '\uD83D\uDC65', path: '/admin', color: 'linear-gradient(135deg, #11998e, #38ef7d)', roles: ['Admin','TechSupport'] },
    { id: 'groups', label: 'Groups', icon: '\uD83C\uDFD8\uFE0F', path: '/groups', color: 'linear-gradient(135deg, #667eea, #764ba2)', roles: ['Admin','LeadershipTeam','Pastor','Coordinator','Facilitator','CoFacilitator','TechSupport'] },
    { id: 'attendance', label: 'Attendance', icon: '\uD83D\uDCC5', path: '/attendance', color: 'linear-gradient(135deg, #f6d365, #fda085)', roles: ['Admin','LeadershipTeam','Pastor','Coordinator','Facilitator','CoFacilitator','TechSupport'] },
    { id: 'reports', label: 'Reports', icon: '\uD83D\uDCDD', path: '/weekly-reports', color: 'linear-gradient(135deg, #00b09b, #96c93d)', roles: ['Admin','LeadershipTeam','Pastor','Coordinator','Facilitator','CoFacilitator','TechSupport'] },
    { id: 'analytics', label: 'Analytics', icon: '\uD83D\uDCCA', path: '/reports', color: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', roles: ['Admin','LeadershipTeam','Pastor'] },
    { id: 'checkpoints', label: 'Checkpoints', icon: '\uD83C\uDFAF', path: '/checkpoints', color: 'linear-gradient(135deg, #e17055, #d63031)', roles: ['Admin','LeadershipTeam','Pastor','Coordinator','Facilitator','CoFacilitator','TechSupport'] },
    { id: 'audit', label: 'Audit', icon: '\uD83D\uDEE1\uFE0F', path: '/audit', color: 'linear-gradient(135deg, #F2994A, #F2C94C)', roles: ['Admin','LeadershipTeam'] },
    { id: 'import', label: 'Batch Tool', icon: '\uD83D\uDCE6', path: '/import', color: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', roles: ['Admin','Coordinator'] },
    { id: 'tech-support', label: 'Tech Support', icon: '\uD83D\uDD27', path: '/tech-support', color: 'linear-gradient(135deg, #0984e3, #6c5ce7)', roles: ['Admin','TechSupport'] },
    { id: 'exports', label: 'Exports', icon: '\uD83D\uDCE5', path: '/exports', color: 'linear-gradient(135deg, #fd79a8, #e84393)', roles: ['Admin','LeadershipTeam','Pastor','Coordinator','Facilitator','CoFacilitator','TechSupport'] },
    { id: 'settings', label: 'Settings', icon: '\u2699\uFE0F', path: '/settings', color: 'linear-gradient(135deg, #718096, #4a5568)', roles: ['Admin'] }
  ];

  // ─── Utility Functions ──────────────────────────────────
  function isLoginPage() {
    return window.location.pathname === '/login';
  }

  function isDashboardPage() {
    var p = window.location.pathname;
    return p === '/dashboard' || p === '/' || p === '';
  }

  function navigateTo(path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function fetchUserSession() {
    if (_userSession) return Promise.resolve(_userSession);
    if (_sessionPromise) return _sessionPromise;
    _sessionPromise = fetch('/api/auth/session', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _userSession = data.user || data;
        return _userSession;
      })
      .catch(function () { return null; });
    return _sessionPromise;
  }

  function filterAppsByRole(apps, userRole) {
    if (!userRole) return apps;
    return apps.filter(function (app) {
      if (!app.roles) return true;
      return app.roles.indexOf(userRole) !== -1;
    });
  }


  // ─── 1. CSS INJECTION ──────────────────────────────────
  function injectCSS() {
    var existing = document.getElementById('lg-mobile-css');
    if (existing) {
      // Re-append to end so it always wins over inline <style> tags
      existing.parentNode.removeChild(existing);
      document.head.appendChild(existing);
      return;
    }
    var link = document.createElement('link');
    link.id = 'lg-mobile-css';
    link.rel = 'stylesheet';
    link.href = '/assets/mobile-ui.css';
    document.head.appendChild(link);

    // Ensure our CSS always loads LAST — re-append after React mounts inline styles
    setTimeout(function () {
      var el = document.getElementById('lg-mobile-css');
      if (el && el.nextSibling) {
        el.parentNode.removeChild(el);
        document.head.appendChild(el);
      }
    }, 500);
    setTimeout(function () {
      var el = document.getElementById('lg-mobile-css');
      if (el && el.nextSibling) {
        el.parentNode.removeChild(el);
        document.head.appendChild(el);
      }
    }, 2000);
  }


  // ─── 2. LOGIN STATE ────────────────────────────────────
  function updateLoginState() {
    if (!isMobile) return;
    var onLogin = isLoginPage();
    document.body.classList.toggle('lg-login-active', onLogin);

    var bar = document.getElementById('lg-tab-bar');
    if (bar) bar.style.display = onLogin ? 'none' : '';

    var indicator = document.getElementById('lg-home-indicator');
    if (indicator) indicator.style.display = onLogin ? 'none' : '';

    // Hide / restore entire top menubar on login screen
    var menubar = document.querySelector('.tahoe-menubar');
    if (menubar) menubar.style.display = onLogin ? 'none' : '';
  }


  // ─── 3. HOME SCREEN APP GRID ──────────────────────────
  function createHomeScreenGrid() {
    if (!isMobile || !isDashboardPage()) return;
    if (document.getElementById('lg-home-screen')) return;

    fetchUserSession().then(function (user) {
      if (!user || !isDashboardPage()) return;
      var apps = filterAppsByRole(APP_GRID, user.role);

      var overlay = document.createElement('div');
      overlay.id = 'lg-home-screen';
      overlay.className = 'lg-home-screen';

      // Time display at top
      var timeSection = document.createElement('div');
      timeSection.className = 'lg-home-time';
      var now = new Date();
      timeSection.innerHTML =
        '<div class="lg-home-clock">' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>' +
        '<div class="lg-home-date">' + now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) + '</div>';
      overlay.appendChild(timeSection);

      // Update clock every 30s
      setInterval(function () {
        var el = overlay.querySelector('.lg-home-clock');
        if (el) el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }, 30000);

      // App grid
      var grid = document.createElement('div');
      grid.className = 'lg-app-grid';

      apps.forEach(function (app) {
        var icon = document.createElement('div');
        icon.className = 'lg-app-icon';
        icon.dataset.path = app.path;

        var img = document.createElement('div');
        img.className = 'lg-app-icon-img';
        img.style.background = app.color;
        var svgContent = getIconSVG(app.id, app.icon);
        if (svgContent.indexOf('<svg') !== -1) {
          img.innerHTML = svgContent;
          img.style.cssText += ';color:white;display:flex;align-items:center;justify-content:center';
          var svgEl = img.querySelector('svg');
          if (svgEl) { svgEl.style.width = '28px'; svgEl.style.height = '28px'; }
        } else {
          img.textContent = svgContent;
        }

        var label = document.createElement('span');
        label.className = 'lg-app-icon-label';
        label.textContent = app.label;

        icon.appendChild(img);
        icon.appendChild(label);

        icon.addEventListener('click', function (e) {
          e.preventDefault();
          // Animate the icon
          img.style.transform = 'scale(0.85)';
          setTimeout(function () { img.style.transform = ''; }, 150);
          setTimeout(function () { navigateTo(app.path); }, 100);
        });

        grid.appendChild(icon);
      });

      overlay.appendChild(grid);

      // Greeting
      var greeting = document.createElement('div');
      greeting.className = 'lg-home-greeting';
      var hour = now.getHours();
      var greetText = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
      greeting.textContent = greetText + ', ' + (user.name || user.username || '');
      overlay.appendChild(greeting);

      // Dock — horizontally scrollable app icons (no labels)
      var dock = document.createElement('div');
      dock.className = 'lg-home-dock';
      var dockScroll = document.createElement('div');
      dockScroll.className = 'lg-home-dock-scroll';

      apps.forEach(function (app) {
        var dockIcon = document.createElement('div');
        dockIcon.className = 'lg-home-dock-icon';
        dockIcon.style.background = app.color;
        var dockSvg = getIconSVG(app.id, app.icon);
        if (dockSvg.indexOf('<svg') !== -1) {
          dockIcon.innerHTML = dockSvg;
          dockIcon.style.cssText += ';color:white;display:flex;align-items:center;justify-content:center';
          var dSvgEl = dockIcon.querySelector('svg');
          if (dSvgEl) { dSvgEl.style.width = '22px'; dSvgEl.style.height = '22px'; }
        } else {
          dockIcon.textContent = dockSvg;
        }
        dockIcon.setAttribute('aria-label', app.label);
        dockIcon.setAttribute('title', app.label);

        dockIcon.addEventListener('click', function (e) {
          e.preventDefault();
          dockIcon.style.transform = 'scale(0.82)';
          setTimeout(function () { dockIcon.style.transform = ''; }, 150);
          setTimeout(function () { navigateTo(app.path); }, 100);
        });

        dockScroll.appendChild(dockIcon);
      });

      dock.appendChild(dockScroll);
      overlay.appendChild(dock);

      // Insert as fixed overlay — append to body so it covers everything
      document.body.appendChild(overlay);

      _homeScreenBuilt = true;
    });
  }

  function showHomeScreen() {
    if (!isMobile) return;

    // Hide the in-app tab bar — home screen has its own dock
    var bar = document.getElementById('lg-tab-bar');
    if (bar) bar.style.display = 'none';

    var hs = document.getElementById('lg-home-screen');
    if (hs) {
      hs.style.display = '';
      document.body.classList.add('lg-home-active');
    } else {
      createHomeScreenGrid();
      document.body.classList.add('lg-home-active');
    }
  }

  function hideHomeScreen() {
    var hs = document.getElementById('lg-home-screen');
    if (hs) hs.style.display = 'none';
    document.body.classList.remove('lg-home-active');

    // Restore in-app tab bar (unless on login)
    if (!isLoginPage()) {
      var bar = document.getElementById('lg-tab-bar');
      if (bar) bar.style.display = '';
    }
  }


  // ─── 4. SWIPEABLE DOCK (bottom bar on home) ───────────
  var DOCK_TABS = [
    { id: 'home', label: 'Home', path: '/dashboard', alsoMatch: ['/'],
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>' },
    { id: 'groups', label: 'Groups', path: '/groups',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>' },
    { id: 'reports', label: 'Reports', path: '/weekly-reports',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>' },
    { id: 'attendance', label: 'Attendance', path: '/attendance',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"/>' },
    { id: 'more', label: 'More', path: '/settings',
      alsoMatch: ['/audit', '/import', '/exports', '/checkpoints', '/tech-support', '/students', '/admin', '/reports'],
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"/>' }
  ];

  function makeSVG(pathContent) {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">' + pathContent + '</svg>';
  }

  function isPathActive(tab) {
    var current = window.location.pathname;
    if (tab.path === '/dashboard' && (current === '/' || current === '' || current === '/dashboard')) return true;
    if (current === tab.path) return true;
    if (current.startsWith(tab.path + '/')) return true;
    if (tab.alsoMatch) {
      for (var i = 0; i < tab.alsoMatch.length; i++) {
        if (current === tab.alsoMatch[i] || current.startsWith(tab.alsoMatch[i] + '/')) return true;
      }
    }
    return false;
  }

  function createTabBar() {
    if (!isMobile) return;
    if (document.getElementById('lg-tab-bar')) return;

    var bar = document.createElement('nav');
    bar.id = 'lg-tab-bar';
    bar.setAttribute('role', 'tablist');

    DOCK_TABS.forEach(function (tab) {
      var btn = document.createElement('button');
      btn.className = 'lg-tab' + (isPathActive(tab) ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', tab.label);
      btn.dataset.path = tab.path;
      btn.dataset.id = tab.id;

      btn.innerHTML = makeSVG(tab.icon) +
        '<span class="lg-tab-label">' + tab.label + '</span>';

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        navigateTo(tab.path);
        updateActiveTab();
      });

      bar.appendChild(btn);
    });

    document.body.appendChild(bar);
  }

  function updateActiveTab() {
    var bar = document.getElementById('lg-tab-bar');
    if (!bar) return;

    bar.querySelectorAll('.lg-tab').forEach(function (btn) {
      var tab = DOCK_TABS.find(function (t) { return t.id === btn.dataset.id; });
      if (tab) btn.classList.toggle('active', isPathActive(tab));
    });
  }

  function removeTabBar() {
    var bar = document.getElementById('lg-tab-bar');
    if (bar) bar.remove();
  }


  // ─── 5. HOME INDICATOR BAR ─────────────────────────────
  function createHomeIndicator() {
    if (!isMobile) return;
    if (document.getElementById('lg-home-indicator')) return;

    var bar = document.createElement('div');
    bar.id = 'lg-home-indicator';
    bar.className = 'lg-home-indicator';
    document.body.appendChild(bar);
  }


  // ─── 6. SWIPE-UP TO HOME ──────────────────────────────
  function setupSwipeUpToHome() {
    if (!isTouch || !isMobile) return;

    var startY = 0;
    var startX = 0;
    var tracking = false;

    document.addEventListener('touchstart', function (e) {
      if (isLoginPage()) return;
      if (e.target.closest('.modal-overlay')) return;
      if (e.target.closest('#lg-control-center')) return;

      var y = e.touches[0].clientY;
      // Only activate from bottom 40px zone
      if (y > window.innerHeight - 40) {
        startY = y;
        startX = e.touches[0].clientX;
        tracking = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      var deltaY = startY - e.touches[0].clientY;
      var indicator = document.getElementById('lg-home-indicator');
      if (indicator && deltaY > 20) {
        indicator.classList.add('lg-home-indicator-active');
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;

      var indicator = document.getElementById('lg-home-indicator');
      if (indicator) indicator.classList.remove('lg-home-indicator-active');

      var endY = e.changedTouches[0].clientY;
      var deltaY = startY - endY;
      var deltaX = Math.abs(e.changedTouches[0].clientX - startX);

      // Must be primarily vertical and > 100px upward
      if (deltaY > 100 && deltaY > deltaX * 1.5) {
        if (!isDashboardPage()) {
          navigateTo('/dashboard');
        }
      }
    }, { passive: true });
  }


  // ─── 7. PULL-TO-REFRESH ────────────────────────────────
  function setupPullToRefresh() {
    if (!isTouch || !isMobile) return;

    var indicator = document.createElement('div');
    indicator.className = 'lg-ptr-indicator';
    indicator.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>';
    document.body.appendChild(indicator);

    var startY = 0;
    var pulling = false;

    document.addEventListener('touchstart', function (e) {
      // Don't trigger pull-to-refresh in the top 40px (that's Control Center zone)
      if (e.touches[0].clientY < 40) return;
      if (window.scrollY === 0 && !document.querySelector('.modal-overlay[style*="display"]')) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!pulling) return;
      var diff = e.touches[0].clientY - startY;
      if (diff > 80 && window.scrollY === 0) {
        indicator.classList.add('visible');
      }
    }, { passive: true });

    document.addEventListener('touchend', function () {
      if (indicator.classList.contains('visible')) {
        indicator.classList.add('refreshing');
        setTimeout(function () { window.location.reload(); }, 600);
      }
      pulling = false;
      if (!indicator.classList.contains('refreshing')) {
        indicator.classList.remove('visible');
      }
    }, { passive: true });
  }


  // ─── 8. SWIPE-TO-DISMISS BOTTOM SHEETS ─────────────────
  function setupSwipeDismiss() {
    if (!isTouch) return;

    document.addEventListener('touchstart', function (e) {
      if (!isMobile) return;
      var modal = e.target.closest('.modal-overlay .modal, .modal-overlay .glass-card.modal');
      if (!modal) return;

      var sY = e.touches[0].clientY;
      var modalTop = modal.scrollTop;
      var deltaY = 0;

      function onMove(ev) {
        deltaY = ev.touches[0].clientY - sY;
        if (modalTop <= 0 && deltaY > 0) {
          var dampened = Math.min(deltaY * 0.35, 180);
          modal.style.transform = 'translateY(' + dampened + 'px)';
          modal.style.transition = 'none';
        }
      }

      function onEnd() {
        modal.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
        if (deltaY > 100 && modalTop <= 0) {
          modal.style.transform = 'translateY(100%)';
          modal.style.opacity = '0';
          setTimeout(function () {
            var overlay = modal.closest('.modal-overlay');
            if (overlay) { overlay.style.display = 'none'; overlay.click(); }
            modal.style.transform = '';
            modal.style.opacity = '';
          }, 350);
        } else {
          modal.style.transform = '';
        }
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      }

      document.addEventListener('touchmove', onMove, { passive: true });
      document.addEventListener('touchend', onEnd, { passive: true });
    }, { passive: true });
  }


  // ─── 9. TABLE → CARD CONVERSION ────────────────────────
  function convertTablesToCards() {
    if (!isMobile) return;

    document.querySelectorAll('.table-responsive table').forEach(function (table) {
      if (table.dataset.lgConverted) return;

      var headers = [];
      table.querySelectorAll('thead th').forEach(function (th) {
        headers.push(th.textContent.trim());
      });
      if (headers.length === 0) return;

      var cardContainer = document.createElement('div');
      cardContainer.className = 'lg-table-cards';

      table.querySelectorAll('tbody tr').forEach(function (row) {
        var card = document.createElement('div');
        card.className = 'lg-table-card';

        row.querySelectorAll('td').forEach(function (td, i) {
          var field = document.createElement('div');
          field.className = 'lg-table-field';

          var lbl = document.createElement('span');
          lbl.className = 'lg-field-label';
          lbl.textContent = headers[i] || '';

          var val = document.createElement('span');
          val.className = 'lg-field-value';
          val.innerHTML = td.innerHTML;

          field.appendChild(lbl);
          field.appendChild(val);
          card.appendChild(field);
        });

        if (row.onclick || row.style.cursor === 'pointer') {
          card.style.cursor = 'pointer';
          card.onclick = row.onclick;
        }

        cardContainer.appendChild(card);
      });

      table.style.display = 'none';
      table.parentNode.insertBefore(cardContainer, table.nextSibling);
      table.dataset.lgConverted = 'true';
    });
  }


  // ─── 10. DASHBOARD WIDGET ENHANCEMENT ──────────────────
  function enhanceDashboardWidgets() {
    if (!isMobile) return;

    document.querySelectorAll('.stat-card, .chart-card').forEach(function (el) {
      if (!el.dataset.lgWidget) {
        el.dataset.lgWidget = 'true';
        el.classList.add('lg-widget');
      }
    });
  }


  // ─── 11. SIMPLIFIED TOP BAR ────────────────────────────
  function simplifyTopBar() {
    if (!isMobile) return;

    var menubar = document.querySelector('.tahoe-menubar');
    if (!menubar || menubar.dataset.lgSimplified) return;
    menubar.dataset.lgSimplified = 'true';

    // Inject role badge if we have user session
    fetchUserSession().then(function (user) {
      if (!user) return;
      var profile = menubar.querySelector('.user-profile');
      if (!profile) return;
      if (profile.querySelector('.lg-role-badge')) return;

      var badge = document.createElement('span');
      badge.className = 'lg-role-badge';
      badge.textContent = user.role || 'User';
      profile.appendChild(badge);
    });
  }


  // ─── 12. CONTROL CENTER ────────────────────────────────
  function createControlCenter() {
    if (_controlCenterBuilt) return;
    if (document.getElementById('lg-control-center')) return;

    var cc = document.createElement('div');
    cc.id = 'lg-control-center';
    cc.className = 'lg-control-center';

    cc.innerHTML =
      '<div class="lg-cc-backdrop"></div>' +
      '<div class="lg-cc-panel">' +
        '<div class="lg-cc-handle"></div>' +

        // Time
        '<div class="lg-cc-time">' +
          '<div class="lg-cc-clock">' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>' +
          '<div class="lg-cc-date">' + new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) + '</div>' +
        '</div>' +

        // User info
        '<div class="lg-cc-user-row">' +
          '<div class="lg-cc-avatar"></div>' +
          '<div class="lg-cc-user-info">' +
            '<div class="lg-cc-user-name">Loading...</div>' +
            '<div class="lg-cc-user-role">--</div>' +
          '</div>' +
        '</div>' +

        // Toggle grid
        '<div class="lg-cc-toggles">' +
          '<div class="lg-cc-toggle" data-toggle="darkmode">' +
            '<div class="lg-cc-toggle-icon">\uD83C\uDF19</div>' +
            '<div class="lg-cc-toggle-label">Dark Mode</div>' +
          '</div>' +
          '<div class="lg-cc-toggle" data-toggle="notifications">' +
            '<div class="lg-cc-toggle-icon">\uD83D\uDD14</div>' +
            '<div class="lg-cc-toggle-label">Notifications</div>' +
          '</div>' +
          '<div class="lg-cc-toggle" data-toggle="refresh">' +
            '<div class="lg-cc-toggle-icon">\uD83D\uDD04</div>' +
            '<div class="lg-cc-toggle-label">Refresh</div>' +
          '</div>' +
          '<div class="lg-cc-toggle" data-toggle="fullscreen">' +
            '<div class="lg-cc-toggle-icon">\uD83D\uDCF1</div>' +
            '<div class="lg-cc-toggle-label">Fullscreen</div>' +
          '</div>' +
        '</div>' +

        // Quick links
        '<div class="lg-cc-quick-links">' +
          '<button class="lg-cc-link" data-action="settings">\u2699\uFE0F Settings</button>' +
          '<button class="lg-cc-link lg-cc-link-danger" data-action="logout">\uD83D\uDEAA Logout</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(cc);
    _controlCenterBuilt = true;

    // Populate user info
    fetchUserSession().then(function (user) {
      if (!user) return;
      var nameEl = cc.querySelector('.lg-cc-user-name');
      var roleEl = cc.querySelector('.lg-cc-user-role');
      var avatarEl = cc.querySelector('.lg-cc-avatar');
      if (nameEl) nameEl.textContent = user.name || user.username || 'User';
      if (roleEl) roleEl.textContent = user.role || 'User';
      if (avatarEl) {
        if (user.profile_image) {
          avatarEl.innerHTML = '<img src="' + user.profile_image + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
        } else {
          avatarEl.textContent = (user.name || user.username || 'U').charAt(0).toUpperCase();
        }
      }
    });

    // Update clock
    setInterval(function () {
      var clockEl = cc.querySelector('.lg-cc-clock');
      if (clockEl) clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 30000);

    // Event handlers
    cc.querySelector('.lg-cc-backdrop').addEventListener('click', hideControlCenter);

    cc.querySelectorAll('.lg-cc-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var action = this.dataset.toggle;
        if (action === 'darkmode') {
          this.classList.toggle('active');
          // Toggle theme if the app supports it
          document.documentElement.classList.toggle('light-theme');
        } else if (action === 'notifications') {
          this.classList.toggle('active');
        } else if (action === 'refresh') {
          hideControlCenter();
          setTimeout(function () { window.location.reload(); }, 300);
        } else if (action === 'fullscreen') {
          this.classList.toggle('active');
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen().catch(function () {});
          }
        }
        if (navigator.vibrate) navigator.vibrate(10);
      });
    });

    cc.querySelectorAll('.lg-cc-link').forEach(function (link) {
      link.addEventListener('click', function () {
        var action = this.dataset.action;
        hideControlCenter();
        if (action === 'settings') {
          setTimeout(function () { navigateTo('/settings'); }, 300);
        } else if (action === 'logout') {
          fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .then(function () { window.location.href = '/login'; })
            .catch(function () { window.location.href = '/login'; });
        }
      });
    });
  }

  function showControlCenter() {
    createControlCenter();
    var cc = document.getElementById('lg-control-center');
    if (cc) {
      cc.classList.add('lg-cc-visible');
      document.body.style.overflow = 'hidden';
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }

  function hideControlCenter() {
    var cc = document.getElementById('lg-control-center');
    if (cc) {
      cc.classList.remove('lg-cc-visible');
      document.body.style.overflow = '';
    }
  }


  // ─── 13. SWIPE-DOWN FOR CONTROL CENTER ─────────────────
  function setupSwipeDownControlCenter() {
    if (!isTouch || !isMobile) return;

    var startY = 0;
    var tracking = false;

    document.addEventListener('touchstart', function (e) {
      if (isLoginPage()) return;
      if (e.target.closest('#lg-control-center')) return;
      if (e.target.closest('.modal-overlay')) return;

      var y = e.touches[0].clientY;
      // Only activate from top 40px zone
      if (y < 40) {
        startY = y;
        tracking = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      var delta = e.touches[0].clientY - startY;
      if (delta > 30) {
        // Show preview of CC sliding in
        var cc = document.getElementById('lg-control-center');
        if (!cc) {
          createControlCenter();
          cc = document.getElementById('lg-control-center');
        }
        if (cc) {
          var panel = cc.querySelector('.lg-cc-panel');
          if (panel) {
            var progress = Math.min(delta / 150, 1);
            panel.style.transition = 'none';
            panel.style.transform = 'translateY(' + (-100 + progress * 100) + '%)';
            cc.style.visibility = 'visible';
            cc.querySelector('.lg-cc-backdrop').style.opacity = String(progress * 0.6);
          }
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;

      var endY = e.changedTouches[0].clientY;
      var delta = endY - startY;

      var cc = document.getElementById('lg-control-center');
      if (cc) {
        var panel = cc.querySelector('.lg-cc-panel');
        if (panel) {
          panel.style.transition = '';
          panel.style.transform = '';
        }
        cc.style.visibility = '';
        cc.querySelector('.lg-cc-backdrop').style.opacity = '';
      }

      if (delta > 60) {
        showControlCenter();
      }
    }, { passive: true });

    // Also allow swipe-up inside CC to dismiss
    document.addEventListener('touchstart', function (e) {
      var cc = document.getElementById('lg-control-center');
      if (!cc || !cc.classList.contains('lg-cc-visible')) return;
      var panel = cc.querySelector('.lg-cc-panel');
      if (!panel || !panel.contains(e.target)) return;

      var sY = e.touches[0].clientY;

      function onMove(ev) {
        var d = sY - ev.touches[0].clientY;
        if (d > 80) {
          hideControlCenter();
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onEnd);
        }
      }
      function onEnd() {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      }
      document.addEventListener('touchmove', onMove, { passive: true });
      document.addEventListener('touchend', onEnd, { passive: true });
    }, { passive: true });
  }


  // ─── 14. VIEWPORT META ─────────────────────────────────
  function ensureViewportMeta() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.content.includes('viewport-fit')) {
      meta.content += ', viewport-fit=cover';
    }
  }


  // ─── 15. RESIZE HANDLER ────────────────────────────────
  function handleResize() {
    var wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;

    if (isMobile && !wasMobile) {
      createTabBar();
      createHomeIndicator();
    } else if (!isMobile && wasMobile) {
      removeTabBar();
      var indicator = document.getElementById('lg-home-indicator');
      if (indicator) indicator.remove();
      var hs = document.getElementById('lg-home-screen');
      if (hs) hs.remove();
      _homeScreenBuilt = false;
    }
  }


  // ─── 16. iOS NAVIGATION HEADER (per-page) ──────────────
  var PAGE_TITLES = {
    '/dashboard': 'Home',
    '/students': 'Students',
    '/groups': 'Groups',
    '/attendance': 'Attendance',
    '/weekly-reports': 'Reports',
    '/reports': 'Analytics',
    '/checkpoints': 'Checkpoints',
    '/admin': 'Users',
    '/audit': 'Audit Log',
    '/import': 'Batch Tool',
    '/exports': 'Exports',
    '/tech-support': 'Tech Support',
    '/settings': 'Settings'
  };

  function getPageTitle() {
    var path = window.location.pathname;
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];

    // Group detail: /groups/123
    if (path.match(/^\/groups\/\d+/)) return 'Group Detail';
    // Student detail
    if (path.match(/^\/students\//)) return 'Student';

    return 'WL101';
  }

  function createOrUpdateIOSNav() {
    if (!isMobile) return;
    if (isLoginPage() || isDashboardPage()) {
      var existingNav = document.getElementById('lg-ios-nav');
      if (existingNav) existingNav.style.display = 'none';
      return;
    }

    var nav = document.getElementById('lg-ios-nav');
    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'lg-ios-nav';

      // Back button
      var back = document.createElement('button');
      back.className = 'lg-nav-back';
      back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
      back.addEventListener('click', function () {
        if (navigator.vibrate) navigator.vibrate(10);
        // Go back in history, or dashboard if no history
        if (window.history.length > 1) {
          window.history.back();
        } else {
          navigateTo('/dashboard');
        }
      });

      // Title
      var title = document.createElement('span');
      title.className = 'lg-nav-title';
      title.textContent = getPageTitle();

      // Right side — user avatar
      var right = document.createElement('div');
      right.className = 'lg-nav-right';

      var userBtn = document.createElement('div');
      userBtn.className = 'lg-nav-user';

      var avatar = document.createElement('div');
      avatar.className = 'lg-nav-user-avatar';
      avatar.textContent = '?';

      fetchUserSession().then(function (user) {
        if (!user) return;
        if (user.profile_image) {
          avatar.innerHTML = '<img src="' + user.profile_image + '" alt="" />';
        } else {
          avatar.textContent = (user.name || user.username || 'U').charAt(0).toUpperCase();
        }
        // Add role badge
        var badge = document.createElement('span');
        badge.className = 'lg-role-badge';
        badge.textContent = user.role || '';
        right.appendChild(badge);
      });

      userBtn.appendChild(avatar);
      userBtn.addEventListener('click', function () {
        showControlCenter();
      });
      right.appendChild(userBtn);

      nav.appendChild(back);
      nav.appendChild(title);
      nav.appendChild(right);

      // Insert at top of body, before other content
      document.body.insertBefore(nav, document.body.firstChild);
    } else {
      nav.style.display = '';
      var titleEl = nav.querySelector('.lg-nav-title');
      if (titleEl) titleEl.textContent = getPageTitle();
    }
  }


  // ─── 17. PAGE-SPECIFIC iOS ENHANCEMENTS ────────────────
  function enhancePageSpecific() {
    if (!isMobile) return;

    var path = window.location.pathname;

    // Add iOS large title for top-level pages
    addLargeTitle();

    // Add iOS grouped sections wrapper to card grids
    wrapGridsInSections();
  }

  function addLargeTitle() {
    // Only add large titles to top-level pages (not detail views)
    var path = window.location.pathname;
    var isTopLevel = PAGE_TITLES[path] && !isDashboardPage() && !isLoginPage();

    // Always remove stale large titles from other pages (including when on dashboard/login)
    document.querySelectorAll('.lg-ios-large-title').forEach(function (el) {
      if (el.dataset.path !== path) el.remove();
    });

    if (!isTopLevel) return;

    // Check if already added
    if (document.querySelector('.lg-ios-large-title[data-path="' + path + '"]')) return;

    var title = document.createElement('h1');
    title.className = 'lg-ios-large-title';
    title.dataset.path = path;
    title.textContent = getPageTitle();

    // Insert after the iOS nav bar
    var nav = document.getElementById('lg-ios-nav');
    var pageContainer = document.querySelector('.page-container') ||
                        document.querySelector('.tahoe-page') ||
                        document.querySelector('[style*="flex-direction: column"]');

    if (pageContainer && !pageContainer.querySelector('.lg-ios-large-title')) {
      pageContainer.insertBefore(title, pageContainer.firstChild);
    } else if (nav && nav.nextSibling) {
      nav.parentNode.insertBefore(title, nav.nextSibling);
    }
  }

  function wrapGridsInSections() {
    // Find grids that aren't yet wrapped
    var grids = document.querySelectorAll('.admin-grid:not(.lg-sectioned), .groups-grid:not(.lg-sectioned)');
    grids.forEach(function (grid) {
      grid.classList.add('lg-sectioned');
    });
  }


  // ─── ROUTE CHANGE HANDLER ─────────────────────────────
  function onRouteChange() {
    updateLoginState();
    updateActiveTab();
    createOrUpdateIOSNav();

    // Always hide home screen when navigating — dashboard shows actual content
    hideHomeScreen();

    simplifyTopBar();
    enhance();
  }


  // ─── CHART DRILL-DOWN INTERACTIVITY ─────────────────────
  var _chartStudentsCache = null;
  var _chartEnhanced = new WeakSet();

  function fetchStudentsForCharts() {
    if (_chartStudentsCache) return Promise.resolve(_chartStudentsCache);
    return fetch('/api/data/students', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.success && d.students) {
          _chartStudentsCache = d.students;
          // Invalidate after 60s
          setTimeout(function () { _chartStudentsCache = null; }, 60000);
        }
        return _chartStudentsCache || [];
      })
      .catch(function () { return []; });
  }

  function showStudentDrillDown(title, students) {
    // Remove existing
    var existing = document.getElementById('lg-chart-drilldown');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'lg-chart-drilldown';
    overlay.className = 'lg-drilldown-overlay';

    var sheet = document.createElement('div');
    sheet.className = 'lg-drilldown-sheet';

    // Header
    var header = document.createElement('div');
    header.className = 'lg-drilldown-header';
    header.innerHTML = '<div class="lg-drilldown-handle"></div>' +
      '<h3 class="lg-drilldown-title">' + title + '</h3>' +
      '<span class="lg-drilldown-count">' + students.length + ' student' + (students.length !== 1 ? 's' : '') + '</span>' +
      '<button class="lg-drilldown-close">\u00D7</button>';

    // Student list
    var list = document.createElement('div');
    list.className = 'lg-drilldown-list';

    students.slice(0, 200).forEach(function (s) {
      var row = document.createElement('div');
      row.className = 'lg-drilldown-row';

      var riskColor = '#34c759';
      var riskLabel = 'Healthy';
      if (s.risk && s.risk.category === 'Critical') { riskColor = '#ff3b30'; riskLabel = 'Critical'; }
      else if (s.risk && s.risk.category === 'Attention') { riskColor = '#ff9500'; riskLabel = 'Attention'; }

      row.innerHTML =
        '<div class="lg-drilldown-student-info">' +
          '<div class="lg-drilldown-name">' + (s.name || (s.first_name + ' ' + s.last_name)) + '</div>' +
          '<div class="lg-drilldown-meta">' + (s.email || '') + ' \u2022 ' + (s.celebration_point || '') + '</div>' +
        '</div>' +
        '<div class="lg-drilldown-stats">' +
          '<div class="lg-drilldown-progress">' + (s.progress || 0) + '%</div>' +
          '<div class="lg-drilldown-risk" style="color:' + riskColor + '">' + riskLabel + '</div>' +
        '</div>';

      list.appendChild(row);
    });

    if (students.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:rgba(255,255,255,0.4)">No students in this category</div>';
    }

    sheet.appendChild(header);
    sheet.appendChild(list);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(function () {
      overlay.classList.add('lg-drilldown-visible');
    });

    // Close handlers
    function close() {
      overlay.classList.remove('lg-drilldown-visible');
      setTimeout(function () { overlay.remove(); }, 300);
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    header.querySelector('.lg-drilldown-close').addEventListener('click', close);
  }

  function enhanceChartInteractivity() {
    if (!isDashboardPage()) return;

    var canvases = document.querySelectorAll('canvas');
    canvases.forEach(function (canvas) {
      if (_chartEnhanced.has(canvas)) return;

      // Try to get Chart.js instance
      var Chart = window.Chart;
      if (!Chart || !Chart.getChart) return;

      var chart = Chart.getChart(canvas);
      if (!chart) return;

      _chartEnhanced.add(canvas);
      canvas.style.cursor = 'pointer';

      canvas.addEventListener('click', function (evt) {
        var activeChart = Chart.getChart(canvas);
        if (!activeChart) return;
        var elements = activeChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
        if (!elements || elements.length === 0) return;

        var el = elements[0];
        var datasetIndex = el.datasetIndex;
        var index = el.index;
        var label = '';

        // Get chart type and label
        if (activeChart.config && activeChart.config.data && activeChart.config.data.labels) {
          label = activeChart.config.data.labels[index] || '';
        }

        // Determine filter based on chart type
        var filterFn = null;
        var drillTitle = '';

        // Detect which chart this is by its labels/data
        var labels = (activeChart.config.data.labels || []).join(',');

        if (labels.indexOf('0-25%') >= 0 || labels.indexOf('76-100%') >= 0) {
          // Progress Distribution chart
          var ranges = [
            { min: 0, max: 25, label: '0-25%' },
            { min: 26, max: 50, label: '26-50%' },
            { min: 51, max: 75, label: '51-75%' },
            { min: 76, max: 100, label: '76-100%' }
          ];
          var range = ranges[index];
          if (range) {
            drillTitle = 'Progress: ' + range.label;
            filterFn = function (s) {
              return s.progress >= range.min && s.progress <= range.max;
            };
          }
        } else if (labels.indexOf('Completed') >= 0 || labels.indexOf('Not Started') >= 0) {
          // Completion Status chart
          var statuses = ['Completed', 'In Progress', 'Not Started'];
          var statusFilter = statuses[index];
          if (statusFilter) {
            drillTitle = statusFilter + ' Students';
            filterFn = function (s) { return s.status === statusFilter; };
          }
        } else if (activeChart.config.options && activeChart.config.options.indexAxis === 'y') {
          // Course Progress (horizontal bar) — filter by course name
          drillTitle = 'Course: ' + label;
          filterFn = function (s) { return s.course === label; };
        } else {
          // Unknown chart — show label
          drillTitle = label || 'Selected';
          filterFn = null;
        }

        if (filterFn) {
          fetchStudentsForCharts().then(function (students) {
            var filtered = students.filter(filterFn);
            showStudentDrillDown(drillTitle, filtered);
          });
        }
      });
    });
  }


  // ─── ENHANCEMENT LOOP ─────────────────────────────────
  function enhance() {
    convertTablesToCards();
    enhanceDashboardWidgets();
    simplifyTopBar();
    enhancePageSpecific();
    enhanceChartInteractivity();
  }


  // ─── INIT ─────────────────────────────────────────────
  function init() {
    injectCSS();
    ensureViewportMeta();

    // Start fetching user session early
    fetchUserSession();

    if (isMobile) {
      createTabBar();
      createHomeIndicator();
      createOrUpdateIOSNav();
      setupPullToRefresh();
      setupSwipeUpToHome();
      setupSwipeDownControlCenter();

      // Login state
      updateLoginState();

      // Top bar
      simplifyTopBar();
    }

    if (isTouch) {
      setupSwipeDismiss();
    }

    // Observe DOM changes
    var debounceTimer;
    var observer = new MutationObserver(function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(enhance, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Unified route watcher
    setInterval(function () {
      if (window.location.pathname !== _lastPath) {
        _lastPath = window.location.pathname;
        onRouteChange();
      }
    }, 200);

    window.addEventListener('resize', handleResize);
    window.addEventListener('popstate', function () {
      setTimeout(onRouteChange, 50);
    });

    enhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
