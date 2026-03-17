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

      /* ─ Multi-Role Checkboxes (Compact Premium Grid) ─ */
      .um-role-checkboxes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
      .um-role-checkbox-item {
        display: flex; align-items: center; gap: 6px; padding: 7px 8px;
        border-radius: 10px; background: var(--glass-layer-1);
        border: 1.5px solid rgba(255,255,255,0.06);
        cursor: pointer; transition: all 0.25s cubic-bezier(.22, 1, .36, 1);
        user-select: none; position: relative; overflow: hidden;
        min-width: 0;
      }
      .um-role-checkbox-item::before {
        content: ''; position: absolute; inset: 0; opacity: 0;
        transition: opacity 0.25s; border-radius: 10px; pointer-events: none;
      }
      .um-role-checkbox-item:hover { background: var(--glass-layer-2); transform: translateY(-1px); }
      .um-role-checkbox-item:active { transform: scale(0.97); }
      .um-role-checkbox-item.checked {
        border-color: rgba(74,158,255,0.4);
        box-shadow: 0 0 0 1px rgba(74,158,255,0.1), 0 2px 6px rgba(74,158,255,0.06);
      }
      .um-role-checkbox-item.checked::before { opacity: 1; }
      /* Role-specific accent colors when checked */
      .um-role-checkbox-item.checked[data-role="Coordinator"] { border-color: rgba(102,126,234,0.5); }
      .um-role-checkbox-item.checked[data-role="Coordinator"]::before { background: rgba(102,126,234,0.10); }
      .um-role-checkbox-item.checked[data-role="TechSupport"] { border-color: rgba(0,122,255,0.5); }
      .um-role-checkbox-item.checked[data-role="TechSupport"]::before { background: rgba(0,122,255,0.10); }
      .um-role-checkbox-item.checked[data-role="Pastor"] { border-color: rgba(191,90,242,0.5); }
      .um-role-checkbox-item.checked[data-role="Pastor"]::before { background: rgba(191,90,242,0.10); }
      .um-role-checkbox-item.checked[data-role="Facilitator"] { border-color: rgba(48,209,88,0.5); }
      .um-role-checkbox-item.checked[data-role="Facilitator"]::before { background: rgba(48,209,88,0.10); }
      .um-role-checkbox-item.checked[data-role="LeadershipTeam"] { border-color: rgba(255,214,10,0.5); }
      .um-role-checkbox-item.checked[data-role="LeadershipTeam"]::before { background: rgba(255,214,10,0.10); }
      .um-role-checkbox-item.checked[data-role="Admin"] { border-color: rgba(255,69,58,0.5); }
      .um-role-checkbox-item.checked[data-role="Admin"]::before { background: rgba(255,69,58,0.10); }
      .um-role-checkbox-item input[type="checkbox"] {
        appearance: none; -webkit-appearance: none; width: 16px; height: 16px;
        border-radius: 5px; border: 1.5px solid rgba(255,255,255,0.15);
        background: var(--glass-layer-2); cursor: pointer;
        position: relative; flex-shrink: 0;
        transition: all 0.2s cubic-bezier(.22, 1, .36, 1);
      }
      .um-role-checkbox-item input[type="checkbox"]:checked {
        background: linear-gradient(135deg, #4A9EFF 0%, #667eea 100%);
        border-color: transparent;
        box-shadow: 0 2px 4px rgba(74,158,255,0.25);
      }
      .um-role-checkbox-item input[type="checkbox"]:checked::after {
        content: '✓'; position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 10px; font-weight: 700;
      }
      .um-role-checkbox-item label {
        font-size: 11px; color: var(--text-primary); cursor: pointer;
        font-weight: 500; position: relative; z-index: 1;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        min-width: 0;
      }

      /* ─ Result Count ─ */
      .um-result-count {
        font-size: 12px; color: var(--text-secondary); padding: 4px 0;
        margin-bottom: 4px; opacity: 0.7;
      }

      /* ─ Transition ─ */
      .admin-grid { transition: all 0.3s ease; }

      /* ─ Bulk Import UI ─ */
      .um-bulk-btn {
        background: var(--glass-layer-2); border: var(--border-layer-2);
        color: var(--text-primary); padding: 8px 16px; border-radius: 10px;
        font-size: 13px; font-weight: 500; cursor: pointer; display: flex;
        align-items: center; gap: 8px; transition: all 0.2s; box-shadow: var(--shadow-layer-2);
      }
      .um-bulk-btn:hover { background: var(--glass-layer-3); transform: translateY(-1px); }
      
      .um-bulk-modal .um-bulk-dropzone {
        border: 2px dashed rgba(255,255,255,0.15); border-radius: 16px; padding: 40px 24px;
        text-align: center; cursor: pointer; transition: all 0.2s;
        background: rgba(255,255,255,0.02); margin: 24px 0;
      }
      .um-bulk-modal .um-bulk-dropzone:hover, .um-bulk-modal .um-bulk-dropzone.dragover {
        border-color: rgba(74,158,255,0.5); background: rgba(74,158,255,0.05);
      }
      .um-bulk-preview-table {
        width: 100%; border-collapse: collapse; font-size: 12px;
        margin-top: 16px; background: var(--glass-layer-1); border-radius: 8px; overflow: hidden;
      }
      .um-bulk-preview-table th {
        background: rgba(255,255,255,0.05); padding: 8px 12px; text-align: left;
        color: var(--text-secondary); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .um-bulk-preview-table td {
        padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--text-primary);
      }
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

    // Bulk Import Button
    const bulkBtn = document.createElement('button');
    bulkBtn.className = 'um-bulk-btn';
    bulkBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Bulk Import';
    bulkBtn.onclick = openBulkImportModal;
    
    // Insert Bulk Import right before "+ Add New User"
    header.insertBefore(bulkBtn, addBtn);
    
    header.insertBefore(controls, bulkBtn);

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

    allRoles.forEach(role => {
      const item = document.createElement('div');
      const isChecked = userRoles.includes(role.value);
      item.className = 'um-role-checkbox-item' + (isChecked ? ' checked' : '');
      item.setAttribute('data-role', role.value);
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

  // ─── Bulk Import Modal Logic ─────────────────────────────────
  function openBulkImportModal() {
    if (document.getElementById('um-bulk-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'um-bulk-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(5px);';

    let parsedUsers = [];

    const modalHTML = `
      <div class="glass-card modal um-bulk-modal" style="width:700px;max-width:95%;padding:0;display:flex;flex-direction:column;border-radius:20px;border:var(--border-layer-2);background:var(--glass-layer-4);backdrop-filter:var(--blur-layer-4);box-shadow:var(--shadow-layer-4);overflow:hidden;">
        <!-- Header -->
        <div style="height:44px;background:var(--glass-layer-3);border-bottom:var(--border-layer-1);display:flex;align-items:center;padding:0 16px;justify-content:space-between;">
           <div style="display:flex;gap:8px;">
             <button id="um-bulk-close-btn" style="width:12px;height:12px;border-radius:50%;background:#ff5f56;border:1px solid #e0443e;cursor:pointer;"></button>
             <button style="width:12px;height:12px;border-radius:50%;background:#ffbd2e;border:1px solid #dea123;cursor:pointer;"></button>
             <button style="width:12px;height:12px;border-radius:50%;background:#27c93f;border:1px solid #1aab29;cursor:pointer;"></button>
           </div>
           <div style="font-weight:500;color:var(--text-secondary);font-size:13px;">Bulk Import Users</div>
           <div style="width:52px;"></div>
        </div>
        
        <!-- Content -->
        <div style="padding:32px;overflow-y:auto;max-height:70vh;" id="um-bulk-content">
          <h2 style="margin:0 0 8px;font-size:20px;">Upload Users via CSV</h2>
          <p style="margin:0 0 16px;color:var(--text-secondary);font-size:14px;line-height:1.5;">
            Upload a CSV file containing multiple users to create them all at once. 
            <a href="#" id="um-bulk-template-link" style="color:#56CCF2;text-decoration:none;">Download template CSV</a>
          </p>

          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-primary);background:var(--glass-layer-2);padding:10px 14px;border-radius:8px;border:var(--border-layer-1);margin-bottom:16px;cursor:pointer;">
            <input type="checkbox" id="um-bulk-send-emails" style="accent-color:#56CCF2;" checked />
            Send login credentials via email (requires valid <code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;">email</code> column)
          </label>

          <input type="file" id="um-bulk-file-input" accept=".csv" style="display:none;" />
          <div class="um-bulk-dropzone" id="um-bulk-dropzone">
             <div style="font-size:40px;margin-bottom:16px;">📄</div>
             <h3 style="margin:0 0 8px;font-size:16px;">Drag 'n' Drop CSV here</h3>
             <p style="margin:0 0 16px;color:var(--text-secondary);font-size:13px;">or click to browse from your computer</p>
             <button class="btn-secondary" id="um-bulk-browse-btn">Browse Files</button>
          </div>

          <div id="um-bulk-preview-container" style="display:none;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <h3 style="margin:0;font-size:16px;">Preview (<span id="um-bulk-count">0</span> users)</h3>
              <button class="btn-secondary" id="um-bulk-clear-btn" style="padding:4px 12px;font-size:12px;">Clear</button>
            </div>
            <div style="max-height:250px;overflow-y:auto;border:var(--border-layer-1);border-radius:8px;">
              <table class="um-bulk-preview-table" id="um-bulk-table">
                <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Campus</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
            
            <div id="um-bulk-error-log" style="margin-top:16px;padding:12px;background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.2);border-radius:8px;color:#ff453a;font-size:12px;display:none;"></div>
            
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;">
              <button class="btn-primary" id="um-bulk-submit-btn" style="width:100%;">Create Users</button>
            </div>
          </div>

          <div id="um-bulk-results-container" style="display:none;text-align:center;padding:24px 0;">
            <div style="font-size:48px;margin-bottom:16px;" id="um-bulk-result-icon">✅</div>
            <h2 style="margin:0 0 8px;" id="um-bulk-result-title">Import Complete</h2>
            <p style="color:var(--text-secondary);margin:0 0 24px;" id="um-bulk-result-desc"></p>
            <button class="btn-primary" id="um-bulk-done-btn">Done</button>
          </div>
        </div>
      </div>
    `;

    overlay.innerHTML = modalHTML;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#um-bulk-close-btn');
    const doneBtn = overlay.querySelector('#um-bulk-done-btn');
    const templateLink = overlay.querySelector('#um-bulk-template-link');
    const fileInput = overlay.querySelector('#um-bulk-file-input');
    const dropzone = overlay.querySelector('#um-bulk-dropzone');
    const browseBtn = overlay.querySelector('#um-bulk-browse-btn');
    const clearBtn = overlay.querySelector('#um-bulk-clear-btn');
    const submitBtn = overlay.querySelector('#um-bulk-submit-btn');
    const sendEmailsCheck = overlay.querySelector('#um-bulk-send-emails');

    const previewContainer = overlay.querySelector('#um-bulk-preview-container');
    const resultsContainer = overlay.querySelector('#um-bulk-results-container');
    const errorLog = overlay.querySelector('#um-bulk-error-log');
    const tbody = overlay.querySelector('#um-bulk-table tbody');

    // Close Modal
    const closeModal = () => { overlay.remove(); window.dispatchEvent(new Event('url-change')); };
    closeBtn.onclick = closeModal;
    doneBtn.onclick = () => { closeModal(); window.location.reload(); };
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    // File Dropzone Logic
    browseBtn.onclick = () => fileInput.click();
    dropzone.onclick = (e) => { if (e.target !== browseBtn) fileInput.click(); };
    dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('dragover'); };
    dropzone.ondragleave = (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); };
    dropzone.ondrop = (e) => {
      e.preventDefault(); dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    };
    fileInput.onchange = (e) => { if (e.target.files.length) handleFile(e.target.files[0]); };

    // Download Template
    templateLink.onclick = (e) => {
      e.preventDefault();
      const csv = 'name,username,email,password,role,celebration_point\\nJohn Doe,johndoe,john@example.com,Password123!,Facilitator,Downtown';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_import_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    clearBtn.onclick = () => {
      parsedUsers = []; fileInput.value = '';
      dropzone.style.display = 'block';
      previewContainer.style.display = 'none';
      errorLog.style.display = 'none';
    };

    function handleFile(file) {
      if (!file.name.endsWith('.csv')) { alert('Please upload a valid CSV file.'); return; }
      const reader = new FileReader();
      reader.onload = (e) => parseCSV(e.target.result);
      reader.readAsText(file);
    }

    // Basic CSV Parser
    function parseCSV(text) {
      errorLog.style.display = 'none';
      errorLog.innerHTML = '';
      
      const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim());
      if (lines.length < 2) { alert('CSV must contain a header row and data rows.'); return; }

      
      // Parse CSV line accounting for quotes
      const parseLine = (line) => {
        const result = [];
        let curr = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i+1] === '"') { curr += '"'; i++; } else { inQuotes = !inQuotes; }
          } else if (char === ',' && !inQuotes) {
            result.push(curr.trim()); curr = '';
          } else { curr += char; }
        }
        result.push(curr.trim());
        return result;
      };

      const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z_]/g, ''));
      
      // Map common deviations to standard keys
      const keyMap = {
        'fullname': 'name', 'first_name': 'name', 'firstname': 'name',
        'celebrationpoint': 'celebration_point', 'campus': 'celebration_point', 'location': 'celebration_point',
        'roles': 'role'
      };

      const standardizedHeaders = headers.map(h => keyMap[h] || h);

      parsedUsers = lines.slice(1).map(line => {
        const cols = parseLine(line);
        const user = {};
        standardizedHeaders.forEach((header, idx) => {
           if (cols[idx] !== undefined) user[header] = cols[idx];
        });
        return user;
      }).filter(u => u.username || u.name);

      if (parsedUsers.length === 0) { alert('No valid rows found in CSV.'); return; }

      // Validate basics locally before submisison
      let localErrors = [];
      parsedUsers.forEach((u, i) => {
         if (!u.username) localErrors.push(`Row ${i+2}: Missing username`);
         if (!u.name) localErrors.push(`Row ${i+2}: Missing name`);
         if (!u.password) localErrors.push(`Row ${i+2}: Missing password`);
         if (!u.role) localErrors.push(`Row ${i+2}: Missing role`);
      });

      if (localErrors.length > 0) {
         errorLog.innerHTML = '<strong>Validation Errors:</strong><ul style="margin:4px 0 0;padding-left:20px;">' + localErrors.slice(0, 5).map(e => '<li>'+e+'</li>').join('') + (localErrors.length > 5 ? `<li>...and ${localErrors.length-5} more</li>` : '') + '</ul>';
         errorLog.style.display = 'block';
         submitBtn.disabled = true;
         submitBtn.style.opacity = '0.5';
      } else {
         submitBtn.disabled = false;
         submitBtn.style.opacity = '1';
      }

      // Render Table
      tbody.innerHTML = parsedUsers.map(u => `
        <tr>
          <td>${u.name || '-'}</td>
          <td>${(u.username || '-').toLowerCase()}</td>
          <td>${u.email || '-'}</td>
          <td><span class="um-role-badge ${(u.role||'').toLowerCase()}">${u.role || '-'}</span></td>
          <td>${u.celebration_point || '-'}</td>
        </tr>
      `).join('');

      overlay.querySelector('#um-bulk-count').textContent = parsedUsers.length;
      dropzone.style.display = 'none';
      previewContainer.style.display = 'block';
    }

    // Submission
    submitBtn.onclick = async () => {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> Importing...';
      
      try {
        const sendEmails = sendEmailsCheck.checked;
        const resp = await fetch('/api/admin/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: parsedUsers, sendEmails })
        });
        
        const data = await resp.json();
        
        previewContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        
        if (data.success) {
           const sum = data.summary;
           overlay.querySelector('#um-bulk-result-icon').textContent = sum.failed === 0 ? '✅' : '⚠️';
           overlay.querySelector('#um-bulk-result-title').textContent = sum.failed === 0 ? 'Import Successful' : 'Completed with Errors';
           
           let descHtml = `Successfully created <strong>${sum.created}</strong> users.`;
           if (sum.skipped > 0) descHtml += ` Skipped <strong>${sum.skipped}</strong> duplicates.`;
           if (sum.failed > 0) descHtml += ` <br/><span style="color:#ff453a;">Failed to create ${sum.failed} users.</span>`;
           
           if (sendEmails) {
              if (data.emailConfigured) {
                 descHtml += `<br/><br/>📨 Sent credentials to ${sum.emailed} email addresses.`;
              } else {
                 descHtml += `<br/><br/>⚠️ Emails were not sent because SMTP is not configured on the server.`;
              }
           }
           
           overlay.querySelector('#um-bulk-result-desc').innerHTML = descHtml;
        } else {
           overlay.querySelector('#um-bulk-result-icon').textContent = '❌';
           overlay.querySelector('#um-bulk-result-title').textContent = 'Import Failed';
           overlay.querySelector('#um-bulk-result-desc').textContent = data.message || 'An unknown error occurred.';
        }
      } catch (err) {
        alert('Server error: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Users';
      }
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
