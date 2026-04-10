/**
 * Dashboard Fix v2 — WL101 Portal
 * 
 * REPLACES: dashboard-fix.js
 *
 * Only keeps functional fixes:
 *   1. Double-click on chart bars
 *   2. Stat card label corrections
 *   3. Chart axis label fixes
 *   4. Tech Support DOM fix
 * 
 * REMOVED: Glass consistency (now handled by design-system.css)
 */
(function () {
  'use strict';

  // ─── FIX 1: DOUBLE-CLICK ON CHART BARS ───────────────────────
  function fixChartClickInterception() {
    var style = document.createElement('style');
    style.id = 'wl101-chart-click-fix';
    style.textContent =
      'canvas { pointer-events: auto !important; }';
    document.head.appendChild(style);
  }

  // ─── FIX 2: STAT CARD LABELS ─────────────────────────────────
  var LABEL_MAP = {
    'ACTIVE COURSES': 'ACTIVE STUDENTS',
    'Active Courses': 'Active Students',
    'active courses': 'active students',
    'COMPLETED COURSES': 'ON TRACK (75%+)',
    'Completed Courses': 'On Track (75%+)',
    'completed courses': 'on track (75%+)',
    'Successfully finished': 'at 75%+ completion',
    'Currently in progress': 'active in last 14 days',
  };

  function relabelStatCards() {
    var allText = document.querySelectorAll(
      '.stat-card *, .dashboard-stat *, [class*="stat-"] *, [class*="Stats"] *'
    );
    for (var i = 0; i < allText.length; i++) {
      var el = allText[i];
      if (el.children.length > 0) continue;
      var txt = el.textContent.trim();
      if (LABEL_MAP[txt]) {
        el.textContent = LABEL_MAP[txt];
      }
    }
  }

  // ─── FIX 3: CHART AXIS LABELS + DATASET KEYS ─────────────────
  // Rewrites known dashboard charts to show detailed readable keys:
  //   • Progress Distribution bar chart → percentage range bins + "Students" dataset label
  //   • Completion Status doughnut → full descriptive labels
  //   • Any bar chart missing a dataset label → give it a sensible fallback
  function fixChartLabels() {
    var checkCharts = setInterval(function () {
      if (!window.Chart) return;

      var canvases = document.querySelectorAll('canvas');
      for (var i = 0; i < canvases.length; i++) {
        var canvas = canvases[i];
        var chart = window.Chart.getChart(canvas);
        if (!chart) continue;
        if (canvas.dataset.wl101LabelFixed) continue;
        canvas.dataset.wl101LabelFixed = '1';

        // Find the enclosing chart-card and its title so we can target charts
        // by their visible heading (robust to data-shape changes).
        var card = canvas.closest('.chart-card');
        var titleEl = card && card.querySelector('.chart-title');
        var title = titleEl ? titleEl.textContent.trim() : '';

        // ─ Progress Distribution bar ─
        if (
          chart.config.type === 'bar' &&
          chart.data.labels &&
          chart.data.labels.length === 4 &&
          (title === 'Progress Distribution' ||
           chart.data.labels.join(',') === '0,1,2,3' ||
           chart.data.labels.join(',') === '0-25,26-50,51-75,76-100')
        ) {
          chart.data.labels = ['0\u201325%', '26\u201350%', '51\u201375%', '76\u2013100%'];
          (chart.data.datasets || []).forEach(function (ds) {
            if (!ds.label || ds.label === '' || ds.label === 'undefined') {
              ds.label = 'Students';
            }
          });
          if (chart.options && chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend.display = true;
          }
          if (chart.options && chart.options.scales) {
            if (chart.options.scales.x) {
              chart.options.scales.x.title = { display: true, text: 'Completion Range', color: 'rgba(255,255,255,0.5)', font: { size: 11, weight: '500' } };
            }
            if (chart.options.scales.y) {
              chart.options.scales.y.title = { display: true, text: 'Number of Students', color: 'rgba(255,255,255,0.5)', font: { size: 11, weight: '500' } };
            }
          }
          chart.update('none');
        }

        // ─ Completion Status / generic doughnut ─
        if (chart.config.type === 'doughnut' && chart.data.labels) {
          var labels = chart.data.labels;
          var relabelMap = {
            'Completed': 'Completed',
            'In Progress': 'In Progress',
            'Not Started': 'Not Started'
          };
          // Show the legend for any doughnut so the user always gets a key
          if (chart.options && chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend.display = true;
            chart.options.plugins.legend.position = 'bottom';
          }
          chart.update('none');
        }

        // ─ Ensure every bar / line chart shows a legend and has readable keys ─
        if ((chart.config.type === 'bar' || chart.config.type === 'line') &&
            chart.options && chart.options.plugins) {
          if (!chart.options.plugins.legend || chart.options.plugins.legend.display === false) {
            chart.options.plugins.legend = {
              display: true,
              position: 'bottom',
              labels: {
                color: 'rgba(255,255,255,0.6)',
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 8,
                boxHeight: 8,
                padding: 14,
                font: { size: 12, weight: '500' }
              }
            };
            chart.update('none');
          }
        }
      }
    }, 800);

    setTimeout(function () { clearInterval(checkCharts); }, 30000);
  }

  // ─── FIX 4: TECH SUPPORT DOM FIX ─────────────────────────────
  function fixTechSupportDOM() {
    if (!window.location.pathname.includes('/tech-support')) return;
    var headers = document.querySelectorAll('h1, h2');
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].textContent.includes('Tech Support')) {
        var container = headers[i].closest('.tahoe-page, .page-wrapper, main, [class*="page"]');
        if (container) {
          var panel = container.querySelector('.glass-card, [class*="panel"]');
          if (panel) {
            panel.style.maxWidth = '800px';
            panel.style.margin = '0 auto';
            panel.style.width = '100%';
          }
        }
        break;
      }
    }
  }

  // ─── INIT ─────────────────────────────────────────────────────
  function init() {
    fixChartClickInterception();
    fixChartLabels();
    relabelStatCards();
    fixTechSupportDOM();

    var debounce = null;
    var observer = new MutationObserver(function () {
      if (debounce || window.__wlMutationGuard) return;
      debounce = setTimeout(function () {
        debounce = null;
        window.__wlMutationGuard = true;
        try { relabelStatCards(); fixTechSupportDOM(); }
        finally { window.__wlMutationGuard = false; }
      }, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
