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

  // ─── INJECT STYLES ─────────────────────────────────────────
  function injectStyles() {
    if (qs('#pe-addon-styles')) return;
    const style = document.createElement('style');
    style.id = 'pe-addon-styles';
    style.textContent = [
      '#pe-co-facilitator-select { transition: border-color 0.2s, box-shadow 0.2s; }',
      '#pe-co-facilitator-select:focus { border-color: rgba(74,158,255,0.4); box-shadow: 0 0 0 3px rgba(74,158,255,0.08); }',
      '#pe-co-facilitator-select:hover { border-color: rgba(255,255,255,0.2); }'
    ].join('\n');
    document.head.appendChild(style);
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
    }
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
