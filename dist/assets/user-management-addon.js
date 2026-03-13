/**
 * User Management Addon — WL101 Portal
 *
 * Runtime enhancement script that injects:
 *   1. Grid/List view toggle
 *   2. Search functionality
 *   3. Dual-role (multi-permission) UI
 *
 * Uses MutationObserver to detect when the User Management page is rendered
 * and enhances the existing React-rendered DOM.
 */
(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────
  let viewMode = localStorage.getItem('userViewMode') || 'grid';
  let searchQuery = '';
  const userRolesMap = new Map();

  // ─── SVG Icons ──────────────────────────────────────────────
  const ICON_GRID = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
  </svg>`;

  const ICON_LIST = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1.5" width="14" height="3" rx="1.5" fill="currentColor"/>
    <rect x="1" y="6.5" width="14" height="3" rx="1.5" fill="currentColor"/>
    <rect x="1" y="11.5" width="14" height="3" rx="1.5" fill="currentColor"/>
  </svg>`;

  const ICON_SEARCH = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>`;

  // ─── Helpers ────────────────────────────────────────────────
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function debounce(fn, ms) {
    let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  // ─── CSS injection ──────────────────────────────────────────
  function injectStyles() {
    if (qs('#um-addon-styles')) return;
    const style = document.createElement('style');
    style.id = 'um-addon-styles';
    style.textContent = `
      /* ─ View Toggle Buttons ─ */
      .um-view-toggle {
        display: inline-flex; gap: 2px; background: var(--glass-layer-1);
        border-radius: 10px; padding: 3px; border: var(--border-layer-1);
      }
      .um-view-btn {
        width: 34px; height: 34px; border: none; border-radius: 8px; cursor: pointer;
        background: transparent; color: var(--text-secondary);
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; opacity: 0.5;
      }
      .um-view-btn:hover { background: var(--glass-layer-2); color: var(--text-primary); opacity: 0.8; }
      .um-view-btn.active {
        background: var(--glass-layer-3); color: var(--text-primary);
        box-shadow: var(--shadow-layer-2); opacity: 1;
      }
      .um-view-btn svg { pointer-events: none; }

      /* ─ Search Input ─ */
      .um-search-wrap {
        position: relative; flex: 1; max-width: 300px;
      }
      .um-search-icon {
        position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
        color: var(--text-secondary); pointer-events: none; opacity: 0.5;
        display: flex; align-items: center; justify-content: center;
        width: 14px; height: 14px;
      }
      .um-search-input {
        width: 100%; padding: 9px 14px 9px 36px; border-radius: 10px;
        background: var(--glass-layer-1); border: var(--border-layer-2);
        color: var(--text-primary); font-size: 13px; outline: none;
        box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
        font-family: inherit;
      }
      .um-search-input::placeholder { color: var(--text-secondary); opacity: 0.5; font-size: 12px; }
      .um-search-input:focus {
        border-color: rgba(74,158,255,0.4);
        box-shadow: 0 0 0 3px rgba(74,158,255,0.08);
      }
      .um-search-input:focus + .um-search-icon,
      .um-search-wrap:focus-within .um-search-icon { opacity: 0.8; }

      /* ─ List View ─ */
      .um-list-view {
        display: flex !important; flex-direction: column !important; gap: 6px !important;
      }
      .um-list-view .glass-card.user-card {
        flex-direction: row !important; align-items: center !important;
        padding: 14px 20px !important; border-radius: 12px !important; gap: 0 !important;
      }
      .um-list-view .user-card-header {
        flex: 0 0 240px !important; min-width: 0;
      }
      .um-list-view .user-card-details {
        flex: 1 !important; display: flex !important; flex-direction: row !important;
        gap: 24px !important; align-items: center !important; padding: 0 16px !important;
        background: transparent !important; border: none !important; border-radius: 0 !important;
        font-size: 13px !important;
      }
      .um-list-view .user-card-details > div {
        margin-bottom: 0 !important; white-space: nowrap; flex-shrink: 0;
      }
      .um-list-view .user-card-actions {
        flex: 0 0 auto !important; margin-top: 0 !important;
        display: flex !important; gap: 8px !important;
      }
      .um-list-view .user-card-actions button {
        padding: 6px 16px !important; font-size: 12px !important;
        border-radius: 8px !important;
      }

      /* ─ List View Header Row ─ */
      .um-list-header {
        display: flex; align-items: center; padding: 8px 20px;
        font-size: 11px; font-weight: 600; color: var(--text-secondary);
        text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6;
      }
      .um-list-header > span:nth-child(1) { flex: 0 0 240px; }
      .um-list-header > span:nth-child(2) { flex: 1; padding-left: 16px; }
      .um-list-header > span:nth-child(3) { flex: 0 0 140px; text-align: right; padding-right: 0; }

      /* ─ No Results ─ */
      .um-no-results {
        text-align: center; padding: 48px 24px; color: var(--text-secondary);
        background: var(--glass-layer-1); border-radius: 16px; border: var(--border-layer-1);
      }
      .um-no-results-icon { font-size: 40px; margin-bottom: 12px; }
      .um-no-results-text { font-size: 15px; font-weight: 500; }
      .um-no-results-sub { font-size: 13px; opacity: 0.6; margin-top: 4px; }

      /* ─ Role Badges ─ */
      .um-role-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
      .um-role-badge {
        font-size: 10px; padding: 2px 7px; border-radius: 5px;
        background: var(--glass-layer-3); color: var(--text-secondary);
        border: var(--border-layer-1); display: inline-block; font-weight: 500;
      }
      .um-role-badge.coordinator { background: rgba(102,126,234,0.15); color: #667eea; border-color: rgba(102,126,234,0.3); }
      .um-role-badge.techsupport { background: rgba(0,122,255,0.15); color: #007aff; border-color: rgba(0,122,255,0.3); }
      .um-role-badge.pastor { background: rgba(191,90,242,0.15); color: #bf5af2; border-color: rgba(191,90,242,0.3); }
      .um-role-badge.admin { background: rgba(255,69,58,0.15); color: #ff453a; border-color: rgba(255,69,58,0.3); }
      .um-role-badge.leadershipteam { background: rgba(255,214,10,0.15); color: #ffd60a; border-color: rgba(255,214,10,0.3); }
      .um-role-badge.facilitator { background: rgba(48,209,88,0.15); color: #30d158; border-color: rgba(48,209,88,0.3); }

      /* ─ Multi-Role Checkboxes ─ */
      .um-role-checkboxes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .um-role-checkbox-item {
        display: flex; align-items: center; gap: 8px; padding: 8px 12px;
        border-radius: 8px; background: var(--glass-layer-1); border: var(--border-layer-2);
        cursor: pointer; transition: all 0.2s; user-select: none;
      }
      .um-role-checkbox-item:hover { background: var(--glass-layer-2); }
      .um-role-checkbox-item.checked {
        background: rgba(74,158,255,0.1); border-color: rgba(74,158,255,0.3);
      }
      .um-role-checkbox-item input[type="checkbox"] {
        accent-color: #4A9EFF; width: 16px; height: 16px; cursor: pointer;
      }
      .um-role-checkbox-item label { font-size: 13px; color: var(--text-primary); cursor: pointer; }

      /* ─ Result Count ─ */
      .um-result-count {
        font-size: 12px; color: var(--text-secondary); padding: 4px 0;
        margin-bottom: 4px; opacity: 0.7;
      }

      /* ─ Transition ─ */
      .admin-grid { transition: all 0.3s ease; }
    `;
    document.head.appendChild(style);
  }

  // ─── Inject Header Controls (search + toggle) ──────────────
  function injectHeaderControls(header) {
    if (header.querySelector('.um-view-toggle')) return;

    const addBtn = header.querySelector('.btn-primary');
    if (!addBtn) return;

    // Wrap in a controls div
    const controls = document.createElement('div');
    controls.className = 'um-header-controls';
    controls.style.cssText = 'display:flex;align-items:center;gap:12px;flex:1;justify-content:flex-end;margin-right:12px;';

    // Search
    const searchWrap = document.createElement('div');
    searchWrap.className = 'um-search-wrap';
    searchWrap.innerHTML = `
      <input class="um-search-input" type="text" placeholder="Search users..." id="um-search-field" autocomplete="off" />
      <span class="um-search-icon">${ICON_SEARCH}</span>
    `;
    controls.appendChild(searchWrap);

    // View Toggle
    const toggle = document.createElement('div');
    toggle.className = 'um-view-toggle';
    toggle.innerHTML = `
      <button class="um-view-btn ${viewMode === 'grid' ? 'active' : ''}" data-view="grid" title="Grid View">${ICON_GRID}</button>
      <button class="um-view-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list" title="List View">${ICON_LIST}</button>
    `;
    controls.appendChild(toggle);

    header.insertBefore(controls, addBtn);

    // Event listeners
    const searchInput = controls.querySelector('#um-search-field');
    searchInput.addEventListener('input', debounce(function () {
      searchQuery = searchInput.value.trim().toLowerCase();
      applySearchFilter();
    }, 150));

    toggle.addEventListener('click', function (e) {
      const btn = e.target.closest('.um-view-btn');
      if (!btn) return;
      viewMode = btn.dataset.view;
      localStorage.setItem('userViewMode', viewMode);
      toggle.querySelectorAll('.um-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyViewMode();
    });
  }

  // ─── Apply View Mode ───────────────────────────────────────
  function applyViewMode() {
    const grid = qs('.admin-grid');
    if (!grid) return;

    // Manage the list header row
    let listHeader = qs('.um-list-header');

    if (viewMode === 'list') {
      grid.classList.add('um-list-view');
      grid.style.gridTemplateColumns = '1fr';

      // Add column header
      if (!listHeader) {
        listHeader = document.createElement('div');
        listHeader.className = 'um-list-header';
        listHeader.innerHTML = '<span>User</span><span>Details</span><span>Actions</span>';
        grid.parentElement.insertBefore(listHeader, grid);
      }
      listHeader.style.display = '';
    } else {
      grid.classList.remove('um-list-view');
      grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
      if (listHeader) listHeader.style.display = 'none';
    }
  }

  // ─── Apply Search Filter ───────────────────────────────────
  function applySearchFilter() {
    const grid = qs('.admin-grid');
    if (!grid) return;

    const cards = qsa('.user-card', grid);
    let visibleCount = 0;

    cards.forEach(card => {
      const textContent = card.textContent.toLowerCase();
      const match = !searchQuery || textContent.includes(searchQuery);
      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    // Update result count
    let countEl = qs('.um-result-count');
    if (searchQuery) {
      if (!countEl) {
        countEl = document.createElement('div');
        countEl.className = 'um-result-count';
        grid.parentElement.insertBefore(countEl, grid);
      }
      countEl.textContent = visibleCount + ' user' + (visibleCount !== 1 ? 's' : '') + ' found';
      countEl.style.display = '';
    } else if (countEl) {
      countEl.style.display = 'none';
    }

    // No results state
    let noResults = qs('.um-no-results');
    if (visibleCount === 0 && searchQuery) {
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.className = 'um-no-results';
        noResults.innerHTML = '<div class="um-no-results-icon">🔍</div>' +
          '<div class="um-no-results-text">No users found</div>' +
          '<div class="um-no-results-sub">Try adjusting your search terms</div>';
        grid.parentElement.insertBefore(noResults, grid.nextSibling);
      }
      noResults.style.display = '';
    } else if (noResults) {
      noResults.style.display = 'none';
    }
  }

  // ─── Enhance Role Display (multi-role badges) ──────────────
  function enhanceRoleBadges() {
    const cards = qsa('.user-card');
    cards.forEach(card => {
      if (card.dataset.rolesEnhanced) return;

      const roleSpan = card.querySelector('.user-card-role');
      if (!roleSpan) return;

      const usernameNode = card.querySelector('.user-card-details div:first-child span');
      const username = usernameNode ? usernameNode.textContent.trim() : null;

      const roles = (username && userRolesMap.has(username))
        ? userRolesMap.get(username)
        : [roleSpan.textContent.trim()];

      if (roles.length > 1) {
        const container = document.createElement('div');
        container.className = 'um-role-badges';
        roles.forEach(r => {
          const badge = document.createElement('span');
          const roleLower = r.toLowerCase().replace(/\s+/g, '');
          badge.className = 'um-role-badge ' + roleLower;
          badge.textContent = r;
          container.appendChild(badge);
        });
        roleSpan.replaceWith(container);
      } else {
        const currentRole = roles[0] || roleSpan.textContent.trim();
        const roleLower = currentRole.toLowerCase().replace(/\s+/g, '');
        roleSpan.className = 'um-role-badge ' + roleLower;
        roleSpan.textContent = currentRole;
        roleSpan.style.cssText = '';
      }

      card.dataset.rolesEnhanced = 'true';
    });
  }

  // ─── Enhance Create/Edit Modal (multi-role checkboxes) ─────
  function enhanceModal() {
    const modal = qs('.modal-overlay .modal');
    if (!modal) return;
    if (modal.dataset.rolesEnhanced) return;

    const selectEl = modal.querySelector('.form-select');
    if (!selectEl) return;

    // Check if this is the Account Type select (not Celebration Point)
    const label = selectEl.previousElementSibling || selectEl.closest('.form-group')?.querySelector('.form-label');
    if (!label || !label.textContent.includes('Account Type')) return;

    const options = Array.from(selectEl.options).filter(o => o.value);
    if (options.length === 0) return;

    const currentValue = selectEl.value;

    const container = document.createElement('div');
    container.className = 'um-role-checkboxes';
    container.id = 'um-role-picker';

    const allRoles = [
      { value: 'Coordinator', label: 'Coordinator' },
      { value: 'Pastor', label: 'Pastor' },
      { value: 'Facilitator', label: 'Facilitator' },
      { value: 'TechSupport', label: 'Tech Support' },
      { value: 'LeadershipTeam', label: 'Leadership Team' },
      { value: 'Admin', label: 'Admin' }
    ];

    // Find username field if editing
    let currentUsername = null;
    modal.querySelectorAll('.form-group').forEach(fg => {
      const lbl = fg.querySelector('.form-label');
      if (lbl && lbl.textContent.includes('Username')) {
        const inp = fg.querySelector('input');
        if (inp) currentUsername = inp.value;
      }
    });

    const userRoles = (currentUsername && userRolesMap.has(currentUsername))
      ? userRolesMap.get(currentUsername)
      : [currentValue];

    rolesToShow.forEach(role => {
      const item = document.createElement('div');
      const isChecked = userRoles.includes(role.value);
      item.className = 'um-role-checkbox-item' + (isChecked ? ' checked' : '');
      item.innerHTML = '<input type="checkbox" id="role-' + role.value + '" value="' + role.value + '"' + (isChecked ? ' checked' : '') + ' />' +
        '<label for="role-' + role.value + '">' + role.label + '</label>';

      item.addEventListener('click', function (e) {
        if (e.target.tagName === 'INPUT') return;
        const cb = item.querySelector('input');
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
      item.querySelector('input').addEventListener('change', function () {
        const checked = getCheckedRoles();
        if (checked.length > 0) {
          selectEl.value = checked[0];
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
        container.querySelectorAll('.um-role-checkbox-item').forEach(el => {
          el.classList.toggle('checked', el.querySelector('input').checked);
        });
        selectEl.dataset.selectedRoles = checked.join(',');
      });
      container.appendChild(item);
    });

    // Update label
    const formLabel = selectEl.closest('.form-group')?.querySelector('.form-label');
    if (formLabel) formLabel.textContent = 'Permissions (select one or more)';

    selectEl.style.display = 'none';
    selectEl.parentElement.appendChild(container);

    modal.dataset.rolesEnhanced = 'true';
  }

  function getCheckedRoles() {
    const picker = qs('#um-role-picker');
    if (!picker) return [];
    return Array.from(picker.querySelectorAll('input:checked')).map(cb => cb.value);
  }

  // ─── Intercept network requests (fetch) ─────────
  function interceptNetwork() {
    const originalFetch = window.fetch;
    window.fetch = async function (url, options) {
      if (typeof url === 'string' && url.includes('/api/admin/users')) {
        // Intercept POST/PUT (Save roles payload)
        if (options && options.body) {
          try {
            const body = JSON.parse(options.body);
            const picker = qs('#um-role-picker');
            if (picker) {
              const checked = Array.from(picker.querySelectorAll('input:checked')).map(cb => cb.value);
              if (checked.length > 0) {
                body.roles = checked.join(',');
                body.role = checked[0];
                options.body = JSON.stringify(body);
              }
            }
          } catch (_) {}
        }
      }

      const response = await originalFetch.apply(this, arguments);

      // Intercept GET (Cache user.roles data from backend)
      if (typeof url === 'string' && url.includes('/api/admin/users') && (!options || options.method === 'GET')) {
        try {
          const clone = response.clone();
          clone.json().then(data => {
            if (data.success && data.users) {
              data.users.forEach(u => {
                userRolesMap.set(u.username, u.roles || [u.role]);
              });
              // Give the React DOM a moment to paint, then re-enhance badges
              setTimeout(() => {
                qsa('.user-card').forEach(c => c.removeAttribute('data-roles-enhanced'));
                enhanceRoleBadges();
              }, 150);
            }
          }).catch(e => console.error(e));
        } catch (_) {}
      }

      return response;
    };
  }

  // ─── Main Enhancement Loop ─────────────────────────────────
  function enhance() {
    const header = qs('.section-header, .admin-header');
    if (!header) return;
    const h2 = header.querySelector('h2');
    if (!h2 || !h2.textContent.includes('User Management')) return;

    injectHeaderControls(header);
    applyViewMode();
    enhanceRoleBadges();

    if (qs('.modal-overlay .modal')) {
      enhanceModal();
    }
  }

  // ─── Init ──────────────────────────────────────────────────
  function init() {
    injectStyles();
    interceptNetwork();

    const observer = new MutationObserver(debounce(enhance, 100));
    observer.observe(document.body, { childList: true, subtree: true });

    enhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
