/**
 * Mobile UI v2 — WL101 Portal
 *
 * REPLACES: mobile-ui.js
 *
 * Features:
 *   1. Bottom tab bar (native mobile nav, not dock)
 *   2. iOS-style top navigation bar with back button
 *   3. Control Center (pull-down from top)
 *   4. Home screen app grid on dashboard
 *   5. Pull-to-refresh
 *   6. Swipe-to-dismiss bottom sheets
 *   7. Table→card conversion
 *   8. Dashboard widget enhancement
 *   9. Chart drill-down interactivity
 *   10. Swipe-up to home gesture
 */
(function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────
  var isMobile = window.innerWidth <= 768;
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var _userSession = null;
  var _sessionPromise = null;
  var _homeScreenBuilt = false;
  var _homeScreenPending = false;  // synchronous guard against async race
  var _controlCenterBuilt = false;
  var _lastPath = window.location.pathname;

  // ─── Icon Mapping ────────────────────────────────────────
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
    { id: 'dashboard', label: 'Dashboard', icon: '\uD83C\uDFE0', path: '/overview', color: 'linear-gradient(135deg, #FF9966, #FF5E62)', roles: null },
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

  function fetchUserSession() {
    if (_userSession) return Promise.resolve(_userSession);
    if (_sessionPromise) return _sessionPromise;
    _sessionPromise = fetch('/api/auth/session', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) { _userSession = data.user || data; return _userSession; })
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
    var existing = document.getElementById('wl-mobile-css');
    if (existing) {
      existing.parentNode.removeChild(existing);
      document.head.appendChild(existing);
      return;
    }
    var link = document.createElement('link');
    link.id = 'wl-mobile-css';
    link.rel = 'stylesheet';
    link.href = '/assets/mobile-v2.css';
    document.head.appendChild(link);

    // Ensure CSS loads last
    setTimeout(function () {
      var el = document.getElementById('wl-mobile-css');
      if (el && el.nextSibling) {
        el.parentNode.removeChild(el);
        document.head.appendChild(el);
      }
    }, 500);
  }


  // ─── 2. LOGIN STATE ────────────────────────────────────
  function updateLoginState() {
    if (!isMobile) return;
    var onLogin = isLoginPage();
    document.body.classList.toggle('wl-login-active', onLogin);

    var bar = document.getElementById('wl-tab-bar');
    if (bar) bar.style.display = onLogin ? 'none' : '';

    var indicator = document.getElementById('wl-home-indicator');
    if (indicator) indicator.style.display = onLogin ? 'none' : '';

    var menubar = document.querySelector('.tahoe-menubar');
    if (menubar) menubar.style.display = onLogin ? 'none' : '';
  }


  // ─── 3. BOTTOM TAB BAR ────────────────────────────────
  var TAB_ITEMS = [
    { id: 'home', label: 'Home', path: '/dashboard', alsoMatch: ['/'],
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>' },
    { id: 'groups', label: 'Groups', path: '/groups',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>' },
    { id: 'reports', label: 'Reports', path: '/weekly-reports',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>' },
    { id: 'attendance', label: 'Attendance', path: '/attendance',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>' },
    { id: 'more', label: 'More', path: '/settings',
      alsoMatch: ['/audit', '/import', '/exports', '/checkpoints', '/tech-support', '/students', '/admin', '/reports'],
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"/>' }
  ];

  function makeSVG(pathContent) {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:22px;height:22px">' + pathContent + '</svg>';
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
    if (document.getElementById('wl-tab-bar')) return;

    var bar = document.createElement('nav');
    bar.id = 'wl-tab-bar';
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', 'Main navigation');

    TAB_ITEMS.forEach(function (tab) {
      var btn = document.createElement('button');
      btn.className = 'wl-tab' + (isPathActive(tab) ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', tab.label);
      btn.setAttribute('aria-selected', isPathActive(tab) ? 'true' : 'false');
      btn.dataset.path = tab.path;
      btn.dataset.id = tab.id;

      btn.innerHTML = makeSVG(tab.icon) + '<span class="wl-tab-label">' + tab.label + '</span>';

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
    var bar = document.getElementById('wl-tab-bar');
    if (!bar) return;

    bar.querySelectorAll('.wl-tab').forEach(function (btn) {
      var tab = TAB_ITEMS.find(function (t) { return t.id === btn.dataset.id; });
      if (tab) {
        var active = isPathActive(tab);
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      }
    });
  }

  function removeTabBar() {
    var bar = document.getElementById('wl-tab-bar');
    if (bar) bar.remove();
  }


  // ─── 4. HOME INDICATOR ─────────────────────────────────
  function createHomeIndicator() {
    if (!isMobile) return;
    if (document.getElementById('wl-home-indicator')) return;

    var bar = document.createElement('div');
    bar.id = 'wl-home-indicator';
    document.body.appendChild(bar);
  }


  // ─── 5. IOS NAVIGATION HEADER ─────────────────────────
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
    if (path.match(/^\/groups\/\d+/)) return 'Group Detail';
    if (path.match(/^\/students\//)) return 'Student';
    return 'WL101';
  }

  function createOrUpdateIOSNav() {
    if (!isMobile) return;
    if (isLoginPage() || isDashboardPage()) {
      var existingNav = document.getElementById('wl-ios-nav');
      if (existingNav) existingNav.style.display = 'none';
      return;
    }

    var nav = document.getElementById('wl-ios-nav');
    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'wl-ios-nav';
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Page navigation');

      var back = document.createElement('button');
      back.className = 'wl-nav-back';
      back.setAttribute('aria-label', 'Go back');
      back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
      back.addEventListener('click', function () {
        if (navigator.vibrate) navigator.vibrate(10);
        if (window.history.length > 1) window.history.back();
        else navigateTo('/dashboard');
      });

      var title = document.createElement('span');
      title.className = 'wl-nav-title';
      title.textContent = getPageTitle();

      var right = document.createElement('div');
      right.className = 'wl-nav-right';

      var userBtn = document.createElement('div');
      var avatar = document.createElement('div');
      avatar.className = 'wl-nav-user-avatar';
      avatar.textContent = '?';

      fetchUserSession().then(function (user) {
        if (!user) return;
        if (user.profile_image) {
          avatar.innerHTML = '<img src="' + user.profile_image + '" alt="Profile" />';
        } else {
          avatar.textContent = (user.name || user.username || 'U').charAt(0).toUpperCase();
        }
        var badge = document.createElement('span');
        badge.className = 'wl-role-badge';
        badge.textContent = user.role || '';
        right.appendChild(badge);
      });

      userBtn.appendChild(avatar);
      userBtn.style.cursor = 'pointer';
      userBtn.addEventListener('click', function () { showControlCenter(); });
      right.appendChild(userBtn);

      nav.appendChild(back);
      nav.appendChild(title);
      nav.appendChild(right);

      document.body.insertBefore(nav, document.body.firstChild);
    } else {
      nav.style.display = '';
      var titleEl = nav.querySelector('.wl-nav-title');
      if (titleEl) titleEl.textContent = getPageTitle();
    }
  }


  // ─── 6. LARGE TITLE ──────────────────────────────────
  function addLargeTitle() {
    if (!isMobile) return;
    var path = window.location.pathname;
    var isTopLevel = PAGE_TITLES[path] && !isDashboardPage() && !isLoginPage();

    document.querySelectorAll('.wl-large-title').forEach(function (el) {
      if (el.dataset.path !== path) el.remove();
    });

    if (!isTopLevel) return;
    if (document.querySelector('.wl-large-title[data-path="' + path + '"]')) return;

    var title = document.createElement('h1');
    title.className = 'wl-large-title';
    title.dataset.path = path;
    title.textContent = getPageTitle();

    var nav = document.getElementById('wl-ios-nav');
    var pageContainer = document.querySelector('.page-container') ||
                        document.querySelector('.tahoe-page') ||
                        document.querySelector('[style*="flex-direction: column"]');

    if (pageContainer && !pageContainer.querySelector('.wl-large-title')) {
      pageContainer.insertBefore(title, pageContainer.firstChild);
    } else if (nav && nav.nextSibling) {
      nav.parentNode.insertBefore(title, nav.nextSibling);
    }
  }


  // ─── 7. HOME SCREEN APP GRID ──────────────────────────
  function createHomeScreenGrid() {
    if (!isMobile || !isDashboardPage()) return;
    // Belt-and-braces guard: two rapid calls would both pass the DOM check
    // since the overlay is only appended AFTER the async fetchUserSession()
    // resolves. _homeScreenPending is set synchronously so a second caller
    // bails before starting a second fetch → no duplicated launcher.
    if (document.getElementById('wl-home-screen')) return;
    if (_homeScreenPending || _homeScreenBuilt) return;
    _homeScreenPending = true;

    fetchUserSession().then(function (user) {
      // Another call may have already appended an overlay while we were
      // waiting — double-check and bail if so.
      if (document.getElementById('wl-home-screen')) {
        _homeScreenPending = false;
        return;
      }
      if (!user || !isDashboardPage()) {
        _homeScreenPending = false;
        return;
      }
      var apps = filterAppsByRole(APP_GRID, user.role);

      var overlay = document.createElement('div');
      overlay.id = 'wl-home-screen';

      // Time
      var timeSection = document.createElement('div');
      timeSection.className = 'wl-home-time';
      var now = new Date();
      timeSection.innerHTML =
        '<div class="wl-home-clock">' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>' +
        '<div class="wl-home-date">' + now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) + '</div>';
      overlay.appendChild(timeSection);

      setInterval(function () {
        var el = overlay.querySelector('.wl-home-clock');
        if (el) el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        var dateEl = overlay.querySelector('.wl-home-date');
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      }, 30000);

      // Greeting
      var greeting = document.createElement('div');
      greeting.className = 'wl-home-greeting';
      var hour = now.getHours();
      var greetText = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
      greeting.textContent = greetText + ', ' + (user.name || user.username || '');
      overlay.appendChild(greeting);

      // App grid
      var grid = document.createElement('div');
      grid.className = 'wl-app-grid';

      apps.forEach(function (app) {
        var icon = document.createElement('div');
        icon.className = 'wl-app-icon';
        icon.dataset.path = app.path;
        icon.setAttribute('role', 'button');
        icon.setAttribute('aria-label', app.label);

        var img = document.createElement('div');
        img.className = 'wl-app-icon-img';
        img.style.background = app.color;

        var svgContent = getIconSVG(app.id, app.icon);
        if (svgContent.indexOf('<svg') !== -1) {
          img.innerHTML = svgContent;
          img.style.cssText += ';color:white;display:flex;align-items:center;justify-content:center';
          var svgEl = img.querySelector('svg');
          if (svgEl) { svgEl.style.width = '26px'; svgEl.style.height = '26px'; }
        } else {
          img.textContent = svgContent;
        }

        var label = document.createElement('span');
        label.className = 'wl-app-icon-label';
        label.textContent = app.label;

        icon.appendChild(img);
        icon.appendChild(label);

        icon.addEventListener('click', function (e) {
          e.preventDefault();
          navigateTo(app.path);
        });

        grid.appendChild(icon);
      });

      overlay.appendChild(grid);
      document.body.appendChild(overlay);
      _homeScreenBuilt = true;
      _homeScreenPending = false;
    }).catch(function () {
      _homeScreenPending = false;
    });
  }

  function showHomeScreen() {
    if (!isMobile) return;
    // Lift the initial page-hide guard — we're about to show the launcher
    document.documentElement.classList.remove('wl-mobile-pending');

    var bar = document.getElementById('wl-tab-bar');
    if (bar) bar.style.display = 'none';

    // Defensive dedup: if a prior bug left behind multiple launchers,
    // keep the first and remove the rest so the user sees one clean screen.
    var allHs = document.querySelectorAll('#wl-home-screen');
    if (allHs.length > 1) {
      for (var i = 1; i < allHs.length; i++) {
        if (allHs[i].parentNode) allHs[i].parentNode.removeChild(allHs[i]);
      }
    }

    var hs = document.getElementById('wl-home-screen');
    if (hs) {
      hs.style.display = '';
      document.body.classList.add('wl-home-active');
    } else {
      createHomeScreenGrid();
      document.body.classList.add('wl-home-active');
    }
  }

  function hideHomeScreen() {
    var hs = document.getElementById('wl-home-screen');
    if (hs) hs.style.display = 'none';
    document.body.classList.remove('wl-home-active');

    if (!isLoginPage()) {
      var bar = document.getElementById('wl-tab-bar');
      if (bar) bar.style.display = '';
    }
  }


  // ─── 8. CONTROL CENTER ────────────────────────────────
  function createControlCenter() {
    if (_controlCenterBuilt) return;
    if (document.getElementById('wl-control-center')) return;

    var cc = document.createElement('div');
    cc.id = 'wl-control-center';

    cc.innerHTML =
      '<div class="wl-cc-backdrop"></div>' +
      '<div class="wl-cc-panel">' +
        '<div class="wl-cc-handle"></div>' +

        '<div style="text-align:center;margin-bottom:20px">' +
          '<div class="wl-cc-clock">' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>' +
          '<div class="wl-cc-date">' + new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) + '</div>' +
        '</div>' +

        '<div class="wl-cc-user-row">' +
          '<div class="wl-cc-avatar"></div>' +
          '<div style="display:flex;flex-direction:column;gap:2px;min-width:0">' +
            '<div class="wl-cc-user-name">Loading...</div>' +
            '<div class="wl-cc-user-role">--</div>' +
          '</div>' +
        '</div>' +

        '<div class="wl-cc-toggles">' +
          '<div class="wl-cc-toggle" data-toggle="darkmode"><div class="wl-cc-toggle-icon">\uD83C\uDF19</div><div class="wl-cc-toggle-label">Theme</div></div>' +
          '<div class="wl-cc-toggle" data-toggle="notifications"><div class="wl-cc-toggle-icon">\uD83D\uDD14</div><div class="wl-cc-toggle-label">Notify</div></div>' +
          '<div class="wl-cc-toggle" data-toggle="refresh"><div class="wl-cc-toggle-icon">\uD83D\uDD04</div><div class="wl-cc-toggle-label">Refresh</div></div>' +
          '<div class="wl-cc-toggle" data-toggle="fullscreen"><div class="wl-cc-toggle-icon">\uD83D\uDCF1</div><div class="wl-cc-toggle-label">Full</div></div>' +
        '</div>' +

        '<div class="wl-cc-quick-links">' +
          '<button class="wl-cc-link" data-action="settings">\u2699\uFE0F Settings</button>' +
          '<button class="wl-cc-link wl-cc-link-danger" data-action="logout">\uD83D\uDEAA Sign Out</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(cc);
    _controlCenterBuilt = true;

    // Populate user
    fetchUserSession().then(function (user) {
      if (!user) return;
      var nameEl = cc.querySelector('.wl-cc-user-name');
      var roleEl = cc.querySelector('.wl-cc-user-role');
      var avatarEl = cc.querySelector('.wl-cc-avatar');
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

    // Clock
    setInterval(function () {
      var clockEl = cc.querySelector('.wl-cc-clock');
      if (clockEl) clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 30000);

    // Events
    cc.querySelector('.wl-cc-backdrop').addEventListener('click', hideControlCenter);

    cc.querySelectorAll('.wl-cc-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var action = this.dataset.toggle;
        if (action === 'darkmode') {
          this.classList.toggle('active');
          document.documentElement.classList.toggle('light-theme');
        } else if (action === 'notifications') {
          this.classList.toggle('active');
        } else if (action === 'refresh') {
          hideControlCenter();
          setTimeout(function () { window.location.reload(); }, 300);
        } else if (action === 'fullscreen') {
          this.classList.toggle('active');
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen().catch(function () {});
        }
        if (navigator.vibrate) navigator.vibrate(10);
      });
    });

    cc.querySelectorAll('.wl-cc-link').forEach(function (link) {
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
    var cc = document.getElementById('wl-control-center');
    if (cc) {
      cc.classList.add('wl-cc-visible');
      document.body.style.overflow = 'hidden';
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }

  function hideControlCenter() {
    var cc = document.getElementById('wl-control-center');
    if (cc) {
      cc.classList.remove('wl-cc-visible');
      document.body.style.overflow = '';
    }
  }


  // ─── 9. SWIPE-DOWN FOR CONTROL CENTER ─────────────────
  function setupSwipeDownControlCenter() {
    if (!isTouch || !isMobile) return;

    var startY = 0;
    var tracking = false;

    document.addEventListener('touchstart', function (e) {
      if (isLoginPage()) return;
      if (e.target.closest('#wl-control-center')) return;
      if (e.target.closest('.modal-overlay')) return;
      if (e.touches[0].clientY < 40) {
        startY = e.touches[0].clientY;
        tracking = true;
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var delta = e.changedTouches[0].clientY - startY;
      if (delta > 60) showControlCenter();
    }, { passive: true });

    // Swipe-up to dismiss CC
    document.addEventListener('touchstart', function (e) {
      var cc = document.getElementById('wl-control-center');
      if (!cc || !cc.classList.contains('wl-cc-visible')) return;
      var panel = cc.querySelector('.wl-cc-panel');
      if (!panel || !panel.contains(e.target)) return;

      var sY = e.touches[0].clientY;
      function onMove(ev) {
        if (sY - ev.touches[0].clientY > 80) {
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


  // ─── 10. PULL-TO-REFRESH ──────────────────────────────
  function setupPullToRefresh() {
    if (!isTouch || !isMobile) return;

    var indicator = document.createElement('div');
    indicator.className = 'wl-ptr-indicator';
    indicator.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>';
    document.body.appendChild(indicator);

    var startY = 0;
    var pulling = false;

    document.addEventListener('touchstart', function (e) {
      if (e.touches[0].clientY < 40) return;
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!pulling) return;
      if (e.touches[0].clientY - startY > 80 && window.scrollY === 0) {
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


  // ─── 11. SWIPE-TO-DISMISS BOTTOM SHEETS ───────────────
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
          modal.style.transform = 'translateY(' + Math.min(deltaY * 0.35, 180) + 'px)';
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


  // ─── 12. TABLE → CARD CONVERSION ─────────────────────
  function convertTablesToCards() {
    if (!isMobile) return;

    document.querySelectorAll('.table-responsive table').forEach(function (table) {
      if (table.dataset.wlConverted) return;

      var headers = [];
      table.querySelectorAll('thead th').forEach(function (th) {
        headers.push(th.textContent.trim());
      });
      if (headers.length === 0) return;

      var cardContainer = document.createElement('div');
      cardContainer.className = 'wl-table-cards';

      table.querySelectorAll('tbody tr').forEach(function (row) {
        var card = document.createElement('div');
        card.className = 'wl-table-card';

        row.querySelectorAll('td').forEach(function (td, i) {
          var field = document.createElement('div');
          field.className = 'wl-table-field';

          var lbl = document.createElement('span');
          lbl.className = 'wl-field-label';
          lbl.textContent = headers[i] || '';

          var val = document.createElement('span');
          val.className = 'wl-field-value';
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
      table.dataset.wlConverted = 'true';
    });
  }


  // ─── 13. DASHBOARD WIDGET ENHANCEMENT ─────────────────
  function enhanceDashboardWidgets() {
    if (!isMobile) return;

    document.querySelectorAll('.stat-card, .chart-card').forEach(function (el) {
      if (!el.dataset.wlWidget) {
        el.dataset.wlWidget = 'true';
        el.classList.add('wl-widget');
      }
    });
  }


  // ─── 14. SWIPE-UP TO HOME ────────────────────────────
  function setupSwipeUpToHome() {
    if (!isTouch || !isMobile) return;

    var startY = 0;
    var tracking = false;

    document.addEventListener('touchstart', function (e) {
      if (isLoginPage()) return;
      if (e.target.closest('.modal-overlay')) return;
      if (e.target.closest('#wl-control-center')) return;
      if (e.touches[0].clientY > window.innerHeight - 40) {
        startY = e.touches[0].clientY;
        tracking = true;
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var deltaY = startY - e.changedTouches[0].clientY;
      var deltaX = Math.abs(e.changedTouches[0].clientX - startY);
      if (deltaY > 100 && deltaY > deltaX * 1.5) {
        if (!isDashboardPage()) navigateTo('/dashboard');
      }
    }, { passive: true });
  }


  // ─── 15. VIEWPORT META ────────────────────────────────
  function ensureViewportMeta() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.content.includes('viewport-fit')) {
      meta.content += ', viewport-fit=cover';
    }
  }


  // ─── 16. RESIZE HANDLER ───────────────────────────────
  function handleResize() {
    var wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;

    if (isMobile && !wasMobile) {
      createTabBar();
      createHomeIndicator();
    } else if (!isMobile && wasMobile) {
      removeTabBar();
      var indicator = document.getElementById('wl-home-indicator');
      if (indicator) indicator.remove();
      var hs = document.getElementById('wl-home-screen');
      if (hs) hs.remove();
      _homeScreenBuilt = false;
      _homeScreenPending = false;
    }
  }


  // ─── ROUTE CHANGE HANDLER ────────────────────────────
  function onRouteChange() {
    updateLoginState();
    updateActiveTab();
    createOrUpdateIOSNav();

    // Show home screen on dashboard, hide on other pages
    // showHomeScreen() already calls createHomeScreenGrid() if needed — no double call
    if (isDashboardPage() && !isLoginPage()) {
      showHomeScreen();
    } else {
      hideHomeScreen();
    }

    enhance();
  }


  // ─── CHANGE 2: CLOCK VISIBILITY FIX ──────────────────
  // Ensure home screen clock updates reliably and is visible
  function updateHomeScreenClock() {
    var clockEl = document.querySelector('#wl-home-screen .wl-home-clock');
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    var dateEl = document.querySelector('#wl-home-screen .wl-home-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
  }

  // ─── CHANGE 3: PAGE TITLE DEDUPLICATION ─────────────
  // Hide React-rendered page titles when iOS nav is showing
  function hideReactPageTitles() {
    if (!isMobile) return;
    if (isLoginPage() || isDashboardPage()) return;

    var nav = document.getElementById('wl-ios-nav');
    if (!nav || nav.style.display === 'none') return;

    // Look for redundant page titles in the main content
    var containers = document.querySelectorAll('.page-container, .tahoe-page, main, [class*="page-wrapper"]');
    containers.forEach(function (container) {
      var headings = container.querySelectorAll(':scope > h1, :scope > h2, :scope > div > h1, :scope > div > h2');
      var pageTitle = getPageTitle();
      headings.forEach(function (h) {
        var text = h.textContent.trim();
        // Hide if it matches the iOS nav title exactly or closely
        if (text === pageTitle ||
            text.toLowerCase() === pageTitle.toLowerCase() ||
            text.replace(/\s+/g, '') === pageTitle.replace(/\s+/g, '')) {
          h.style.display = 'none';
          h.dataset.wlHiddenTitle = 'true';
        }
      });
    });
  }

  // ─── CHANGE 8: NAV BAR SCROLL STATE ─────────────────
  function setupNavScrollDetection() {
    if (!isMobile) return;

    var lastScrollY = 0;
    var ticking = false;

    window.addEventListener('scroll', function () {
      lastScrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(function () {
          var nav = document.getElementById('wl-ios-nav');
          if (nav) {
            nav.classList.toggle('wl-nav-scrolled', lastScrollY > 10);
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  // ─── ENHANCEMENT LOOP ────────────────────────────────
  function enhance() {
    convertTablesToCards();
    enhanceDashboardWidgets();
    addLargeTitle();
    hideReactPageTitles();
    stripWindowChrome();
  }


  // ─── CHANGE 1: STRIP macOS WINDOW CHROME ──────────────
  function stripWindowChrome() {
    if (!isMobile) return;

    // Remove traffic light buttons from modals
    var trafficSelectors = [
      '.traffic-lights', '.traffic-btn',
      '[class*="traffic-light"]', '[class*="window-controls"]',
      '[class*="titlebar"]'
    ];

    trafficSelectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.style.display = 'none';
      });
    });

    // Remove resize handles
    document.querySelectorAll('.modal-overlay .modal, .settings-modal-window').forEach(function (el) {
      el.style.resize = 'none';
    });
  }


  // ─── CHANGE 6: LIQUID GLASS SVG FILTER ────────────────
  function injectLiquidGlassFilter() {
    if (document.getElementById('wl-lg-svg-filters')) return;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'wl-lg-svg-filters';
    svg.setAttribute('class', 'wl-lg-filter');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
    svg.innerHTML =
      '<defs>' +
        '<filter id="wl-frosted" x="0%" y="0%" width="100%" height="100%">' +
          '<feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur"/>' +
          '<feColorMatrix in="blur" type="saturate" values="1.2" result="saturated"/>' +
          '<feComposite in="saturated" in2="SourceGraphic" operator="over"/>' +
        '</filter>' +
      '</defs>';
    document.body.appendChild(svg);
  }


  // ─── INIT ────────────────────────────────────────────
  function init() {
    injectCSS();
    ensureViewportMeta();
    fetchUserSession();

    if (isMobile) {
      createTabBar();
      createHomeIndicator();
      createOrUpdateIOSNav();
      setupPullToRefresh();
      setupSwipeUpToHome();
      setupSwipeDownControlCenter();
      setupNavScrollDetection();
      updateLoginState();

      // Show home screen on dashboard at startup
      // showHomeScreen() internally calls createHomeScreenGrid() when needed
      if (isDashboardPage() && !isLoginPage()) {
        showHomeScreen();
      }

      // Clock update is handled inside createHomeScreenGrid() — no duplicate needed

      // CHANGE 6: Inject SVG filter for liquid glass (CSS-only)
      injectLiquidGlassFilter();
    }

    if (isTouch) {
      setupSwipeDismiss();
    }

    // Global re-entrancy guard: prevents cascading MutationObserver triggers
    // when one addon modifies the DOM and triggers all other observers.
    if (!window.__wlMutationGuard) window.__wlMutationGuard = false;

    var debounceTimer;
    var observer = new MutationObserver(function () {
      if (window.__wlMutationGuard) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        window.__wlMutationGuard = true;
        try { enhance(); } finally { window.__wlMutationGuard = false; }
      }, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Single URL poll — emits 'wl-route-change' so other addons don't need their own
    if (!window.__wlRoutePoller) {
      window.__wlRoutePoller = true;
      var __lastPolledPath = window.location.pathname;
      setInterval(function () {
        if (window.location.pathname !== __lastPolledPath) {
          __lastPolledPath = window.location.pathname;
          window.dispatchEvent(new CustomEvent('wl-route-change', { detail: { path: __lastPolledPath } }));
        }
      }, 200);
      window.addEventListener('popstate', function () {
        setTimeout(function () {
          window.dispatchEvent(new CustomEvent('wl-route-change', { detail: { path: window.location.pathname } }));
        }, 50);
      });
    }
    window.addEventListener('wl-route-change', function () {
      _lastPath = window.location.pathname;
      onRouteChange();
    });

    window.addEventListener('resize', handleResize);

    enhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
