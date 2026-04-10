/**
 * WL101 Portal — Mobile-Only App
 *
 * Completely independent of desktop. Only runs on mobile viewports.
 *
 * Architecture:
 *   - Watches the URL and, for interior routes, hides React's #root
 *     and renders our own iOS-native page into #wl-mobile-app.
 *   - Dashboard and login are left alone (home screen + React login).
 *   - Each page fetches data from the same `/api/*` endpoints the
 *     desktop React app uses, so mutations stay in sync.
 */
(function () {
  'use strict';

  // ─── GUARDS ──────────────────────────────────────────
  var isMobile = window.innerWidth <= 768;
  if (!isMobile) return; // Desktop: do nothing at all.

  // ─── STATE ───────────────────────────────────────────
  var _root = null;          // #wl-mobile-app element
  var _currentPath = null;
  var _currentPage = null;   // { path, destroy }
  var _userSession = null;
  var _cache = {};           // in-memory cache for list data
  var _scrollPositions = {}; // per-path scroll restoration

  // ─── PAGE REGISTRY ───────────────────────────────────
  var PAGES = {}; // filled below by registerPages()

  // ─── UTILITIES ───────────────────────────────────────
  function isLogin() { return window.location.pathname === '/login'; }
  function isDashboard() {
    var p = window.location.pathname;
    return p === '/dashboard' || p === '/' || p === '';
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }

  function el(tag, opts, children) {
    var e = document.createElement(tag);
    if (opts) {
      if (opts.className) e.className = opts.className;
      if (opts.id) e.id = opts.id;
      if (opts.text != null) e.textContent = opts.text;
      if (opts.html != null) e.innerHTML = opts.html;
      if (opts.attrs) for (var k in opts.attrs) e.setAttribute(k, opts.attrs[k]);
      if (opts.style) for (var s in opts.style) e.style[s] = opts.style[s];
      if (opts.on) for (var ev in opts.on) e.addEventListener(ev, opts.on[ev]);
    }
    if (children) {
      if (Array.isArray(children)) {
        children.forEach(function (c) { if (c) e.appendChild(c); });
      } else {
        e.appendChild(children);
      }
    }
    return e;
  }

  function icon(name) {
    var paths = {
      chevron: '<polyline points="9 18 15 12 9 6"></polyline>',
      chevronLeft: '<polyline points="15 18 9 12 15 6"></polyline>',
      search: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
      plus: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
      user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
      group: '<circle cx="9" cy="7" r="4"></circle><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path><circle cx="17" cy="9" r="2"></circle>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>',
      calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
      settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
      edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
      trash: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
      check: '<polyline points="20 6 9 17 4 12"></polyline>',
      x: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
      warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
      info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
      inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>',
      bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>',
      key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>',
      clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>',
      tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line>',
      camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>',
      refresh: '<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>',
      lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
      note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
      activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
      minus: '<line x1="5" y1="12" x2="19" y2="12"></line>'
    };
    var p = paths[name] || '';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }

  function chevronSvg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>'; }

  // ─── API HELPERS ─────────────────────────────────────
  function api(method, path, body) {
    var opts = {
      method: method,
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(path, opts).then(function (res) {
      return res.json().catch(function () { return { success: false }; });
    });
  }

  function fetchSession() {
    if (_userSession) return Promise.resolve(_userSession);
    return api('GET', '/api/auth/session').then(function (data) {
      if (data && data.user) _userSession = data.user;
      return _userSession;
    });
  }

  // ─── TOAST ───────────────────────────────────────────
  function toast(msg) {
    var existing = document.querySelector('.wl-toast');
    if (existing) existing.remove();
    var t = el('div', { className: 'wl-toast', text: msg });
    document.body.appendChild(t);
    setTimeout(function () {
      t.classList.add('wl-toast-out');
      setTimeout(function () { t.remove(); }, 300);
    }, 2400);
  }

  // ─── BOTTOM SHEET ────────────────────────────────────
  function openSheet(options) {
    // options: { title, body(node), onCancel, onDone, doneLabel }
    var sheet = el('div', { className: 'wl-sheet' });
    var overlay = el('div', { className: 'wl-sheet-overlay' }, sheet);

    sheet.appendChild(el('div', { className: 'wl-sheet-grabber' }));

    var header = el('div', { className: 'wl-sheet-header' });
    var cancel = el('button', {
      className: 'wl-sheet-cancel',
      text: 'Cancel',
      on: { click: function () { close(); if (options.onCancel) options.onCancel(); } }
    });
    var title = el('h3', { className: 'wl-sheet-title', text: options.title || '' });
    var done = el('button', {
      className: 'wl-sheet-done',
      text: options.doneLabel || 'Done',
      on: {
        click: function () {
          if (options.onDone) {
            var shouldClose = options.onDone();
            if (shouldClose !== false) close();
          } else {
            close();
          }
        }
      }
    });
    header.appendChild(cancel);
    header.appendChild(title);
    if (options.onDone) {
      header.appendChild(done);
    } else {
      header.appendChild(el('span', { style: { width: '40px' } }));
    }
    sheet.appendChild(header);

    var body = el('div', { className: 'wl-sheet-body' });
    if (options.body) body.appendChild(options.body);
    sheet.appendChild(body);

    document.body.appendChild(overlay);

    function close() {
      overlay.style.animation = 'wlOverlayIn 0.2s ease reverse';
      sheet.style.animation = 'wlSheetIn 0.25s ease reverse';
      setTimeout(function () { overlay.remove(); }, 250);
    }

    // Click outside to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    return { close: close, body: body };
  }

  // Confirmation dialog
  function confirmDialog(message, onConfirm) {
    var body = el('div', { style: { padding: '8px 20px' } });
    body.appendChild(el('p', { style: { fontSize: '15px', color: 'rgba(235,235,245,0.9)', lineHeight: '1.4', margin: '0 0 16px' }, text: message }));

    var btnRow = el('div', { style: { display: 'flex', gap: '10px' } });
    var sheet;

    var cancelBtn = el('button', {
      className: 'wl-btn wl-btn-secondary',
      text: 'Cancel',
      style: { flex: '1' },
      on: { click: function () { sheet.close(); } }
    });
    var confirmBtn = el('button', {
      className: 'wl-btn wl-btn-danger',
      text: 'Confirm',
      style: { flex: '1' },
      on: {
        click: function () {
          sheet.close();
          if (onConfirm) onConfirm();
        }
      }
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    body.appendChild(btnRow);

    sheet = openSheet({ title: 'Confirm', body: body });
  }

  // ─── PAGE SHELL HELPERS ──────────────────────────────
  function pageShell(title, subtitle) {
    var page = el('div', { className: 'wl-page' });
    var header = el('div', { className: 'wl-page-header' });
    header.appendChild(el('h1', { className: 'wl-page-large-title', text: title }));
    if (subtitle) header.appendChild(el('p', { className: 'wl-page-subtitle', text: subtitle }));
    page.appendChild(header);
    var content = el('div', { className: 'wl-page-content' });
    page.appendChild(content);
    return { page: page, header: header, content: content };
  }

  function searchBar(placeholder, onInput) {
    var wrap = el('div', { className: 'wl-page-search' });
    wrap.innerHTML = icon('search');
    var input = el('input', {
      attrs: { type: 'search', placeholder: placeholder || 'Search' },
      on: { input: function (e) { if (onInput) onInput(e.target.value); } }
    });
    wrap.appendChild(input);
    return wrap;
  }

  function emptyState(title, text, iconName) {
    var wrap = el('div', { className: 'wl-empty' });
    var iconWrap = el('div', { className: 'wl-empty-icon' });
    iconWrap.innerHTML = icon(iconName || 'inbox');
    wrap.appendChild(iconWrap);
    wrap.appendChild(el('div', { className: 'wl-empty-title', text: title }));
    if (text) wrap.appendChild(el('p', { className: 'wl-empty-text', text: text }));
    return wrap;
  }

  function loadingState() {
    var wrap = el('div', {});
    for (var i = 0; i < 6; i++) {
      wrap.appendChild(el('div', { className: 'wl-skeleton wl-skeleton-row' }));
    }
    return wrap;
  }

  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function avatarColor(name) {
    var n = (name || '').charCodeAt(0) + (name || '').length;
    return 'wl-avatar-' + ((n % 8) + 1);
  }

  function avatarNode(user) {
    if (user.profile_image) {
      return el('img', {
        className: 'wl-row-avatar',
        attrs: { src: user.profile_image, alt: user.name || 'avatar', loading: 'lazy' }
      });
    }
    return el('div', {
      className: 'wl-row-avatar-fallback ' + avatarColor(user.name || user.username || ''),
      text: initials(user.name || user.username || '')
    });
  }

  function row(opts) {
    // opts: { avatar, icon, title, subtitle, meta, badges[], onClick, chevron (default true) }
    var r = el('div', { className: 'wl-row' });
    if (opts.avatar) r.appendChild(opts.avatar);
    else if (opts.iconNode) r.appendChild(opts.iconNode);

    var main = el('div', { className: 'wl-row-main' });
    main.appendChild(el('div', { className: 'wl-row-title', text: opts.title || '' }));
    if (opts.subtitle) main.appendChild(el('div', { className: 'wl-row-subtitle', text: opts.subtitle }));
    r.appendChild(main);

    if (opts.badges && opts.badges.length) {
      opts.badges.forEach(function (b) {
        r.appendChild(el('span', { className: 'wl-row-badge wl-badge-' + (b.type || ''), text: b.text }));
      });
    }
    if (opts.meta) r.appendChild(el('div', { className: 'wl-row-meta', text: opts.meta }));

    if (opts.chevron !== false) {
      var chev = el('div', { className: 'wl-row-chevron', html: chevronSvg() });
      r.appendChild(chev);
    }

    if (opts.onClick) r.addEventListener('click', opts.onClick);
    return r;
  }

  function section(headerText, children) {
    var frag = document.createDocumentFragment();
    if (headerText) frag.appendChild(el('h3', { className: 'wl-section-header', text: headerText }));
    var list = el('div', { className: 'wl-list' });
    if (Array.isArray(children)) children.forEach(function (c) { if (c) list.appendChild(c); });
    frag.appendChild(list);
    return frag;
  }

  function formGroup(label, input) {
    var g = el('div', { className: 'wl-form-group' });
    g.appendChild(el('label', { className: 'wl-form-label', text: label }));
    g.appendChild(input);
    return g;
  }


  // ═══════════════════════════════════════════════════════
  //  PAGE: USERS (/admin)
  // ═══════════════════════════════════════════════════════
  PAGES['/admin'] = {
    title: 'Users',
    render: function (root) {
      var shell = pageShell('Users');
      root.appendChild(shell.page);

      var searchVal = '';
      var users = [];

      // FAB
      var fab = el('button', {
        className: 'wl-fab',
        attrs: { 'aria-label': 'Add user' },
        html: icon('plus'),
        on: { click: function () { openUserSheet(null); } }
      });
      document.body.appendChild(fab);

      shell.header.appendChild(searchBar('Search users', function (v) {
        searchVal = v.toLowerCase();
        renderList();
      }));

      shell.content.appendChild(loadingState());

      function applyFilter(list) {
        if (!searchVal) return list;
        return list.filter(function (u) {
          return (u.name || '').toLowerCase().indexOf(searchVal) !== -1
              || (u.username || '').toLowerCase().indexOf(searchVal) !== -1
              || (u.celebration_point || '').toLowerCase().indexOf(searchVal) !== -1;
        });
      }

      function renderList() {
        shell.content.innerHTML = '';
        var filtered = applyFilter(users);
        if (filtered.length === 0) {
          shell.content.appendChild(emptyState('No users', 'Try a different search term or add a new user.', 'users'));
          return;
        }

        // Group by role
        var groups = {};
        filtered.forEach(function (u) {
          var role = (u.roles && u.roles[0]) || u.role || 'Other';
          if (!groups[role]) groups[role] = [];
          groups[role].push(u);
        });

        Object.keys(groups).sort().forEach(function (role) {
          var rows = groups[role].map(function (u) {
            return row({
              avatar: avatarNode(u),
              title: u.name || u.username,
              subtitle: (u.celebration_point || '—') + ' · @' + (u.username || ''),
              badges: u.active === 0 ? [{ type: 'inactive', text: 'Inactive' }] : [],
              onClick: function () { openUserSheet(u); }
            });
          });
          shell.content.appendChild(section(role.toUpperCase(), rows));
        });
      }

      function load() {
        api('GET', '/api/admin/users').then(function (data) {
          if (data.success && Array.isArray(data.users)) {
            users = data.users;
            renderList();
          } else {
            shell.content.innerHTML = '';
            shell.content.appendChild(emptyState('Could not load users', data.message || 'Please try again.', 'warning'));
          }
        }).catch(function () {
          shell.content.innerHTML = '';
          shell.content.appendChild(emptyState('Network error', 'Check your connection.', 'warning'));
        });
      }

      function openUserSheet(user) {
        var isEdit = !!user;
        var body = el('div', { className: 'wl-form' });

        var nameInput = el('input', { className: 'wl-form-input', attrs: { type: 'text', value: (user && user.name) || '', placeholder: 'Full name' } });
        var usernameInput = el('input', { className: 'wl-form-input', attrs: { type: 'text', value: (user && user.username) || '', placeholder: 'username' } });
        var passwordInput = el('input', { className: 'wl-form-input', attrs: { type: 'password', placeholder: isEdit ? 'Leave blank to keep current' : 'Password', autocomplete: 'new-password' } });

        var roleSelect = el('select', { className: 'wl-form-select' });
        ['Admin', 'LeadershipTeam', 'Pastor', 'Coordinator', 'Facilitator', 'CoFacilitator', 'TechSupport'].forEach(function (r) {
          var opt = el('option', { attrs: { value: r }, text: r });
          if (user && ((user.roles && user.roles[0] === r) || user.role === r)) opt.selected = true;
          roleSelect.appendChild(opt);
        });

        var campusSelect = el('select', { className: 'wl-form-select' });
        ['Bbira', 'Bugolobi', 'Bweyogerere', 'Downtown', 'Entebbe', 'Gulu', 'Jinja', 'Juba', 'Kansanga', 'Kyengera', 'Laminadera', 'Lubowa', 'Mbarara', 'Mukono', 'Nakwero', 'Nansana', 'Ntinda', 'Online', 'Suubi'].forEach(function (c) {
          var opt = el('option', { attrs: { value: c }, text: c });
          if (user && user.celebration_point === c) opt.selected = true;
          campusSelect.appendChild(opt);
        });

        body.appendChild(formGroup('Full Name', nameInput));
        body.appendChild(formGroup('Username', usernameInput));
        body.appendChild(formGroup('Password', passwordInput));
        body.appendChild(formGroup('Role', roleSelect));
        body.appendChild(formGroup('Campus', campusSelect));

        if (isEdit) {
          var deleteBtn = el('button', {
            className: 'wl-btn wl-btn-danger wl-btn-block',
            text: 'Delete User',
            on: {
              click: function () {
                confirmDialog('Delete ' + (user.name || user.username) + '? This can be undone by an admin.', function () {
                  api('DELETE', '/api/admin/users/' + user.id).then(function (data) {
                    if (data.success) {
                      toast('User deleted');
                      sheet.close();
                      load();
                    } else {
                      toast(data.message || 'Failed to delete');
                    }
                  });
                });
              }
            }
          });
          body.appendChild(deleteBtn);
        }

        var sheet = openSheet({
          title: isEdit ? 'Edit User' : 'New User',
          body: body,
          doneLabel: 'Save',
          onDone: function () {
            var payload = {
              name: nameInput.value.trim(),
              username: usernameInput.value.trim().toLowerCase(),
              role: roleSelect.value,
              celebration_point: campusSelect.value
            };
            if (passwordInput.value) payload.password = passwordInput.value;
            if (!payload.name || !payload.username) {
              toast('Name and username are required');
              return false;
            }
            if (!isEdit && !passwordInput.value) {
              toast('Password required for new user');
              return false;
            }
            var req = isEdit
              ? api('PUT', '/api/admin/users/' + user.id, payload)
              : api('POST', '/api/admin/users', payload);
            req.then(function (data) {
              if (data.success) {
                toast(isEdit ? 'User updated' : 'User created');
                load();
              } else {
                toast(data.message || 'Save failed');
              }
            });
            return true;
          }
        });
      }

      load();

      return {
        destroy: function () {
          if (fab && fab.parentNode) fab.remove();
        }
      };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: STUDENTS (/students)
  // ═══════════════════════════════════════════════════════
  PAGES['/students'] = {
    title: 'Students',
    render: function (root) {
      var shell = pageShell('Students');
      root.appendChild(shell.page);

      var searchVal = '';
      var allStudents = [];

      shell.header.appendChild(searchBar('Search students', function (v) {
        searchVal = v.toLowerCase();
        renderList();
      }));

      shell.content.appendChild(loadingState());

      function applyFilter(list) {
        if (!searchVal) return list;
        return list.filter(function (s) {
          var n = ((s.first_name || '') + ' ' + (s.last_name || '')).toLowerCase();
          if (s.name) n += ' ' + s.name.toLowerCase();
          return n.indexOf(searchVal) !== -1
              || (s.email || '').toLowerCase().indexOf(searchVal) !== -1
              || (s.celebration_point || '').toLowerCase().indexOf(searchVal) !== -1;
        });
      }

      function fullName(s) {
        return (s.name) || ((s.first_name || '') + ' ' + (s.last_name || '')).trim() || s.email || 'Unknown';
      }

      function renderList() {
        shell.content.innerHTML = '';
        var filtered = applyFilter(allStudents);
        if (filtered.length === 0) {
          shell.content.appendChild(emptyState('No students', 'Try a different search term.', 'user'));
          return;
        }

        // Only show first 150 to keep mobile snappy
        var visible = filtered.slice(0, 150);
        var rows = visible.map(function (s) {
          return row({
            avatar: avatarNode({ name: fullName(s), profile_image: s.avatar_url }),
            title: fullName(s),
            subtitle: (s.celebration_point || '—') + (s.email ? ' · ' + s.email : ''),
            onClick: function () {
              navigateTo('/students/' + encodeURIComponent(s.id || s.user_id || s.email));
            }
          });
        });
        shell.content.appendChild(section(filtered.length + ' TOTAL' + (visible.length < filtered.length ? ' (' + visible.length + ' shown)' : ''), rows));
      }

      api('GET', '/api/data/students').then(function (data) {
        if (data.success && Array.isArray(data.students)) {
          allStudents = data.students;
          renderList();
        } else {
          shell.content.innerHTML = '';
          shell.content.appendChild(emptyState('No students loaded', data.message || 'Please try again.', 'warning'));
        }
      }).catch(function () {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Network error', 'Check your connection.', 'warning'));
      });

      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: GROUPS (/groups)
  // ═══════════════════════════════════════════════════════
  PAGES['/groups'] = {
    title: 'Groups',
    render: function (root) {
      var shell = pageShell('Groups');
      root.appendChild(shell.page);

      var searchVal = '';
      var allGroups = [];

      var fab = el('button', {
        className: 'wl-fab',
        attrs: { 'aria-label': 'Add group' },
        html: icon('plus'),
        on: {
          click: function () {
            var body = el('div', { className: 'wl-form' });
            var campusSelect = el('select', { className: 'wl-form-select' });
            ['Bbira', 'Bugolobi', 'Bweyogerere', 'Downtown', 'Entebbe', 'Gulu', 'Jinja', 'Juba', 'Kansanga', 'Kyengera', 'Laminadera', 'Lubowa', 'Mbarara', 'Mukono', 'Nakwero', 'Nansana', 'Ntinda', 'Online', 'Suubi'].forEach(function (c) {
              campusSelect.appendChild(el('option', { attrs: { value: c }, text: c }));
            });
            body.appendChild(formGroup('Campus', campusSelect));

            // Show next code preview
            var codePreview = el('div', { style: { padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', textAlign: 'center', fontSize: '18px', fontWeight: '700', color: '#6366f1', marginBottom: '12px' }, text: 'Loading…' });
            body.appendChild(codePreview);

            function loadCode() {
              api('GET', '/api/formation-groups/next-code?celebration_point=' + encodeURIComponent(campusSelect.value)).then(function (res) {
                codePreview.textContent = res.nextCode || res.code || '—';
              });
            }
            loadCode();
            campusSelect.addEventListener('change', loadCode);

            var sheet = openSheet({
              title: 'New Group',
              body: body,
              doneLabel: 'Create',
              onDone: function () {
                var code = codePreview.textContent;
                if (!code || code === '—' || code === 'Loading…') { toast('Wait for code to load'); return false; }
                api('POST', '/api/formation-groups', {
                  group_code: code,
                  name: code,
                  celebration_point: campusSelect.value
                }).then(function (res) {
                  if (res.success || res.id) {
                    toast('Group ' + code + ' created');
                    allGroups = [];
                    load();
                  } else {
                    toast(res.message || 'Failed');
                  }
                });
                return true;
              }
            });
          }
        }
      });
      document.body.appendChild(fab);

      shell.header.appendChild(searchBar('Search groups', function (v) {
        searchVal = v.toLowerCase();
        renderList();
      }));

      shell.content.appendChild(loadingState());

      function applyFilter(list) {
        if (!searchVal) return list;
        return list.filter(function (g) {
          return (g.group_code || '').toLowerCase().indexOf(searchVal) !== -1
              || (g.name || '').toLowerCase().indexOf(searchVal) !== -1
              || (g.celebration_point || '').toLowerCase().indexOf(searchVal) !== -1
              || (g.facilitator_name || '').toLowerCase().indexOf(searchVal) !== -1;
        });
      }

      function renderList() {
        shell.content.innerHTML = '';
        var filtered = applyFilter(allGroups);
        if (filtered.length === 0) {
          shell.content.appendChild(emptyState('No groups', 'Try a different search term.', 'group'));
          return;
        }

        // Group by campus
        var byCampus = {};
        filtered.forEach(function (g) {
          var cp = g.celebration_point || 'Unassigned';
          if (!byCampus[cp]) byCampus[cp] = [];
          byCampus[cp].push(g);
        });

        Object.keys(byCampus).sort().forEach(function (campus) {
          var groups = byCampus[campus].sort(function (a, b) {
            return (a.group_code || '').localeCompare(b.group_code || '');
          });
          var rows = groups.map(function (g) {
            var iconNode = el('div', {
              className: 'wl-row-icon ' + avatarColor(g.group_code || ''),
              text: (g.group_code || '').slice(-2)
            });
            iconNode.style.fontSize = '12px';
            iconNode.style.fontWeight = '600';
            return row({
              iconNode: iconNode,
              title: g.group_code || g.name,
              subtitle: (g.facilitator_name || 'No facilitator') + ' · ' + (g.member_count || 0) + ' members',
              onClick: function () {
                navigateTo('/groups/' + g.id);
              }
            });
          });
          shell.content.appendChild(section(campus.toUpperCase(), rows));
        });
      }

      function load() {
        shell.content.innerHTML = '';
        shell.content.appendChild(loadingState());
        api('GET', '/api/formation-groups').then(function (data) {
          if (Array.isArray(data)) {
            allGroups = data;
            renderList();
          } else if (data.success && Array.isArray(data.groups)) {
            allGroups = data.groups;
            renderList();
          } else {
            shell.content.innerHTML = '';
            shell.content.appendChild(emptyState('Could not load groups', 'Please try again.', 'warning'));
          }
        }).catch(function () {
          shell.content.innerHTML = '';
          shell.content.appendChild(emptyState('Network error', 'Check your connection.', 'warning'));
        });
      }
      load();

      return {
        destroy: function () {
          if (fab && fab.parentNode) fab.remove();
        }
      };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: GROUP DETAIL (/groups/:id)
  // ═══════════════════════════════════════════════════════
  function renderGroupDetail(id, root) {
    var shell = pageShell('Group', 'Loading…');
    root.appendChild(shell.page);
    shell.content.appendChild(loadingState());

    api('GET', '/api/formation-groups/' + id).then(function (g) {
      if (!g || g.error) {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Group not found', '', 'warning'));
        return;
      }

      shell.header.querySelector('.wl-page-large-title').textContent = g.group_code || g.name || 'Group';
      var sub = shell.header.querySelector('.wl-page-subtitle');
      if (sub) sub.textContent = g.celebration_point || '';

      shell.content.innerHTML = '';

      // Info card
      var infoCard = el('div', { className: 'wl-card' });
      infoCard.appendChild(el('div', { className: 'wl-card-title', text: 'Details' }));
      var bodyHtml = '';
      if (g.facilitator_name) bodyHtml += '<div><strong>Facilitator:</strong> ' + g.facilitator_name + '</div>';
      if (g.co_facilitator_name) bodyHtml += '<div><strong>Co-Facilitator:</strong> ' + g.co_facilitator_name + '</div>';
      if (g.cohort) bodyHtml += '<div><strong>Cohort:</strong> ' + g.cohort + '</div>';
      bodyHtml += '<div><strong>Members:</strong> ' + ((g.members && g.members.length) || 0) + '</div>';
      infoCard.appendChild(el('div', { className: 'wl-card-body', html: bodyHtml }));
      shell.content.appendChild(infoCard);

      // Members list
      if (g.members && g.members.length) {
        var memberRows = g.members.map(function (m) {
          var name = m.student_name || m.name || ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || m.email || m.student_email || 'Unknown';
          return row({
            avatar: avatarNode({ name: name, profile_image: m.avatar_url || m.profile_image }),
            title: name,
            subtitle: m.student_email || m.email || '',
            chevron: false,
            onClick: function () {
              // Navigate to student detail if we have an id
              var sid = m.student_id || m.thinkific_student_id;
              if (sid) navigateTo('/students/' + encodeURIComponent(sid));
            }
          });
        });
        shell.content.appendChild(section('MEMBERS (' + g.members.length + ')', memberRows));
      } else {
        shell.content.appendChild(emptyState('No members', 'Tap + to add members.', 'users'));
      }

      // Add member button
      var addMemberRow = row({
        iconNode: el('div', { className: 'wl-row-icon', html: icon('plus'), style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' } }),
        title: 'Add Member',
        subtitle: 'Search and add a student to this group',
        onClick: function () {
          var body = el('div', { className: 'wl-form' });
          var searchInput = el('input', { className: 'wl-form-input', attrs: { type: 'text', placeholder: 'Search by name or email' } });
          body.appendChild(formGroup('Find Student', searchInput));
          var resultsDiv = el('div');
          body.appendChild(resultsDiv);

          var debounceTimer;
          searchInput.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            var q = searchInput.value.trim();
            if (q.length < 2) { resultsDiv.innerHTML = ''; return; }
            debounceTimer = setTimeout(function () {
              api('GET', '/api/data/students').then(function (data) {
                resultsDiv.innerHTML = '';
                var students = (data && data.students) || [];
                var filtered = students.filter(function (s) {
                  var n = (s.name || (s.first_name || '') + ' ' + (s.last_name || '')).toLowerCase();
                  return n.indexOf(q.toLowerCase()) !== -1 || (s.email || '').toLowerCase().indexOf(q.toLowerCase()) !== -1;
                }).slice(0, 20);
                if (!filtered.length) {
                  resultsDiv.appendChild(el('div', { style: { padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }, text: 'No students found' }));
                  return;
                }
                filtered.forEach(function (s) {
                  var sName = s.name || ((s.first_name || '') + ' ' + (s.last_name || '')).trim() || s.email;
                  var sRow = el('div', {
                    style: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' },
                    on: {
                      click: function () {
                        var studentId = s.id || s.user_id;
                        api('POST', '/api/formation-groups/' + id + '/members', {
                          student_id: String(studentId),
                          student_name: sName,
                          student_email: s.email || ''
                        }).then(function (res) {
                          if (res.success || res.id) {
                            toast(sName + ' added');
                            sheet.close();
                            navigateTo('/groups/' + id);
                          } else {
                            toast(res.message || 'Failed to add');
                          }
                        });
                      }
                    }
                  });
                  sRow.appendChild(el('div', { style: { fontSize: '15px', color: 'rgba(255,255,255,0.9)' }, text: sName }));
                  if (s.email) sRow.appendChild(el('div', { style: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }, text: s.email }));
                  resultsDiv.appendChild(sRow);
                });
              });
            }, 300);
          });

          var sheet = openSheet({ title: 'Add Member', body: body });
        }
      });
      shell.content.appendChild(section('ACTIONS', [addMemberRow]));

    }).catch(function () {
      shell.content.innerHTML = '';
      shell.content.appendChild(emptyState('Network error', '', 'warning'));
    });

    return { destroy: function () {} };
  }


  // ═══════════════════════════════════════════════════════
  //  PAGE: STUDENT DETAIL (/students/:id)
  // ═══════════════════════════════════════════════════════
  function renderStudentDetail(studentId, root) {
    var shell = pageShell('Student', 'Loading…');
    root.appendChild(shell.page);
    shell.content.appendChild(loadingState());

    // Fetch all students then find the one we need
    api('GET', '/api/data/students').then(function (data) {
      var students = (data && data.students) || [];
      var s = students.find(function (st) {
        return String(st.id) === String(studentId) || String(st.user_id) === String(studentId) || st.email === decodeURIComponent(studentId);
      });

      if (!s) {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Student not found', '', 'warning'));
        return;
      }

      var name = s.name || ((s.first_name || '') + ' ' + (s.last_name || '')).trim() || s.email || 'Unknown';
      shell.header.querySelector('.wl-page-large-title').textContent = name;
      var sub = shell.header.querySelector('.wl-page-subtitle');
      if (sub) sub.textContent = s.celebration_point || s.email || '';

      shell.content.innerHTML = '';

      // Avatar + name card
      var profileCard = el('div', { className: 'wl-card', style: { textAlign: 'center', padding: '24px 16px' } });
      var av = avatarNode({ name: name, profile_image: s.avatar_url });
      av.style.width = '64px';
      av.style.height = '64px';
      av.style.fontSize = '24px';
      av.style.margin = '0 auto 12px';
      profileCard.appendChild(av);
      profileCard.appendChild(el('div', { style: { fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.92)' }, text: name }));
      if (s.email) profileCard.appendChild(el('div', { style: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }, text: s.email }));
      shell.content.appendChild(profileCard);

      // Progress bar
      var progress = Math.round(s.progress || s.percentage_completed || 0);
      var progressCard = el('div', { className: 'wl-card' });
      progressCard.appendChild(el('div', { className: 'wl-card-title', text: 'Course Progress' }));
      var barOuter = el('div', { style: { background: 'rgba(255,255,255,0.1)', borderRadius: '6px', height: '12px', overflow: 'hidden', margin: '8px 0' } });
      var barColor = progress >= 75 ? '#30D158' : progress >= 30 ? '#FF9F0A' : '#FF453A';
      barOuter.appendChild(el('div', { style: { width: progress + '%', height: '100%', background: barColor, borderRadius: '6px', transition: 'width 0.4s ease' } }));
      progressCard.appendChild(barOuter);
      progressCard.appendChild(el('div', { style: { fontSize: '24px', fontWeight: '700', color: barColor, textAlign: 'center' }, text: progress + '%' }));
      shell.content.appendChild(progressCard);

      // Status details
      var statusLabel = progress >= 75 ? 'On Track' : progress >= 30 ? 'In Progress' : 'Needs Help';
      var daysInactive = s.days_inactive || s.daysInactive || 0;
      var detailRows = [
        row({ iconNode: el('div', { className: 'wl-row-icon', html: icon('activity'), style: { background: 'rgba(10,132,255,0.2)', color: '#0A84FF' } }), title: 'Status', meta: statusLabel, chevron: false }),
        row({ iconNode: el('div', { className: 'wl-row-icon', html: icon('calendar'), style: { background: 'rgba(255,159,10,0.2)', color: '#FF9F0A' } }), title: 'Days Inactive', meta: String(daysInactive), chevron: false })
      ];
      if (s.celebration_point) {
        detailRows.push(row({ iconNode: el('div', { className: 'wl-row-icon', html: icon('group'), style: { background: 'rgba(94,92,230,0.2)', color: '#5E5CE6' } }), title: 'Campus', meta: s.celebration_point, chevron: false }));
      }
      if (s.last_sign_in_at || s.last_activity) {
        var lastActive = new Date(s.last_sign_in_at || s.last_activity).toLocaleDateString();
        detailRows.push(row({ iconNode: el('div', { className: 'wl-row-icon', html: icon('info'), style: { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' } }), title: 'Last Active', meta: lastActive, chevron: false }));
      }
      shell.content.appendChild(section('DETAILS', detailRows));

      // Notes section
      var notesContainer = el('div');
      shell.content.appendChild(notesContainer);

      var sid = s.id || s.user_id || '';
      if (sid) {
        api('GET', '/api/data/notes/' + sid).then(function (nd) {
          var notes = (nd && nd.notes) || [];
          if (notes.length) {
            var noteRows = notes.map(function (n) {
              return row({
                iconNode: el('div', { className: 'wl-row-icon', html: icon('note'), style: { background: 'rgba(255,159,10,0.2)', color: '#FF9F0A' } }),
                title: n.content ? (n.content.length > 80 ? n.content.slice(0, 80) + '…' : n.content) : 'Note',
                subtitle: (n.author_name || 'Unknown') + ' · ' + (n.created_at ? new Date(n.created_at).toLocaleDateString() : ''),
                chevron: false
              });
            });
            notesContainer.appendChild(section('PASTORAL NOTES', noteRows));
          }
        }).catch(function () {});

        // Add note button
        var addNoteRow = row({
          iconNode: el('div', { className: 'wl-row-icon', html: icon('plus'), style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' } }),
          title: 'Add Note',
          subtitle: 'Write a pastoral note for this student',
          onClick: function () {
            var body = el('div', { className: 'wl-form' });
            var noteInput = el('textarea', { className: 'wl-form-input', attrs: { placeholder: 'Write your note here…', rows: '4' }, style: { minHeight: '100px', resize: 'vertical' } });
            body.appendChild(formGroup('Note', noteInput));
            openSheet({
              title: 'Add Note',
              body: body,
              doneLabel: 'Save',
              onDone: function () {
                var content = noteInput.value.trim();
                if (!content) { toast('Note cannot be empty'); return false; }
                api('POST', '/api/data/notes', { studentId: sid, content: content }).then(function (res) {
                  if (res.success) { toast('Note added'); navigateTo('/students/' + studentId); }
                  else toast(res.message || 'Failed');
                });
                return true;
              }
            });
          }
        });
        notesContainer.appendChild(section('ACTIONS', [addNoteRow]));
      }
    }).catch(function () {
      shell.content.innerHTML = '';
      shell.content.appendChild(emptyState('Network error', '', 'warning'));
    });

    return { destroy: function () {} };
  }


  // ═══════════════════════════════════════════════════════
  //  PAGE: WEEKLY REPORTS (/weekly-reports)
  // ═══════════════════════════════════════════════════════
  PAGES['/weekly-reports'] = {
    title: 'Reports',
    render: function (root) {
      var shell = pageShell('Reports');
      root.appendChild(shell.page);

      shell.content.appendChild(loadingState());

      api('GET', '/api/reports').then(function (data) {
        shell.content.innerHTML = '';
        var reports = Array.isArray(data) ? data : (data.reports || []);
        if (reports.length === 0) {
          shell.content.appendChild(emptyState('No reports yet', 'Reports synced from Notion will appear here.', 'file'));
          return;
        }

        // Group by week descending
        var byWeek = {};
        reports.forEach(function (r) {
          var w = 'Week ' + (r.week_number || '?');
          if (!byWeek[w]) byWeek[w] = [];
          byWeek[w].push(r);
        });

        Object.keys(byWeek).sort(function (a, b) {
          var na = parseInt(a.replace(/\D/g, ''), 10);
          var nb = parseInt(b.replace(/\D/g, ''), 10);
          return nb - na;
        }).forEach(function (week) {
          var rows = byWeek[week].map(function (r) {
            var concern = r.pastoral_concern === 1 || r.pastoral_concern === true;
            return row({
              iconNode: el('div', {
                className: 'wl-row-icon',
                html: icon('file'),
                style: {
                  background: concern ? 'rgba(255,69,58,0.2)' : 'rgba(10,132,255,0.2)',
                  color: concern ? '#FF453A' : '#0A84FF'
                }
              }),
              title: r.group_code || r.group_name || 'Group',
              subtitle: (r.celebration_point || '') + ' · Attendance: ' + (r.attendance_count || 0),
              badges: concern ? [{ type: 'inactive', text: 'Concern' }] : [],
              onClick: function () {
                openReportDetail(r);
              }
            });
          });
          shell.content.appendChild(section(week.toUpperCase(), rows));
        });
      }).catch(function () {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Network error', 'Check your connection.', 'warning'));
      });

      return { destroy: function () {} };
    }
  };


  // ─── WEEKLY REPORT DETAIL (bottom sheet) ──────────────
  function openReportDetail(r) {
    var body = el('div', { style: { padding: '0 4px' } });

    var infoItems = [
      { label: 'Group', value: r.group_code || r.group_name || '—' },
      { label: 'Week', value: r.week_number ? 'Week ' + r.week_number : '—' },
      { label: 'Campus', value: r.celebration_point || '—' },
      { label: 'Attendance', value: r.attendance_count != null ? String(r.attendance_count) : '—' },
      { label: 'Engagement', value: r.engagement_level || '—' }
    ];
    infoItems.forEach(function (item) {
      var row = el('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' } });
      row.appendChild(el('span', { style: { color: 'rgba(255,255,255,0.5)', fontSize: '14px' }, text: item.label }));
      row.appendChild(el('span', { style: { color: 'rgba(255,255,255,0.92)', fontSize: '14px', fontWeight: '500' }, text: item.value }));
      body.appendChild(row);
    });

    if (r.key_themes) {
      body.appendChild(el('div', { style: { marginTop: '16px' } }, [
        el('div', { style: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase' }, text: 'Key Themes' }),
        el('p', { style: { fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', margin: '0' }, text: r.key_themes })
      ]));
    }
    if (r.formation_evidence) {
      body.appendChild(el('div', { style: { marginTop: '12px' } }, [
        el('div', { style: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase' }, text: 'Formation Evidence' }),
        el('p', { style: { fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', margin: '0' }, text: r.formation_evidence })
      ]));
    }
    if (r.pastoral_concerns) {
      body.appendChild(el('div', { style: { marginTop: '12px' } }, [
        el('div', { style: { fontSize: '12px', fontWeight: '600', color: '#FF453A', marginBottom: '6px', textTransform: 'uppercase' }, text: 'Pastoral Concerns' }),
        el('p', { style: { fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', margin: '0' }, text: r.pastoral_concerns })
      ]));
    }

    openSheet({ title: 'Report Details', body: body });
  }


  // ═══════════════════════════════════════════════════════
  //  PAGE: ATTENDANCE (/attendance)
  // ═══════════════════════════════════════════════════════
  PAGES['/attendance'] = {
    title: 'Attendance',
    render: function (root) {
      var shell = pageShell('Attendance', 'Select a group to check in');
      root.appendChild(shell.page);

      shell.content.appendChild(loadingState());

      api('GET', '/api/formation-groups').then(function (data) {
        shell.content.innerHTML = '';
        var groups = Array.isArray(data) ? data : (data.groups || []);
        if (groups.length === 0) {
          shell.content.appendChild(emptyState('No groups', 'Create a group first.', 'group'));
          return;
        }
        // Sort by campus then code
        groups.sort(function (a, b) {
          var ca = (a.celebration_point || '').localeCompare(b.celebration_point || '');
          if (ca !== 0) return ca;
          return (a.group_code || '').localeCompare(b.group_code || '');
        });

        var byCampus = {};
        groups.forEach(function (g) {
          var cp = g.celebration_point || 'Unassigned';
          if (!byCampus[cp]) byCampus[cp] = [];
          byCampus[cp].push(g);
        });

        Object.keys(byCampus).forEach(function (campus) {
          var rows = byCampus[campus].map(function (g) {
            var iconNode = el('div', {
              className: 'wl-row-icon',
              html: icon('check'),
              style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' }
            });
            return row({
              iconNode: iconNode,
              title: g.group_code || g.name,
              subtitle: (g.facilitator_name || 'No facilitator') + ' · ' + (g.member_count || 0) + ' members',
              onClick: function () {
                navigateTo('/attendance/' + g.id);
              }
            });
          });
          shell.content.appendChild(section(campus.toUpperCase(), rows));
        });
      }).catch(function () {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Network error', '', 'warning'));
      });

      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: ATTENDANCE DETAIL (/attendance/:groupId)
  // ═══════════════════════════════════════════════════════
  function renderAttendanceDetail(groupId, root) {
    var shell = pageShell('Attendance', 'Loading…');
    root.appendChild(shell.page);
    shell.content.appendChild(loadingState());

    var members = [];
    var sessions = [];
    var groupInfo = null;

    Promise.all([
      api('GET', '/api/attendance/group/' + groupId + '/members'),
      api('GET', '/api/attendance/group/' + groupId + '/sessions'),
      api('GET', '/api/formation-groups/' + groupId)
    ]).then(function (results) {
      members = (results[0] && results[0].members) || [];
      sessions = (results[1] && results[1].sessions) || [];
      groupInfo = results[2] || {};

      var groupName = groupInfo.group_code || groupInfo.name || 'Group';
      shell.header.querySelector('.wl-page-large-title').textContent = groupName;
      var sub = shell.header.querySelector('.wl-page-subtitle');
      if (sub) sub.textContent = members.length + ' members · ' + sessions.length + ' sessions';

      renderContent();
    }).catch(function () {
      shell.content.innerHTML = '';
      shell.content.appendChild(emptyState('Network error', '', 'warning'));
    });

    function renderContent() {
      shell.content.innerHTML = '';

      // New Session button
      var newSessionRow = row({
        iconNode: el('div', { className: 'wl-row-icon', html: icon('plus'), style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' } }),
        title: 'New Check-in',
        subtitle: 'Start a new attendance session',
        onClick: function () { openCheckinSheet(); }
      });
      shell.content.appendChild(section('ACTIONS', [newSessionRow]));

      // Past sessions
      if (sessions.length) {
        var sessionRows = sessions.sort(function (a, b) { return new Date(b.session_date) - new Date(a.session_date); }).map(function (sess) {
          var d = sess.session_date ? new Date(sess.session_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
          var att = sess.attendance_count != null ? sess.attendance_count : '?';
          var total = sess.member_count || members.length || '?';
          var didNotMeet = sess.did_not_meet;
          return row({
            iconNode: el('div', {
              className: 'wl-row-icon',
              html: icon(didNotMeet ? 'x' : 'check'),
              style: { background: didNotMeet ? 'rgba(255,69,58,0.2)' : 'rgba(48,209,88,0.2)', color: didNotMeet ? '#FF453A' : '#30D158' }
            }),
            title: d + (sess.week_number ? ' · Week ' + sess.week_number : ''),
            subtitle: didNotMeet ? 'Did not meet' : att + '/' + total + ' attended',
            onClick: function () { openSessionDetail(sess); }
          });
        });
        shell.content.appendChild(section('PAST SESSIONS', sessionRows));
      }

      // Member summary
      if (members.length) {
        var memberRows = members.filter(function (m) { return m.active !== 0; }).map(function (m) {
          return row({
            avatar: avatarNode({ name: m.student_name || 'Unknown', profile_image: null }),
            title: m.student_name || 'Unknown',
            subtitle: m.student_email || '',
            chevron: false
          });
        });
        shell.content.appendChild(section('MEMBERS (' + memberRows.length + ')', memberRows));
      }
    }

    function openCheckinSheet() {
      var body = el('div', { className: 'wl-form' });

      var dateInput = el('input', { className: 'wl-form-input', attrs: { type: 'date', value: new Date().toISOString().split('T')[0] } });
      body.appendChild(formGroup('Session Date', dateInput));

      var didNotMeetWrap = el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' } });
      didNotMeetWrap.appendChild(el('span', { style: { fontSize: '15px', color: 'rgba(255,255,255,0.8)' }, text: 'Group did not meet' }));
      var didNotMeetToggle = el('input', { attrs: { type: 'checkbox' } });
      didNotMeetWrap.appendChild(didNotMeetToggle);
      body.appendChild(didNotMeetWrap);

      // Member checklist
      var checklistWrap = el('div', { id: 'wl-checkin-list' });
      var activeMembers = members.filter(function (m) { return m.active !== 0; });
      var memberChecks = {};
      activeMembers.forEach(function (m) {
        memberChecks[m.id] = true; // default all present
        var mRow = el('div', {
          style: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }
        });
        var cb = el('div', {
          style: { width: '28px', height: '28px', borderRadius: '14px', background: '#30D158', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: '0', transition: 'background 0.2s' },
          html: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        });
        mRow.appendChild(cb);
        mRow.appendChild(el('div', { text: m.student_name || 'Unknown', style: { fontSize: '15px', color: 'rgba(255,255,255,0.9)' } }));
        mRow.addEventListener('click', function () {
          memberChecks[m.id] = !memberChecks[m.id];
          cb.style.background = memberChecks[m.id] ? '#30D158' : 'rgba(255,255,255,0.15)';
          cb.innerHTML = memberChecks[m.id]
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : '';
        });
        checklistWrap.appendChild(mRow);
      });
      body.appendChild(el('div', { style: { marginTop: '8px' } }, [
        el('div', { style: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }, text: 'Mark Attendance' }),
        checklistWrap
      ]));

      // Toggle visibility of checklist when "did not meet"
      didNotMeetToggle.addEventListener('change', function () {
        checklistWrap.style.display = didNotMeetToggle.checked ? 'none' : '';
      });

      var sheet = openSheet({
        title: 'New Check-in',
        body: body,
        doneLabel: 'Save',
        onDone: function () {
          var dateVal = dateInput.value;
          if (!dateVal) { toast('Select a date'); return false; }

          // 1. Create session
          api('POST', '/api/attendance/group/' + groupId + '/sessions', {
            session_date: dateVal,
            did_not_meet: didNotMeetToggle.checked ? 1 : 0
          }).then(function (res) {
            if (!res.success) { toast(res.message || 'Failed to create session'); return; }
            var sessionId = res.sessionId;

            if (didNotMeetToggle.checked) {
              toast('Session recorded (did not meet)');
              reloadPage();
              return;
            }

            // 2. Submit attendance
            var attendance = activeMembers.map(function (m) {
              return { group_member_id: m.id, attended: memberChecks[m.id] ? 1 : 0 };
            });
            api('POST', '/api/attendance/sessions/' + sessionId + '/checkin', { attendance: attendance }).then(function (r2) {
              if (r2.success) {
                toast(r2.attendedCount + '/' + activeMembers.length + ' checked in');
                reloadPage();
              } else {
                toast(r2.message || 'Check-in failed');
              }
            });
          });
          return true;
        }
      });
    }

    function openSessionDetail(sess) {
      api('GET', '/api/attendance/sessions/' + sess.id).then(function (data) {
        if (!data.success) { toast('Failed to load session'); return; }
        var body = el('div', { style: { padding: '0 4px' } });

        var d = sess.session_date ? new Date(sess.session_date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—';
        body.appendChild(el('div', { style: { fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }, text: d }));

        if (sess.did_not_meet) {
          body.appendChild(el('div', { style: { padding: '16px', background: 'rgba(255,69,58,0.1)', borderRadius: '12px', color: '#FF453A', textAlign: 'center', fontSize: '15px', fontWeight: '500' }, text: 'Group did not meet' }));
        } else {
          var att = data.attendance || [];
          att.forEach(function (a) {
            var aRow = el('div', { style: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } });
            var indicator = el('div', {
              style: { width: '10px', height: '10px', borderRadius: '5px', background: a.attended ? '#30D158' : '#FF453A', marginRight: '12px', flexShrink: '0' }
            });
            aRow.appendChild(indicator);
            aRow.appendChild(el('div', { text: a.student_name || 'Unknown', style: { fontSize: '15px', color: 'rgba(255,255,255,0.9)' } }));
            aRow.appendChild(el('div', { text: a.attended ? 'Present' : 'Absent', style: { fontSize: '13px', color: a.attended ? '#30D158' : '#FF453A', marginLeft: 'auto' } }));
            body.appendChild(aRow);
          });
        }

        openSheet({ title: 'Session Details', body: body });
      });
    }

    function reloadPage() {
      Promise.all([
        api('GET', '/api/attendance/group/' + groupId + '/members'),
        api('GET', '/api/attendance/group/' + groupId + '/sessions')
      ]).then(function (results) {
        members = (results[0] && results[0].members) || [];
        sessions = (results[1] && results[1].sessions) || [];
        renderContent();
      });
    }

    return { destroy: function () {} };
  }


  // ═══════════════════════════════════════════════════════
  //  PAGE: CHECKPOINTS
  // ═══════════════════════════════════════════════════════
  PAGES['/checkpoints'] = {
    title: 'Checkpoints',
    render: function (root) {
      var shell = pageShell('Checkpoints', 'Discernment milestones');
      root.appendChild(shell.page);
      shell.content.appendChild(loadingState());

      api('GET', '/api/checkpoints').then(function (data) {
        shell.content.innerHTML = '';
        var items = Array.isArray(data) ? data : (data.checkpoints || []);
        if (items.length === 0) {
          shell.content.appendChild(emptyState('No checkpoints', 'Generated at weeks 4, 8, and 13.', 'calendar'));
          return;
        }
        var rows = items.map(function (c) {
          return row({
            iconNode: el('div', {
              className: 'wl-row-icon',
              html: icon('calendar'),
              style: { background: 'rgba(94,92,230,0.2)', color: '#5E5CE6' }
            }),
            title: (c.group_code || 'Group') + ' · Week ' + (c.week_number || '?'),
            subtitle: (c.status || 'Pending') + (c.celebration_point ? ' · ' + c.celebration_point : ''),
            onClick: function () { openCheckpointDetail(c); }
          });
        });
        shell.content.appendChild(section('ALL CHECKPOINTS', rows));
      }).catch(function () {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Network error', '', 'warning'));
      });

      return { destroy: function () {} };
    }
  };


  // ─── CHECKPOINT DETAIL (bottom sheet) ──────────────────
  function openCheckpointDetail(c) {
    api('GET', '/api/checkpoints/' + c.id).then(function (data) {
      if (!data.success) { toast('Could not load checkpoint'); return; }
      var cp = data.checkpoint || c;
      var cpMembers = data.members || [];

      var body = el('div', { style: { padding: '0 4px' } });

      var fields = [
        { label: 'Group', value: cp.group_code || cp.group_name || '—' },
        { label: 'Week', value: cp.week_number ? 'Week ' + cp.week_number : '—' },
        { label: 'Campus', value: cp.celebration_point || '—' },
        { label: 'Status', value: cp.status || 'Pending' },
        { label: 'Facilitator', value: cp.facilitator_name || '—' }
      ];
      if (cp.reviewer_name) fields.push({ label: 'Reviewed by', value: cp.reviewer_name });

      fields.forEach(function (f) {
        var r = el('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' } });
        r.appendChild(el('span', { style: { color: 'rgba(255,255,255,0.5)', fontSize: '14px' }, text: f.label }));
        r.appendChild(el('span', { style: { color: 'rgba(255,255,255,0.92)', fontSize: '14px', fontWeight: '500' }, text: f.value }));
        body.appendChild(r);
      });

      if (cp.review_notes) {
        body.appendChild(el('div', { style: { marginTop: '16px' } }, [
          el('div', { style: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase' }, text: 'Review Notes' }),
          el('p', { style: { fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', margin: '0' }, text: cp.review_notes })
        ]));
      }

      if (cpMembers.length) {
        body.appendChild(el('div', { style: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase' }, text: 'Members (' + cpMembers.length + ')' }));
        cpMembers.forEach(function (m) {
          var name = ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || m.email || 'Unknown';
          body.appendChild(el('div', { style: { padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }, text: name }));
        });
      }

      // Review action (for coordinators/pastors/admins)
      fetchSession().then(function (user) {
        if (user && (user.role === 'Admin' || user.role === 'Coordinator' || user.role === 'Pastor') && cp.status !== 'reviewed') {
          var reviewBtn = el('button', {
            className: 'wl-btn wl-btn-primary wl-btn-block',
            text: 'Mark as Reviewed',
            style: { marginTop: '20px' },
            on: {
              click: function () {
                api('PUT', '/api/checkpoints/' + c.id + '/review', { status: 'reviewed' }).then(function (res) {
                  if (res.success) toast('Checkpoint reviewed');
                  else toast(res.message || 'Failed');
                });
              }
            }
          });
          body.appendChild(reviewBtn);
        }
      });

      openSheet({ title: 'Checkpoint Details', body: body });
    }).catch(function () {
      toast('Network error');
    });
  }


  // ═══════════════════════════════════════════════════════
  //  PAGE: AUDIT LOG
  // ═══════════════════════════════════════════════════════
  PAGES['/audit'] = {
    title: 'Audit',
    render: function (root) {
      var shell = pageShell('Audit Log');
      root.appendChild(shell.page);
      shell.content.appendChild(loadingState());

      api('GET', '/api/admin/audit').then(function (data) {
        shell.content.innerHTML = '';
        var logs = Array.isArray(data) ? data : (data.logs || []);
        if (logs.length === 0) {
          shell.content.appendChild(emptyState('No activity', 'Admin actions will appear here.', 'file'));
          return;
        }
        var rows = logs.slice(0, 100).map(function (l) {
          return row({
            iconNode: el('div', {
              className: 'wl-row-icon',
              html: icon('info'),
              style: { background: 'rgba(10,132,255,0.2)', color: '#0A84FF' }
            }),
            title: l.action || 'Action',
            subtitle: (l.user_name || 'Unknown') + ' · ' + (l.created_at || ''),
            chevron: false
          });
        });
        shell.content.appendChild(section('RECENT ACTIVITY', rows));
      }).catch(function () {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Network error', '', 'warning'));
      });

      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: SETTINGS
  // ═══════════════════════════════════════════════════════
  PAGES['/settings'] = {
    title: 'Settings',
    render: function (root) {
      var shell = pageShell('Settings');
      root.appendChild(shell.page);

      fetchSession().then(function (user) {
        if (!user) {
          shell.content.appendChild(emptyState('Not signed in', '', 'warning'));
          return;
        }

        // Profile card
        var profileCard = el('div', { className: 'wl-card', style: { textAlign: 'center', padding: '24px 16px' } });
        var av = avatarNode({ name: user.name, profile_image: user.profile_image });
        av.style.width = '64px';
        av.style.height = '64px';
        av.style.fontSize = '24px';
        av.style.margin = '0 auto 12px';
        profileCard.appendChild(av);
        profileCard.appendChild(el('div', { style: { fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.92)' }, text: user.name || user.username }));
        profileCard.appendChild(el('div', { style: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }, text: (user.role || '') + (user.celebration_point ? ' · ' + user.celebration_point : '') }));
        shell.content.appendChild(profileCard);

        // Account section
        var accountRows = [
          row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('edit'), style: { background: 'rgba(10,132,255,0.2)', color: '#0A84FF' } }),
            title: 'Edit Profile',
            subtitle: 'Change your name',
            onClick: function () {
              var body = el('div', { className: 'wl-form' });
              var nameInput = el('input', { className: 'wl-form-input', attrs: { type: 'text', value: user.name || '', placeholder: 'Full name' } });
              body.appendChild(formGroup('Name', nameInput));
              openSheet({
                title: 'Edit Profile',
                body: body,
                doneLabel: 'Save',
                onDone: function () {
                  var newName = nameInput.value.trim();
                  if (!newName) { toast('Name required'); return false; }
                  api('PUT', '/api/auth/profile', { name: newName }).then(function (res) {
                    if (res.success) {
                      toast('Profile updated');
                      _userSession = res.user || null;
                      navigateTo('/settings');
                    } else {
                      toast(res.message || 'Failed');
                    }
                  });
                  return true;
                }
              });
            }
          }),
          row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('lock'), style: { background: 'rgba(255,159,10,0.2)', color: '#FF9F0A' } }),
            title: 'Change Password',
            subtitle: 'Update your password',
            onClick: function () {
              var body = el('div', { className: 'wl-form' });
              var pwInput = el('input', { className: 'wl-form-input', attrs: { type: 'password', placeholder: 'New password', autocomplete: 'new-password' } });
              var pw2Input = el('input', { className: 'wl-form-input', attrs: { type: 'password', placeholder: 'Confirm password', autocomplete: 'new-password' } });
              body.appendChild(formGroup('New Password', pwInput));
              body.appendChild(formGroup('Confirm', pw2Input));
              openSheet({
                title: 'Change Password',
                body: body,
                doneLabel: 'Save',
                onDone: function () {
                  if (!pwInput.value) { toast('Enter a password'); return false; }
                  if (pwInput.value !== pw2Input.value) { toast('Passwords don\'t match'); return false; }
                  api('PUT', '/api/auth/profile', { password: pwInput.value }).then(function (res) {
                    if (res.success) toast('Password changed');
                    else toast(res.message || 'Failed');
                  });
                  return true;
                }
              });
            }
          })
        ];
        shell.content.appendChild(section('ACCOUNT', accountRows));

        // Notifications
        var notifRows = [
          row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('bell'), style: { background: 'rgba(94,92,230,0.2)', color: '#5E5CE6' } }),
            title: 'Notifications',
            subtitle: 'View your notifications',
            onClick: function () { navigateTo('/notifications'); }
          })
        ];
        shell.content.appendChild(section('NOTIFICATIONS', notifRows));

        // Data section (admin only)
        if (user.role === 'Admin') {
          var adminRows = [
            row({
              iconNode: el('div', { className: 'wl-row-icon', html: icon('refresh'), style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' } }),
              title: 'Refresh Data',
              subtitle: 'Re-sync from Thinkific',
              onClick: function () {
                api('POST', '/api/data/refresh').then(function (res) {
                  toast(res.message || 'Data refresh started');
                });
              }
            }),
            row({
              iconNode: el('div', { className: 'wl-row-icon', html: icon('settings'), style: { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' } }),
              title: 'System Settings',
              subtitle: 'Notion config (desktop recommended)',
              onClick: function () {
                toast('Use desktop for system settings');
              }
            })
          ];
          shell.content.appendChild(section('ADMIN', adminRows));
        }

        // Sign out
        var actionRows = [
          row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('x'), style: { background: 'rgba(255,69,58,0.2)', color: '#FF453A' } }),
            title: 'Sign Out',
            chevron: false,
            onClick: function () {
              api('POST', '/api/auth/logout').then(function () {
                _userSession = null;
                location.href = '/login';
              });
            }
          })
        ];
        shell.content.appendChild(section('', actionRows));
      });

      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: TECH SUPPORT
  // ═══════════════════════════════════════════════════════
  PAGES['/tech-support'] = {
    title: 'Tech Support',
    render: function (root) {
      var shell = pageShell('Tech Support', 'Password resets & user fixes');
      root.appendChild(shell.page);

      // Lookup section
      var lookupCard = el('div', { className: 'wl-card' });
      lookupCard.appendChild(el('div', { className: 'wl-card-title', text: 'Student Lookup' }));
      var lookupInput = el('input', { className: 'wl-form-input', attrs: { type: 'text', placeholder: 'Enter Thinkific User ID' } });
      var lookupBtn = el('button', { className: 'wl-btn wl-btn-primary', text: 'Look Up', style: { marginTop: '8px', width: '100%' } });
      lookupCard.appendChild(formGroup('Thinkific ID', lookupInput));
      lookupCard.appendChild(lookupBtn);
      shell.content.appendChild(lookupCard);

      var resultArea = el('div');
      shell.content.appendChild(resultArea);

      lookupBtn.addEventListener('click', function () {
        var tid = lookupInput.value.trim();
        if (!tid) { toast('Enter a Thinkific ID'); return; }
        resultArea.innerHTML = '';
        resultArea.appendChild(loadingState());

        api('GET', '/api/tech-support/lookup/' + encodeURIComponent(tid)).then(function (data) {
          resultArea.innerHTML = '';
          if (!data || data.error) {
            resultArea.appendChild(emptyState('Not found', data ? data.message || data.error : 'User not found', 'warning'));
            return;
          }

          var user = data;
          var name = ((user.first_name || '') + ' ' + (user.last_name || '')).trim() || user.email || 'Unknown';

          // User info card
          var infoCard = el('div', { className: 'wl-card' });
          infoCard.appendChild(el('div', { className: 'wl-card-title', text: name }));
          var infoBody = '';
          if (user.email) infoBody += '<div><strong>Email:</strong> ' + user.email + '</div>';
          if (user.id) infoBody += '<div><strong>Thinkific ID:</strong> ' + user.id + '</div>';
          infoCard.appendChild(el('div', { className: 'wl-card-body', html: infoBody }));
          resultArea.appendChild(infoCard);

          // Actions
          var actions = [];

          // Update name
          actions.push(row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('edit'), style: { background: 'rgba(10,132,255,0.2)', color: '#0A84FF' } }),
            title: 'Update Name',
            subtitle: 'Fix first or last name on Thinkific',
            onClick: function () {
              var body = el('div', { className: 'wl-form' });
              var firstInput = el('input', { className: 'wl-form-input', attrs: { type: 'text', value: user.first_name || '', placeholder: 'First name' } });
              var lastInput = el('input', { className: 'wl-form-input', attrs: { type: 'text', value: user.last_name || '', placeholder: 'Last name' } });
              body.appendChild(formGroup('First Name', firstInput));
              body.appendChild(formGroup('Last Name', lastInput));
              openSheet({
                title: 'Update Name',
                body: body,
                doneLabel: 'Save',
                onDone: function () {
                  api('PUT', '/api/tech-support/name/' + tid, {
                    first_name: firstInput.value.trim(),
                    last_name: lastInput.value.trim()
                  }).then(function (res) {
                    if (res.success) toast('Name updated');
                    else toast(res.message || 'Failed');
                  });
                  return true;
                }
              });
            }
          }));

          // Reset password
          actions.push(row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('key'), style: { background: 'rgba(255,69,58,0.2)', color: '#FF453A' } }),
            title: 'Reset Password',
            subtitle: 'Generate a temporary password',
            onClick: function () {
              confirmDialog('Reset password for ' + name + '? A temporary password will be generated.', function () {
                api('POST', '/api/tech-support/reset-password/' + tid).then(function (res) {
                  if (res.success) {
                    var body = el('div', { style: { padding: '8px 4px' } });
                    body.appendChild(el('p', { style: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }, text: 'Temporary password for ' + (res.studentName || name) + ':' }));
                    var pwBox = el('div', {
                      style: { background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center', fontSize: '20px', fontWeight: '700', color: '#30D158', letterSpacing: '2px', fontFamily: 'monospace' },
                      text: res.tempPassword
                    });
                    body.appendChild(pwBox);
                    if (res.studentEmail) {
                      body.appendChild(el('p', { style: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '12px', textAlign: 'center' }, text: 'Email: ' + res.studentEmail }));
                    }
                    openSheet({ title: 'Password Reset', body: body });
                  } else {
                    toast(res.message || 'Reset failed');
                  }
                });
              });
            }
          }));

          resultArea.appendChild(section('ACTIONS', actions));
        }).catch(function () {
          resultArea.innerHTML = '';
          resultArea.appendChild(emptyState('Network error', '', 'warning'));
        });
      });

      // Audit log
      var auditSection = el('div');
      shell.content.appendChild(auditSection);
      api('GET', '/api/tech-support/audit-log').then(function (data) {
        var logs = (data && data.logs) || [];
        if (logs.length) {
          var logRows = logs.slice(0, 20).map(function (l) {
            return row({
              iconNode: el('div', { className: 'wl-row-icon', html: icon('info'), style: { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' } }),
              title: l.action || 'Action',
              subtitle: (l.actor_name || '') + ' · ' + (l.created_at ? new Date(l.created_at).toLocaleDateString() : ''),
              chevron: false
            });
          });
          auditSection.appendChild(section('RECENT ACTIVITY', logRows));
        }
      }).catch(function () {});

      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: IMPORT / BATCH
  // ═══════════════════════════════════════════════════════
  PAGES['/import'] = {
    title: 'Batch Tool',
    render: function (root) {
      var shell = pageShell('Batch Tool', 'CSV imports');
      root.appendChild(shell.page);
      shell.content.appendChild(emptyState('Desktop Only', 'Bulk imports require a larger screen.', 'info'));
      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: EXPORTS
  // ═══════════════════════════════════════════════════════
  PAGES['/exports'] = {
    title: 'Exports',
    render: function (root) {
      var shell = pageShell('Exports', 'Download reports');
      root.appendChild(shell.page);

      var rows = [
        row({
          iconNode: el('div', { className: 'wl-row-icon', html: icon('file'), style: { background: 'rgba(10,132,255,0.2)', color: '#0A84FF' } }),
          title: 'Campus Roster CSV',
          subtitle: 'All students with progress',
          onClick: function () { window.location.href = '/api/exports/campus/roster'; }
        }),
        row({
          iconNode: el('div', { className: 'wl-row-icon', html: icon('file'), style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' } }),
          title: 'Weekly Reports CSV',
          subtitle: 'Current cohort reports',
          onClick: function () { window.location.href = '/api/exports/campus/weekly-reports'; }
        }),
        row({
          iconNode: el('div', { className: 'wl-row-icon', html: icon('file'), style: { background: 'rgba(255,69,58,0.2)', color: '#FF453A' } }),
          title: 'Risk Report CSV',
          subtitle: 'At-risk students',
          onClick: function () { window.location.href = '/api/exports/campus/risk'; }
        }),
        row({
          iconNode: el('div', { className: 'wl-row-icon', html: icon('file'), style: { background: 'rgba(94,92,230,0.2)', color: '#5E5CE6' } }),
          title: 'Checkpoints CSV',
          subtitle: 'Discernment checkpoints',
          onClick: function () { window.location.href = '/api/exports/campus/checkpoints'; }
        }),
        row({
          iconNode: el('div', { className: 'wl-row-icon', html: icon('file'), style: { background: 'rgba(255,159,10,0.2)', color: '#FF9F0A' } }),
          title: 'Attendance CSV',
          subtitle: 'Session attendance records',
          onClick: function () { window.location.href = '/api/exports/campus/attendance'; }
        })
      ];
      shell.content.appendChild(section('DOWNLOADS', rows));
      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: REPORTS (analytics summary)
  // ═══════════════════════════════════════════════════════
  PAGES['/reports'] = {
    title: 'Analytics',
    render: function (root) {
      var shell = pageShell('Analytics', 'Formation & engagement');
      root.appendChild(shell.page);

      shell.content.appendChild(loadingState());

      api('GET', '/api/formation-dashboard').then(function (data) {
        shell.content.innerHTML = '';
        if (!data) {
          shell.content.appendChild(emptyState('No data', 'Analytics unavailable.', 'info'));
          return;
        }

        // Stat grid
        var stats = el('div', { className: 'wl-stat-grid' });
        var totalGroups = (data.groups && data.groups.length) || 0;
        var reportedGroups = (data.groups || []).filter(function (g) { return g.latest_week; }).length;
        var pastoralCount = (data.pastoralConcerns && data.pastoralConcerns.length) || 0;
        var evidenceCount = (data.formationEvidence && data.formationEvidence.length) || 0;

        stats.appendChild(el('div', { className: 'wl-stat' }, [
          el('div', { className: 'wl-stat-label', text: 'Total Groups' }),
          el('div', { className: 'wl-stat-value', text: String(totalGroups) })
        ]));
        stats.appendChild(el('div', { className: 'wl-stat' }, [
          el('div', { className: 'wl-stat-label', text: 'Reporting' }),
          el('div', { className: 'wl-stat-value', text: reportedGroups + '/' + totalGroups }),
          el('div', { className: 'wl-stat-sub', text: totalGroups ? Math.round((reportedGroups / totalGroups) * 100) + '%' : '' })
        ]));
        stats.appendChild(el('div', { className: 'wl-stat' }, [
          el('div', { className: 'wl-stat-label', text: 'Concerns' }),
          el('div', { className: 'wl-stat-value', text: String(pastoralCount), style: { color: pastoralCount > 0 ? '#FF9F0A' : undefined } })
        ]));
        stats.appendChild(el('div', { className: 'wl-stat' }, [
          el('div', { className: 'wl-stat-label', text: 'Evidence' }),
          el('div', { className: 'wl-stat-value', text: String(evidenceCount), style: { color: '#30D158' } })
        ]));
        shell.content.appendChild(stats);

        // Pastoral concerns
        if (data.pastoralConcerns && data.pastoralConcerns.length) {
          var concernRows = data.pastoralConcerns.slice(0, 8).map(function (c) {
            return row({
              iconNode: el('div', {
                className: 'wl-row-icon',
                html: icon('warning'),
                style: { background: 'rgba(255,69,58,0.2)', color: '#FF453A' }
              }),
              title: (c.group_code || 'Group') + ' · Week ' + (c.week_number || '?'),
              subtitle: (c.facilitator_name || '') + ' — ' + (c.pastoral_concerns || '').slice(0, 60) + '…',
              chevron: false
            });
          });
          shell.content.appendChild(section('PASTORAL CONCERNS', concernRows));
        }

        // Formation evidence
        if (data.formationEvidence && data.formationEvidence.length) {
          var evRows = data.formationEvidence.slice(0, 6).map(function (e) {
            return row({
              iconNode: el('div', {
                className: 'wl-row-icon',
                html: icon('check'),
                style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' }
              }),
              title: (e.group_code || 'Group') + ' · Week ' + (e.week_number || '?'),
              subtitle: (e.formation_evidence || '').slice(0, 60) + '…',
              chevron: false
            });
          });
          shell.content.appendChild(section('FORMATION EVIDENCE', evRows));
        }
      }).catch(function () {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Network error', '', 'warning'));
      });

      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: NOTIFICATIONS
  // ═══════════════════════════════════════════════════════
  PAGES['/notifications'] = {
    title: 'Notifications',
    render: function (root) {
      var shell = pageShell('Notifications');
      root.appendChild(shell.page);
      shell.content.appendChild(loadingState());

      api('GET', '/api/notifications').then(function (data) {
        shell.content.innerHTML = '';
        var notifs = (data && data.notifications) || [];
        if (notifs.length === 0) {
          shell.content.appendChild(emptyState('No notifications', 'You\'re all caught up.', 'bell'));
          return;
        }

        // Mark all read button
        var unread = notifs.filter(function (n) { return !n.read_at; });
        if (unread.length) {
          var markAllRow = row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('check'), style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' } }),
            title: 'Mark All as Read',
            subtitle: unread.length + ' unread',
            onClick: function () {
              api('POST', '/api/notifications/mark-read', { all: true }).then(function () {
                toast('All marked as read');
                navigateTo('/notifications');
              });
            }
          });
          shell.content.appendChild(section('', [markAllRow]));
        }

        var notifRows = notifs.map(function (n) {
          var isUnread = !n.read_at;
          return row({
            iconNode: el('div', {
              className: 'wl-row-icon',
              html: icon(n.type === 'concern' ? 'warning' : 'bell'),
              style: {
                background: isUnread ? 'rgba(10,132,255,0.2)' : 'rgba(255,255,255,0.08)',
                color: isUnread ? '#0A84FF' : 'rgba(255,255,255,0.4)'
              }
            }),
            title: n.title || n.message || 'Notification',
            subtitle: (n.message && n.title ? n.message.slice(0, 60) : '') + (n.created_at ? ' · ' + new Date(n.created_at).toLocaleDateString() : ''),
            chevron: false,
            onClick: function () {
              if (isUnread) {
                api('POST', '/api/notifications/mark-read', { id: n.id });
              }
            }
          });
        });
        shell.content.appendChild(section('ALL NOTIFICATIONS', notifRows));
      }).catch(function () {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Network error', '', 'warning'));
      });

      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  PAGE: OVERVIEW (mobile Dashboard app)
  // ═══════════════════════════════════════════════════════
  PAGES['/overview'] = {
    title: 'Overview',
    render: function (root) {
      var shell = pageShell('Overview');
      root.appendChild(shell.page);

      // Greeting subtitle using session
      fetchSession().then(function (user) {
        var hour = new Date().getHours();
        var greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        var name = user ? (user.name || user.username || '') : '';
        var sub = el('p', {
          className: 'wl-page-subtitle',
          text: greet + (name ? ', ' + name.split(' ')[0] : '') + ' · ' + new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
        });
        shell.header.appendChild(sub);
      });

      shell.content.appendChild(loadingState());

      // Pull data from students, formation groups, and formation dashboard in parallel
      Promise.all([
        api('GET', '/api/data/students').catch(function () { return null; }),
        api('GET', '/api/formation-groups').catch(function () { return null; }),
        api('GET', '/api/formation-dashboard').catch(function () { return null; })
      ]).then(function (results) {
        shell.content.innerHTML = '';

        var studentData = results[0] || {};
        var groupsData = results[1] || [];
        var dashData = results[2] || {};

        var students = studentData.students || [];
        var studentStats = studentData.stats || {};
        var groups = Array.isArray(groupsData) ? groupsData : (groupsData.groups || []);

        // ─── STAT CARDS (2x2 grid) ───
        var stats = el('div', { className: 'wl-stat-grid' });

        stats.appendChild(el('div', { className: 'wl-stat' }, [
          el('div', { className: 'wl-stat-label', text: 'Students' }),
          el('div', { className: 'wl-stat-value', text: String(students.length) }),
          el('div', { className: 'wl-stat-sub', text: (studentStats.activeCount || students.length) + ' active' })
        ]));

        stats.appendChild(el('div', { className: 'wl-stat' }, [
          el('div', { className: 'wl-stat-label', text: 'Groups' }),
          el('div', { className: 'wl-stat-value', text: String(groups.length) }),
          el('div', { className: 'wl-stat-sub', text: (new Set(groups.map(function (g) { return g.celebration_point; })).size) + ' campuses' })
        ]));

        var avgProgress = 0;
        if (students.length) {
          var total = students.reduce(function (a, s) { return a + (s.progress || s.percentage_completed || 0); }, 0);
          avgProgress = Math.round(total / students.length);
        }
        stats.appendChild(el('div', { className: 'wl-stat' }, [
          el('div', { className: 'wl-stat-label', text: 'Avg Progress' }),
          el('div', { className: 'wl-stat-value', text: avgProgress + '%' }),
          el('div', { className: 'wl-stat-sub', text: 'Across all students' })
        ]));

        var concerns = (dashData.pastoralConcerns && dashData.pastoralConcerns.length) || 0;
        stats.appendChild(el('div', { className: 'wl-stat' }, [
          el('div', { className: 'wl-stat-label', text: 'Concerns' }),
          el('div', { className: 'wl-stat-value', text: String(concerns), style: { color: concerns > 0 ? '#FF9F0A' : '#30D158' } }),
          el('div', { className: 'wl-stat-sub', text: concerns > 0 ? 'Needs attention' : 'All clear' })
        ]));

        shell.content.appendChild(stats);

        // ─── QUICK ACTIONS ───
        var quickActions = [
          row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('users'), style: { background: 'rgba(10,132,255,0.2)', color: '#0A84FF' } }),
            title: 'Students',
            subtitle: 'Browse all students',
            onClick: function () { navigateTo('/students'); }
          }),
          row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('group'), style: { background: 'rgba(94,92,230,0.2)', color: '#5E5CE6' } }),
            title: 'Groups',
            subtitle: groups.length + ' formation groups',
            onClick: function () { navigateTo('/groups'); }
          }),
          row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('calendar'), style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' } }),
            title: 'Attendance',
            subtitle: 'Check in group members',
            onClick: function () { navigateTo('/attendance'); }
          }),
          row({
            iconNode: el('div', { className: 'wl-row-icon', html: icon('file'), style: { background: 'rgba(255,159,10,0.2)', color: '#FF9F0A' } }),
            title: 'Weekly Reports',
            subtitle: 'Review formation reports',
            onClick: function () { navigateTo('/weekly-reports'); }
          })
        ];
        shell.content.appendChild(section('QUICK ACTIONS', quickActions));

        // ─── PASTORAL CONCERNS FEED ───
        if (dashData.pastoralConcerns && dashData.pastoralConcerns.length) {
          var concernRows = dashData.pastoralConcerns.slice(0, 5).map(function (c) {
            var text = (c.pastoral_concerns || '').replace(/\s+/g, ' ').trim();
            return row({
              iconNode: el('div', {
                className: 'wl-row-icon',
                html: icon('warning'),
                style: { background: 'rgba(255,69,58,0.2)', color: '#FF453A' }
              }),
              title: (c.group_code || 'Group') + ' · Week ' + (c.week_number || '?'),
              subtitle: text.length > 60 ? text.slice(0, 60) + '…' : text,
              chevron: false
            });
          });
          shell.content.appendChild(section('NEEDS ATTENTION', concernRows));
        }

        // ─── RECENT FORMATION EVIDENCE ───
        if (dashData.formationEvidence && dashData.formationEvidence.length) {
          var evRows = dashData.formationEvidence.slice(0, 5).map(function (e) {
            var text = (e.formation_evidence || '').replace(/\s+/g, ' ').trim();
            return row({
              iconNode: el('div', {
                className: 'wl-row-icon',
                html: icon('check'),
                style: { background: 'rgba(48,209,88,0.2)', color: '#30D158' }
              }),
              title: (e.group_code || 'Group') + ' · Week ' + (e.week_number || '?'),
              subtitle: text.length > 60 ? text.slice(0, 60) + '…' : text,
              chevron: false
            });
          });
          shell.content.appendChild(section('FORMATION HIGHLIGHTS', evRows));
        }

        // Empty fallback if nothing loaded at all
        if (students.length === 0 && groups.length === 0 && !concerns) {
          shell.content.appendChild(emptyState('Nothing yet', 'Data will appear here as it syncs.', 'inbox'));
        }
      }).catch(function () {
        shell.content.innerHTML = '';
        shell.content.appendChild(emptyState('Network error', 'Check your connection.', 'warning'));
      });

      return { destroy: function () {} };
    }
  };


  // ═══════════════════════════════════════════════════════
  //  ROUTER
  // ═══════════════════════════════════════════════════════
  function ensureRoot() {
    if (!_root) {
      _root = el('div', { id: 'wl-mobile-app' });
      document.body.appendChild(_root);
    }
    return _root;
  }

  function destroyCurrent() {
    if (_currentPage && _currentPage.destroy) {
      try { _currentPage.destroy(); } catch (e) {}
    }
    _currentPage = null;
    if (_root) _root.innerHTML = '';
  }

  function navigateTo(path) {
    window.history.pushState({}, '', path);
    handleRoute();
  }

  function clearPendingFlag() {
    // Lift the initial "hide #root" guard once we've decided what to render
    document.documentElement.classList.remove('wl-mobile-pending');
  }

  function handleRoute() {
    var path = window.location.pathname;
    _currentPath = path;

    // Dashboard + Login: let React (and home screen overlay) handle it
    if (isDashboard() || isLogin()) {
      document.body.classList.remove('wl-mobile-mode');
      destroyCurrent();
      clearPendingFlag();
      return;
    }

    // Group detail
    var groupDetail = path.match(/^\/groups\/(\d+)/);
    if (groupDetail) {
      document.body.classList.add('wl-mobile-mode');
      ensureRoot();
      destroyCurrent();
      _currentPage = renderGroupDetail(groupDetail[1], _root);
      window.scrollTo(0, 0);
      clearPendingFlag();
      return;
    }

    // Student detail
    var studentDetail = path.match(/^\/students\/([^/]+)/);
    if (studentDetail) {
      document.body.classList.add('wl-mobile-mode');
      ensureRoot();
      destroyCurrent();
      _currentPage = renderStudentDetail(decodeURIComponent(studentDetail[1]), _root);
      window.scrollTo(0, 0);
      clearPendingFlag();
      return;
    }

    // Attendance detail (per group)
    var attendanceDetail = path.match(/^\/attendance\/(\d+)/);
    if (attendanceDetail) {
      document.body.classList.add('wl-mobile-mode');
      ensureRoot();
      destroyCurrent();
      _currentPage = renderAttendanceDetail(attendanceDetail[1], _root);
      window.scrollTo(0, 0);
      clearPendingFlag();
      return;
    }

    // Registered pages
    var page = PAGES[path];
    if (page) {
      document.body.classList.add('wl-mobile-mode');
      ensureRoot();
      destroyCurrent();
      _currentPage = page.render(_root);
      window.scrollTo(0, 0);
      clearPendingFlag();
      return;
    }

    // Unknown route — let React handle it
    document.body.classList.remove('wl-mobile-mode');
    destroyCurrent();
    clearPendingFlag();
  }

  // ─── INIT ────────────────────────────────────────────
  function init() {
    handleRoute();

    // Listen for route changes
    window.addEventListener('popstate', handleRoute);

    // Polyfill: intercept pushState/replaceState from React Router
    var origPush = history.pushState;
    history.pushState = function () {
      var result = origPush.apply(this, arguments);
      setTimeout(handleRoute, 10);
      return result;
    };
    var origReplace = history.replaceState;
    history.replaceState = function () {
      var result = origReplace.apply(this, arguments);
      setTimeout(handleRoute, 10);
      return result;
    };

    // Fallback polling in case some router doesn't call history
    setInterval(function () {
      if (window.location.pathname !== _currentPath) handleRoute();
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
