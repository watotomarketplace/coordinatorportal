/**
 * Portal Enhancements Addon — WL101 Portal
 *
 * Runtime injection script that enhances:
 *   1. Username input force-lowercase while typing (User Management modal)
 *   2. Co-facilitator dropdown in Group edit/create modals
 *
 * Uses MutationObserver to detect DOM changes and enhance accordingly.
 */
(function () {
  'use strict';

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  // ─── 1. FORCE USERNAME TO LOWERCASE WHILE TYPING ───────────
  function enforceUsernameLowercase() {
    // Find all modal overlays
    const overlays = qsa('.modal-overlay');
    overlays.forEach(overlay => {
      const modal = overlay.querySelector('.modal, .glass-card.modal');
      if (!modal) return;

      // Look for all form-group elements inside the modal
      const formGroups = qsa('.form-group', modal);
      formGroups.forEach(fg => {
        // Find label that says "Username"
        const label = fg.querySelector('label, .form-label');
        if (!label) return;
        if (!label.textContent.includes('Username')) return;

        const input = fg.querySelector('input[type="text"]');
        if (!input || input.dataset.lowercasePatched) return;
        input.dataset.lowercasePatched = 'true';

        // CSS-level lowercase display
        input.style.textTransform = 'lowercase';
        input.setAttribute('autocapitalize', 'off');

        // Intercept keyup to force lowercase into React state
        input.addEventListener('keyup', function () {
          const val = this.value;
          const lower = val.toLowerCase();
          if (val !== lower) {
            const cursorPos = this.selectionStart;
            // Use React's native setter to bypass synthetic events
            const nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            ).set;
            nativeSetter.call(this, lower);
            this.dispatchEvent(new Event('input', { bubbles: true }));
            this.setSelectionRange(cursorPos, cursorPos);
          }
        });

        // Add hint below input
        if (!fg.querySelector('.pe-lowercase-hint')) {
          const hint = document.createElement('div');
          hint.className = 'pe-lowercase-hint';
          hint.style.cssText = 'font-size:10px;color:var(--text-secondary,#888);opacity:0.6;margin-top:4px;';
          hint.textContent = 'Username will be saved in lowercase';
          fg.appendChild(hint);
        }
      });
    });
  }

  // ─── 2. CO-FACILITATOR DROPDOWN IN GROUP MODALS ────────────
  let facilitatorsList = [];
  let facilitatorsFetched = false;

  async function fetchFacilitators() {
    if (facilitatorsFetched) return;
    try {
      const resp = await fetch('/api/formation-groups/facilitators/available');
      const data = await resp.json();
      if (data.success) {
        facilitatorsList = data.facilitators || [];
        facilitatorsFetched = true;
      }
    } catch (e) {
      console.warn('[portal-enhancements] Failed to fetch facilitators:', e);
    }
  }

  function injectCoFacilitatorDropdown() {
    // Find any open modal overlay on the Groups page
    if (!window.location.pathname.includes('/groups')) return;

    const overlays = qsa('.modal-overlay');
    overlays.forEach(overlay => {
      const modal = overlay.querySelector('.modal, .glass-card, [class*="modal"]');
      if (!modal) return;
      if (modal.querySelector('#pe-co-facilitator-select')) return;

      // Find "Facilitator" select by checking labels
      let facilitatorSelect = null;
      let parentFormGroup = null;
      const selects = qsa('select', modal);
      selects.forEach(sel => {
        const parent = sel.closest('.form-group') || sel.parentElement;
        if (!parent) return;
        const lbl = parent.querySelector('label, .form-label');
        if (!lbl) return;
        const txt = lbl.textContent.trim();
        if (txt === 'Facilitator' || txt === 'Main Facilitator') {
          facilitatorSelect = sel;
          parentFormGroup = parent;
        }
      });

      if (!facilitatorSelect || !parentFormGroup) return;

      // Create co-facilitator form group
      const coFacGroup = document.createElement('div');
      coFacGroup.className = 'form-group';
      coFacGroup.style.cssText = 'margin-top: 16px;';
      coFacGroup.innerHTML =
        '<label class="form-label" style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;display:block;">' +
        'Co-Facilitator <span style="opacity:0.5;font-size:11px;">(optional)</span></label>' +
        '<select id="pe-co-facilitator-select" style="width:100%;padding:12px 16px;border-radius:10px;' +
        'background:var(--glass-layer-1);border:var(--border-layer-2);color:var(--text-primary);' +
        'font-size:14px;outline:none;box-sizing:border-box;appearance:none;cursor:pointer;">' +
        '<option value="">None</option></select>';

      const coSelect = coFacGroup.querySelector('#pe-co-facilitator-select');
      facilitatorsList.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.name + (f.celebration_point ? ' (' + f.celebration_point + ')' : '');
        coSelect.appendChild(option);
      });

      // Set current value if available
      if (window.__currentGroupCoFacilitator) {
        coSelect.value = String(window.__currentGroupCoFacilitator);
      }

      parentFormGroup.parentNode.insertBefore(coFacGroup, parentFormGroup.nextSibling);
    });
  }

  // Intercept fetch to inject co_facilitator_user_id on save and read on load
  function setupFetchInterceptor() {
    if (window.__peIntercepted) return;
    window.__peIntercepted = true;

    const origFetch = window.fetch;
    window.fetch = async function (url, options) {
      const urlStr = typeof url === 'string' ? url : (url instanceof Request ? url.url : String(url));

      // Inject co_facilitator_user_id on PUT/POST to formation-groups
      if (urlStr.match(/\/api\/formation-groups(\/\d+)?$/) && options && options.method && ['PUT', 'POST'].includes(options.method.toUpperCase()) && options.body) {
        try {
          const body = JSON.parse(options.body);
          const coSelect = document.getElementById('pe-co-facilitator-select');
          if (coSelect) {
            const val = coSelect.value;
            body.co_facilitator_user_id = val ? parseInt(val, 10) : null;
            options = Object.assign({}, options, { body: JSON.stringify(body) });
          }
        } catch (_) {}
      }

      const response = await origFetch.apply(this, [url, options]);

      // Read co_facilitator from group detail GET response
      if (urlStr.match(/\/api\/formation-groups\/\d+$/) && (!options || !options.method || options.method === 'GET')) {
        try {
          const clone = response.clone();
          clone.json().then(data => {
            if (data.success && data.group) {
              window.__currentGroupCoFacilitator = data.group.co_facilitator_user_id || '';
              setTimeout(() => {
                const coSelect = document.getElementById('pe-co-facilitator-select');
                if (coSelect && window.__currentGroupCoFacilitator) {
                  coSelect.value = String(window.__currentGroupCoFacilitator);
                }
              }, 500);
            }
          }).catch(() => {});
        } catch (_) {}
      }

      return response;
    };
  }

  // ─── 3. GROUP CODE 2-DIGIT ENFORCEMENT ────────────────────
  const CAMPUS_CODE_MAP = {
    'Bbira': 'WBB', 'Bugolobi': 'WBG', 'Bweyogerere': 'WBW', 'Downtown': 'WDT',
    'Entebbe': 'WEN', 'Nakwero': 'WGN', 'Gulu': 'WGU', 'Jinja': 'WJJ',
    'Juba': 'WJB', 'Kansanga': 'WKA', 'Kyengera': 'WKY', 'Laminadera': 'WLM',
    'Lubowa': 'WLB', 'Mbarara': 'WMB', 'Mukono': 'WMK', 'Nansana': 'WNW',
    'Ntinda': 'WNT', 'Online': 'WON', 'Suubi': 'WSU'
  };

  function enforceGroupCodeFormat() {
    if (!window.location.pathname.includes('/groups')) return;

    const overlays = qsa('.modal-overlay');
    overlays.forEach(overlay => {
      const modal = overlay.querySelector('.modal, .glass-card, [class*="modal"]');
      if (!modal || modal.dataset.codeEnhanced) return;

      // Find "Group Code" or "Name" input (the group code input field)
      let codeInput = null;
      let codeFormGroup = null;
      const formGroups = qsa('.form-group', modal);
      formGroups.forEach(fg => {
        const lbl = fg.querySelector('label, .form-label');
        if (!lbl) return;
        const txt = lbl.textContent.trim();
        if (txt === 'Group Code' || txt === 'Name') {
          const inp = fg.querySelector('input[type="text"]');
          if (inp) {
            codeInput = inp;
            codeFormGroup = fg;
          }
        }
      });

      if (!codeInput || codeInput.dataset.codePatched) return;
      codeInput.dataset.codePatched = 'true';

      // Find the Celebration Point select
      let campusSelect = null;
      formGroups.forEach(fg => {
        const lbl = fg.querySelector('label, .form-label');
        if (!lbl) return;
        if (lbl.textContent.includes('Celebration Point') || lbl.textContent.includes('Campus')) {
          const sel = fg.querySelector('select');
          if (sel) campusSelect = sel;
        }
      });

      // Add live preview element below the code input
      const preview = document.createElement('div');
      preview.id = 'pe-code-preview';
      preview.style.cssText = 'margin-top:6px;font-size:12px;display:flex;align-items:center;gap:8px;';
      preview.innerHTML = '<span style="color:var(--text-secondary);opacity:0.6;">Preview:</span><span id="pe-code-preview-val" style="font-weight:700;color:#4A9EFF;font-family:monospace;font-size:14px;letter-spacing:0.5px;">---</span>';
      codeFormGroup.appendChild(preview);

      // Update preview based on campus + code input
      function updateCodePreview() {
        const previewVal = qs('#pe-code-preview-val');
        if (!previewVal) return;

        const campus = campusSelect ? campusSelect.value : '';
        const prefix = CAMPUS_CODE_MAP[campus] || '';
        const rawValue = codeInput.value.trim().toUpperCase();

        // If user typed a full code like WDT03, parse it
        const fullMatch = rawValue.match(/^([A-Z]{3})(\d+)$/);
        if (fullMatch) {
          const paddedNum = String(parseInt(fullMatch[2], 10)).padStart(2, '0');
          previewVal.textContent = fullMatch[1] + paddedNum;
          previewVal.style.color = '#30d158';
          return;
        }

        // Otherwise treat input as just the numeric suffix
        const digits = rawValue.replace(/\D/g, '');
        if (prefix && digits) {
          const paddedNum = String(parseInt(digits, 10)).padStart(2, '0');
          previewVal.textContent = prefix + paddedNum;
          previewVal.style.color = '#4A9EFF';
        } else if (prefix) {
          previewVal.textContent = prefix + '__';
          previewVal.style.color = 'var(--text-secondary)';
        } else {
          previewVal.textContent = '---';
          previewVal.style.color = 'var(--text-secondary)';
        }
      }

      codeInput.addEventListener('input', updateCodePreview);
      if (campusSelect) {
        campusSelect.addEventListener('change', function () {
          updateCodePreview();
          // Auto-suggest next code if input is empty
          if (!codeInput.value.trim() && campusSelect.value) {
            autoSuggestNextCode(campusSelect.value, codeInput);
          }
        });
      }

      // Initial update
      updateCodePreview();

      modal.dataset.codeEnhanced = 'true';
    });
  }

  async function autoSuggestNextCode(campus, input) {
    try {
      const resp = await fetch('/api/formation-groups/next-code?campus=' + encodeURIComponent(campus));
      const data = await resp.json();
      if (data.success && data.code) {
        // Use React's native setter
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, data.code);
        input.dispatchEvent(new Event('input', { bubbles: true }));

        // Show "suggested" label
        let suggestLabel = input.parentElement.querySelector('.pe-suggested-label');
        if (!suggestLabel) {
          suggestLabel = document.createElement('span');
          suggestLabel.className = 'pe-suggested-label';
          suggestLabel.style.cssText = 'font-size:10px;color:#30d158;background:rgba(48,209,88,0.1);padding:2px 8px;border-radius:4px;margin-left:8px;';
          suggestLabel.textContent = 'suggested';
          const label = input.closest('.form-group')?.querySelector('label, .form-label');
          if (label) label.appendChild(suggestLabel);
        }
      }
    } catch (e) {
      console.warn('[portal-enhancements] Failed to auto-suggest next code:', e);
    }
  }

  // ─── INJECT STYLES ─────────────────────────────────────────
  function injectStyles() {
    if (qs('#pe-addon-styles')) return;
    const style = document.createElement('style');
    style.id = 'pe-addon-styles';
    style.textContent = [
      '#pe-co-facilitator-select { transition: border-color 0.2s, box-shadow 0.2s; }',
      '#pe-co-facilitator-select:focus { border-color: rgba(74,158,255,0.4); box-shadow: 0 0 0 3px rgba(74,158,255,0.08); }',
      '#pe-co-facilitator-select:hover { border-color: rgba(255,255,255,0.2); }',
      '#pe-code-preview { transition: all 0.2s; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ─── 4. CHART DRILL-DOWN INTERACTIVITY (Desktop + Mobile) ───
  let _chartStudentsCache = null;
  const _chartEnhanced = new WeakSet();

  function fetchStudentsForCharts() {
    if (_chartStudentsCache) return Promise.resolve(_chartStudentsCache);
    return fetch('/api/data/students', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.students) {
          _chartStudentsCache = d.students;
          setTimeout(() => { _chartStudentsCache = null; }, 60000);
        }
        return _chartStudentsCache || [];
      })
      .catch(() => []);
  }

  function showDrillDown(title, students) {
    const existing = document.getElementById('pe-drilldown');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pe-drilldown';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.3);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.25s ease;';

    const isMobile = window.innerWidth <= 768;

    const sheet = document.createElement('div');
    sheet.style.cssText = isMobile
      ? 'position:absolute;bottom:0;left:0;right:0;max-height:75vh;background:var(--glass-layer-4, rgba(30,30,40,0.98));backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border-radius:20px 20px 0 0;border-top:var(--border-layer-2, 0.5px solid rgba(255,255,255,0.15));display:flex;flex-direction:column;overflow:hidden;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);'
      : 'width:560px;max-width:90vw;max-height:70vh;background:var(--glass-layer-4, rgba(30,30,40,0.98));backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border-radius:20px;border:var(--border-layer-2, 0.5px solid rgba(255,255,255,0.15));display:flex;flex-direction:column;overflow:hidden;transform:scale(0.95);opacity:0;transition:transform 0.25s ease,opacity 0.25s ease;box-shadow:var(--shadow-layer-4, 0 25px 60px rgba(0,0,0,0.5));';

    // Handle
    const handle = isMobile ? '<div style="width:36px;height:5px;border-radius:3px;background:rgba(255,255,255,0.2);margin:8px auto 0;"></div>' : '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'padding:16px 20px;border-bottom:var(--border-layer-1, 0.5px solid rgba(255,255,255,0.08));display:flex;align-items:center;gap:10px;flex-shrink:0;';
    header.innerHTML = handle +
      '<h3 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary, rgba(255,255,255,0.95));flex:1;min-width:0;">' + title + '</h3>' +
      '<span style="font-size:13px;font-weight:600;color:var(--accent-blue, #4A9EFF);background:rgba(74,158,255,0.12);padding:4px 10px;border-radius:10px;">' + students.length + '</span>' +
      '<button id="pe-drilldown-close" style="width:30px;height:30px;border-radius:50%;border:var(--border-layer-1, 1px solid rgba(255,255,255,0.08));background:var(--glass-layer-2, rgba(255,255,255,0.08));color:var(--text-secondary, rgba(255,255,255,0.6));font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;">\u00D7</button>';

    // List
    const list = document.createElement('div');
    list.style.cssText = 'overflow-y:auto;-webkit-overflow-scrolling:touch;flex:1;';

    if (students.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-secondary, rgba(255,255,255,0.4));">No students in this category</div>';
    } else {
      students.slice(0, 200).forEach(s => {
        let riskColor = '#34c759', riskLabel = 'Healthy';
        if (s.risk && s.risk.category === 'Critical') { riskColor = '#ff3b30'; riskLabel = 'Critical'; }
        else if (s.risk && s.risk.category === 'Attention') { riskColor = '#ff9500'; riskLabel = 'Attention'; }

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:var(--border-layer-1, 0.5px solid rgba(255,255,255,0.05));gap:12px;min-height:48px;cursor:pointer;transition:background 0.15s;';
        row.onmouseenter = () => row.style.background = 'var(--glass-layer-1, rgba(255,255,255,0.04))';
        row.onmouseleave = () => row.style.background = 'transparent';

        row.innerHTML =
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:14px;font-weight:600;color:var(--text-primary, rgba(255,255,255,0.90));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (s.name || s.first_name + ' ' + s.last_name) + '</div>' +
            '<div style="font-size:12px;color:var(--text-secondary, rgba(255,255,255,0.35));margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (s.email || '') + ' \u2022 ' + (s.celebration_point || '') + '</div>' +
          '</div>' +
          '<div style="flex-shrink:0;text-align:right;">' +
            '<div style="font-size:15px;font-weight:700;color:var(--text-primary, rgba(255,255,255,0.90));">' + (s.progress || 0) + '%</div>' +
            '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;margin-top:2px;color:' + riskColor + ';">' + riskLabel + '</div>' +
          '</div>';

        list.appendChild(row);
      });
    }

    sheet.appendChild(header);
    sheet.appendChild(list);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      if (isMobile) {
        sheet.style.transform = 'translateY(0)';
      } else {
        sheet.style.transform = 'scale(1)';
        sheet.style.opacity = '1';
      }
    });

    // Close
    function close() {
      overlay.style.opacity = '0';
      if (isMobile) sheet.style.transform = 'translateY(100%)';
      else { sheet.style.transform = 'scale(0.95)'; sheet.style.opacity = '0'; }
      setTimeout(() => overlay.remove(), 300);
    }
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    qs('#pe-drilldown-close').addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }

  function enhanceChartInteractivity() {
    if (window.location.pathname !== '/dashboard') return;

    const Chart = window.Chart;
    if (!Chart || !Chart.getChart) return;

    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      if (_chartEnhanced.has(canvas)) return;

      const chart = Chart.getChart(canvas);
      if (!chart) return;

      _chartEnhanced.add(canvas);
      canvas.style.cursor = 'pointer';

      canvas.addEventListener('click', evt => {
        const activeChart = Chart.getChart(canvas);
        if (!activeChart) return;

        const elements = activeChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
        if (!elements || elements.length === 0) return;

        const el = elements[0];
        const index = el.index;
        const labels = (activeChart.config.data.labels || []).join(',');
        let filterFn = null;
        let drillTitle = '';

        if (labels.includes('0-25%') || labels.includes('76-100%')) {
          const ranges = [
            { min: 0, max: 25, label: '0-25%' },
            { min: 26, max: 50, label: '26-50%' },
            { min: 51, max: 75, label: '51-75%' },
            { min: 76, max: 100, label: '76-100%' }
          ];
          const range = ranges[index];
          if (range) {
            drillTitle = 'Progress: ' + range.label;
            filterFn = s => s.progress >= range.min && s.progress <= range.max;
          }
        } else if (labels.includes('Completed') || labels.includes('Not Started')) {
          const statuses = ['Completed', 'In Progress', 'Not Started'];
          const status = statuses[index];
          if (status) {
            drillTitle = status + ' Students';
            filterFn = s => s.status === status;
          }
        } else if (activeChart.config.options && activeChart.config.options.indexAxis === 'y') {
          const label = activeChart.config.data.labels[index];
          drillTitle = 'Course: ' + label;
          filterFn = s => s.course === label;
        }

        if (filterFn) {
          fetchStudentsForCharts().then(students => {
            showDrillDown(drillTitle, students.filter(filterFn));
          });
        }
      });
    });
  }

  // ─── 5. VIEW INACTIVE STUDENTS DRILL-DOWN ──────────────────
  function enhanceViewInactiveButton() {
    if (window.location.pathname !== '/dashboard') return;

    const buttons = qsa('button');
    buttons.forEach(btn => {
      if (!btn.textContent.trim().includes('View Inactive')) return;
      if (btn.dataset.peInactiveEnhanced) return;
      btn.dataset.peInactiveEnhanced = 'true';

      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        fetch('/api/data/inactive?days=14', { credentials: 'same-origin' })
          .then(r => r.json())
          .then(d => {
            if (d.success) {
              showDrillDown(
                'Inactive Students (\u226514 days)',
                (d.students || []).map(s => ({ ...s, _daysInactive: s.daysInactive }))
              );
            }
          })
          .catch(err => console.error('Failed to load inactive students:', err));
      });
    });
  }

  // Alert badges — only target leaf-level elements, not parent containers
  function enhanceAlertBadges() {
    if (window.location.pathname !== '/dashboard') return;

    // Target only small badge/stat elements, not whole sections
    const candidates = qsa('span, p, small, div');
    candidates.forEach(el => {
      if (el.dataset.peAlertEnhanced) return;
      // Skip elements with many children (containers)
      if (el.children.length > 2) return;
      // Only match elements whose own direct text (not children) contains the pattern
      const ownText = Array.from(el.childNodes)
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent)
        .join('');
      const fullText = el.textContent || '';
      // Must be a compact element (badge-like, not a big section)
      if (fullText.length > 120) return;

      if (fullText.includes('inactive') && fullText.includes('30') && fullText.includes('days')) {
        el.dataset.peAlertEnhanced = 'true';
        el.style.cursor = 'pointer';
        el.addEventListener('click', e => {
          e.stopPropagation();
          fetch('/api/data/inactive?days=30', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(d => { if (d.success) showDrillDown('Critical: Inactive \u226530 days', d.students || []); })
            .catch(() => {});
        });
      } else if (fullText.includes('inactive') && fullText.includes('14') && fullText.includes('days') && !fullText.includes('30')) {
        el.dataset.peAlertEnhanced = 'true';
        el.style.cursor = 'pointer';
        el.addEventListener('click', e => {
          e.stopPropagation();
          fetch('/api/data/inactive?days=14', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(d => { if (d.success) showDrillDown('Warning: Inactive \u226514 days', d.students || []); })
            .catch(() => {});
        });
      }
    });
  }

  // ─── 6. HIDE DEACTIVATE BUTTON FOR FACILITATORS ────────────
  function hideFacilitatorDeactivate() {
    if (!window.location.pathname.includes('/groups')) return;

    // Check current user role via session data cached on window
    let userRole = null;
    try {
      // The React app stores user in context; we can read from a fetch or from DOM
      if (window.__PE_USER_ROLE__) {
        userRole = window.__PE_USER_ROLE__;
      } else {
        // Fetch once and cache
        fetch('/api/auth/session', { credentials: 'same-origin' })
          .then(r => r.json())
          .then(d => {
            if (d && d.user) {
              window.__PE_USER_ROLE__ = d.user.role;
              if (d.user.role === 'Facilitator') _hideDeactivateButtons();
            }
          })
          .catch(() => {});
        return;
      }
    } catch (e) { return; }

    if (userRole === 'Facilitator') _hideDeactivateButtons();
  }

  function _hideDeactivateButtons() {
    const buttons = qsa('button');
    buttons.forEach(btn => {
      if (btn.textContent.trim() === 'Deactivate') {
        btn.style.display = 'none';
      }
    });
  }

  // ─── MAIN LOOP ─────────────────────────────────────────────
  function enhance() {
    enforceUsernameLowercase();

    if (window.location.pathname.includes('/groups')) {
      if (facilitatorsList.length === 0 && !facilitatorsFetched) {
        fetchFacilitators().then(() => injectCoFacilitatorDropdown());
      } else {
        injectCoFacilitatorDropdown();
      }
      enforceGroupCodeFormat();
      hideFacilitatorDeactivate();
    }

    // Chart drill-down + inactive students (dashboard only)
    enhanceChartInteractivity();
    enhanceViewInactiveButton();
    enhanceAlertBadges();
  }

  // ─── INIT ──────────────────────────────────────────────────
  function init() {
    injectStyles();
    setupFetchInterceptor();

    const observer = new MutationObserver(debounce(enhance, 150));
    observer.observe(document.body, { childList: true, subtree: true });

    // Also run on URL changes (React Router)
    let lastPath = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        setTimeout(enhance, 300);
      }
    }, 300);

    enhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
