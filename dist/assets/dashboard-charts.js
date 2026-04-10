// dashboard-charts.js — WL101 Formation Layer Charts
// Adds formation-specific charts BELOW the React dashboard charts.
// DOES NOT destroy or replace React's built-in charts.

(function() {
  'use strict'

  var COLORS = {
    blue:   '#6366f1',
    green:  '#34C759',
    amber:  '#FF9F0A',
    red:    '#FF453A',
    purple: '#8b5cf6',
    teal:   '#0EA5E9',
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────────

  function weekLabels(count) {
    return Array.from({ length: count }, function(_, i) { return 'Wk ' + (i + 1) })
  }

  function makeCanvas(height) {
    height = height || 260
    var wrap = document.createElement('div')
    wrap.style.cssText = 'position:relative;width:100%;height:' + height + 'px;'
    var canvas = document.createElement('canvas')
    wrap.appendChild(canvas)
    return { wrap: wrap, canvas: canvas }
  }

  function chartCard(title, subtitle, colorDot) {
    var card = document.createElement('div')
    card.className = 'wl101-chart-card'

    var header = document.createElement('div')
    header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:16px'

    if (colorDot) {
      var dot = document.createElement('span')
      dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + colorDot + ';flex-shrink:0'
      header.appendChild(dot)
    }

    var titleEl = document.createElement('div')
    titleEl.style.cssText = 'flex:1'
    titleEl.innerHTML = '<div style="font-size:15px;font-weight:600;color:var(--text-primary,rgba(255,255,255,0.92));letter-spacing:-0.2px">' + title + '</div>' +
      (subtitle ? '<div style="font-size:12px;color:var(--text-tertiary,rgba(255,255,255,0.38));margin-top:2px">' + subtitle + '</div>' : '')
    header.appendChild(titleEl)
    card.appendChild(header)

    return card
  }

  function legend(items) {
    var el = document.createElement('div')
    el.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:12px'
    items.forEach(function(item) {
      var row = document.createElement('div')
      row.style.cssText = 'display:flex;align-items:center;gap:6px'
      row.innerHTML = '<span style="width:8px;height:8px;border-radius:2px;background:' + item.color + ';flex-shrink:0"></span>' +
        '<span style="font-size:11px;color:var(--text-secondary,rgba(255,255,255,0.5));font-weight:500">' + item.label + '</span>'
      el.appendChild(row)
    })
    return el
  }

  // ─── CHART: ENGAGEMENT TREND ─────────────────────────────────────────────────

  function buildEngagementChart(container, data) {
    var card = chartCard('Engagement Trend', 'Weekly group engagement levels', COLORS.blue)
    var cv = makeCanvas(260)
    card.appendChild(cv.wrap)

    var trend = data.engagementTrend || []
    if (!trend.length) {
      cv.wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary,rgba(255,255,255,0.3));font-size:13px">No engagement data yet</div>'
      container.appendChild(card)
      return
    }

    var weeks  = trend.map(function(d) { return 'Wk ' + d.week_number })
    var high   = trend.map(function(d) { return d.high_count || 0 })
    var medium = trend.map(function(d) { return d.medium_count || 0 })
    var low    = trend.map(function(d) { return d.low_count || 0 })

    new window.Chart(cv.canvas, {
      type: 'line',
      data: {
        labels: weeks,
        datasets: [
          { label: 'High', data: high, borderColor: COLORS.green, fill: false, tension: 0.4, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 6 },
          { label: 'Medium', data: medium, borderColor: COLORS.amber, fill: false, tension: 0.4, borderWidth: 2, pointRadius: 3, pointHoverRadius: 6 },
          { label: 'Low', data: low, borderColor: COLORS.red, fill: false, tension: 0.4, borderWidth: 2, pointRadius: 3, pointHoverRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
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
          },
          tooltip: {
            callbacks: {
              label: function(item) { return ' ' + item.dataset.label + ': ' + item.raw + ' groups' }
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 }, stepSize: 1 } }
        }
      }
    })

    card.appendChild(legend([
      { color: COLORS.green, label: 'High Engagement' },
      { color: COLORS.amber, label: 'Medium' },
      { color: COLORS.red,   label: 'Low' },
    ]))
    container.appendChild(card)
  }

  // ─── CHART: REPORTING COMPLIANCE ─────────────────────────────────────────────

  function buildComplianceChart(container, data) {
    var card = chartCard('Reporting Compliance', 'Weekly report submissions by campus', COLORS.teal)
    var campuses  = (data.campuses || []).map(function(c) { return c.celebration_point })
    var submitted = (data.campuses || []).map(function(c) { return c.submitted || 0 })
    var missing   = (data.campuses || []).map(function(c) { return c.missing || 0 })

    if (!campuses.length) {
      var empty = document.createElement('div')
      empty.style.cssText = 'padding:48px 20px;text-align:center;color:var(--text-tertiary,rgba(255,255,255,0.3));font-size:13px'
      empty.textContent = 'No campus reporting data yet'
      card.appendChild(empty)
      container.appendChild(card)
      return
    }

    var cv = makeCanvas(Math.max(260, campuses.length * 28))
    card.appendChild(cv.wrap)

    new window.Chart(cv.canvas, {
      type: 'bar',
      data: {
        labels: campuses,
        datasets: [
          { label: 'Submitted', data: submitted, backgroundColor: COLORS.green, borderRadius: 4, borderSkipped: false },
          { label: 'Missing', data: missing, backgroundColor: 'rgba(255,69,58,0.5)', borderRadius: 4, borderSkipped: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
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
          },
          tooltip: { callbacks: { label: function(item) { return ' ' + item.dataset.label + ': ' + item.raw + ' groups' } } }
        },
        scales: {
          x: { stacked: true, beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 }, stepSize: 1 } },
          y: { stacked: true, grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } } }
        }
      }
    })

    card.appendChild(legend([
      { color: COLORS.green, label: 'Submitted' },
      { color: 'rgba(255,69,58,0.6)', label: 'Missing' },
    ]))
    container.appendChild(card)
  }

  // ─── CHART: PASTORAL CONCERNS ────────────────────────────────────────────────

  function buildPastoralChart(container, data) {
    var card = chartCard('Pastoral Concerns', 'Flags raised per week', COLORS.amber)
    var cv = makeCanvas(200)
    card.appendChild(cv.wrap)

    var weekMap = {}
    ;(data.pastoralConcerns || []).forEach(function(c) {
      var wk = c.week_number || 0
      weekMap[wk] = (weekMap[wk] || 0) + 1
    })

    var maxWeek = Math.max(13, ...Object.keys(weekMap).map(Number))
    var labels = weekLabels(maxWeek)
    var counts = Array.from({ length: maxWeek }, function(_, i) { return weekMap[i + 1] || 0 })
    var bgColors = counts.map(function(c) {
      return c === 0 ? 'rgba(255,255,255,0.06)' : c === 1 ? COLORS.amber : COLORS.red
    })

    new window.Chart(cv.canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label: 'Concerns', data: counts, backgroundColor: bgColors, borderRadius: 4, borderSkipped: false }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
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
          },
          tooltip: { callbacks: { label: function(item) { return ' ' + item.raw + ' concern' + (item.raw !== 1 ? 's' : '') + ' raised' } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 }, stepSize: 1 } }
        }
      }
    })
    container.appendChild(card)
  }

  // ─── CHART: STUDENT PROGRESS DONUT ───────────────────────────────────────────

  function buildProgressDonut(container, students) {
    var card = chartCard('Student Progress', 'Completion distribution across all students', COLORS.purple)

    // Use correct 0-100 integer thresholds (NOT 0-1 decimals)
    var onTrack = students.filter(function(s) { return (s.progress || 0) >= 75 }).length
    var inProgress = students.filter(function(s) { var p = s.progress || 0; return p >= 30 && p < 75 }).length
    var needsHelp = students.filter(function(s) { return (s.progress || 0) < 30 }).length
    var total = onTrack + inProgress + needsHelp

    // Summary pills
    var pills = document.createElement('div')
    pills.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px'
    var pillData = [
      { label: 'On Track (75%+)', value: onTrack, color: COLORS.green },
      { label: 'In Progress', value: inProgress, color: COLORS.blue },
      { label: 'Needs Help', value: needsHelp, color: COLORS.red },
    ]
    pillData.forEach(function(p) {
      var pill = document.createElement('div')
      pill.style.cssText = 'background:var(--bg-tertiary,#242436);border-radius:12px;padding:10px 12px;text-align:center;border:1px solid var(--border-subtle,rgba(255,255,255,0.06))'
      pill.innerHTML = '<div style="font-size:22px;font-weight:700;color:' + p.color + ';letter-spacing:-0.5px">' + p.value.toLocaleString() + '</div>' +
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.3px;color:var(--text-tertiary,rgba(255,255,255,0.38));margin-top:3px;font-weight:600">' + p.label + '</div>'
      pills.appendChild(pill)
    })
    card.appendChild(pills)

    var cv = makeCanvas(200)
    cv.wrap.style.maxWidth = '200px'
    cv.wrap.style.margin = '0 auto'
    card.appendChild(cv.wrap)

    new window.Chart(cv.canvas, {
      type: 'doughnut',
      data: {
        labels: ['On Track (75%+)', 'In Progress (30-74%)', 'Needs Help (<30%)'],
        datasets: [{
          data: [onTrack, inProgress, needsHelp],
          backgroundColor: [COLORS.green, COLORS.blue, 'rgba(255,69,58,0.7)'],
          borderWidth: 0, borderRadius: 4, spacing: 2, hoverOffset: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
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
          },
          tooltip: {
            callbacks: {
              label: function(item) {
                var pct = total ? Math.round((item.raw / total) * 100) : 0
                return ' ' + item.label + ': ' + item.raw.toLocaleString() + ' (' + pct + '%)'
              }
            }
          }
        }
      }
    })

    // Center label
    var centre = document.createElement('div')
    centre.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none'
    centre.innerHTML = '<div style="font-size:28px;font-weight:700;color:var(--text-primary,rgba(255,255,255,0.92));letter-spacing:-1px;line-height:1">' + total.toLocaleString() + '</div>' +
      '<div style="font-size:10px;color:var(--text-tertiary,rgba(255,255,255,0.38));text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-top:2px">Students</div>'
    cv.wrap.style.position = 'relative'
    cv.wrap.appendChild(centre)

    container.appendChild(card)
  }

  // ─── CHART: RISK DISTRIBUTION BAR ────────────────────────────────────────────

  function buildRiskSummary(container, students) {
    var card = chartCard('Risk Distribution', 'Students by risk category', COLORS.amber)

    var healthy = students.filter(function(s) { return s.risk_category === 'Healthy' }).length
    var attention = students.filter(function(s) { return s.risk_category === 'Attention' }).length
    var critical = students.filter(function(s) { return s.risk_category === 'Critical' }).length
    var total = healthy + attention + critical

    if (total === 0) {
      var empty = document.createElement('div')
      empty.style.cssText = 'text-align:center;padding:32px;color:var(--text-tertiary,rgba(255,255,255,0.3));font-size:13px'
      empty.textContent = 'No risk data yet'
      card.appendChild(empty)
      container.appendChild(card)
      return
    }

    // Proportional bar
    var barWrap = document.createElement('div')
    barWrap.style.cssText = 'display:flex;gap:2px;height:12px;border-radius:6px;overflow:hidden;margin-bottom:20px'
    var segments = [
      { color: COLORS.green, value: healthy, label: 'Healthy', pct: Math.round(healthy / total * 100) },
      { color: COLORS.amber, value: attention, label: 'Attention', pct: Math.round(attention / total * 100) },
      { color: COLORS.red, value: critical, label: 'Critical', pct: Math.round(critical / total * 100) },
    ]
    segments.forEach(function(s) {
      if (s.value === 0) return
      var seg = document.createElement('div')
      seg.style.cssText = 'flex:' + s.value + ';background:' + s.color + ';transition:flex 0.5s ease'
      barWrap.appendChild(seg)
    })
    card.appendChild(barWrap)

    // Stats row
    var stats = document.createElement('div')
    stats.style.cssText = 'display:flex;gap:24px'
    segments.forEach(function(s) {
      var item = document.createElement('div')
      item.innerHTML = '<div style="font-size:24px;font-weight:700;color:' + s.color + ';letter-spacing:-0.5px">' + s.value.toLocaleString() + '</div>' +
        '<div style="font-size:11px;color:var(--text-tertiary,rgba(255,255,255,0.38));font-weight:600;text-transform:uppercase;letter-spacing:0.3px;margin-top:2px">' + s.label + ' (' + s.pct + '%)</div>'
      stats.appendChild(item)
    })
    card.appendChild(stats)

    container.appendChild(card)
  }

  // ─── ENHANCE REACT CHARTS (fix empty Engagement Over Time) ────────────────────
  // CRITICAL: never replace the innerHTML of a React-rendered container —
  // that detaches React-owned children and triggers "Failed to execute
  // 'removeChild' on 'Node'" when React later tries to unmount them.
  // Instead, we leave React's canvas in place (hidden) and append our own
  // overlay div as a sibling. React never learns about the overlay and its
  // own children remain reachable in the DOM.

  function enhanceReactCharts() {
    var chartCards = document.querySelectorAll('.chart-card')
    chartCards.forEach(function(card) {
      var title = card.querySelector('.chart-title')
      if (!title) return
      var text = title.textContent.trim()

      if (text !== 'Engagement Over Time') return
      var container = card.querySelector('.chart-container')
      if (!container) return
      if (container.dataset.wl101EmptyOverlay === '1') return

      var canvas = container.querySelector('canvas')
      if (!canvas) return
      var chart = window.Chart && window.Chart.getChart(canvas)
      if (!chart) return

      var hasData = chart.data.datasets.some(function(ds) {
        return ds.data && ds.data.some(function(v) { return v > 0 })
      })
      if (hasData) return

      // Hide React's canvas (keep the node in place — React still owns it)
      canvas.style.visibility = 'hidden'

      // Append an addon-owned overlay; React knows nothing about this node
      // so it's safe to mutate/remove from JS without tripping reconciliation.
      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative'
      }
      var overlay = document.createElement('div')
      overlay.className = 'wl101-empty-overlay'
      overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary,rgba(255,255,255,0.3));font-size:13px;text-align:center;padding:20px;pointer-events:none;'
      overlay.innerHTML = 'Engagement data is tracked through the<br>Formation Layer charts below'
      container.appendChild(overlay)
      container.dataset.wl101EmptyOverlay = '1'
    })
  }

  // ─── INJECT FORMATION CHARTS SECTION ─────────────────────────────────────────

  async function injectFormationCharts() {
    // Only run on dashboard
    var path = window.location.pathname
    if (path !== '/dashboard' && path !== '/') return

    // Don't duplicate
    if (document.getElementById('wl101-formation-charts')) return

    // Wait for Chart.js
    if (!window.Chart) {
      setTimeout(injectFormationCharts, 300)
      return
    }

    // Wait for React to render charts section
    var chartsSection = document.querySelector('.charts-section')
    if (!chartsSection) {
      setTimeout(injectFormationCharts, 300)
      return
    }

    // Enhance existing React charts (fix empty ones)
    setTimeout(enhanceReactCharts, 500)

    // Fetch data
    var formationData = {}
    var students = []

    try {
      var responses = await Promise.all([
        fetch('/api/formation-dashboard').then(function(r) { return r.json() }).catch(function() { return {} }),
        fetch('/api/data/students').then(function(r) { return r.json() }).catch(function() { return {} }),
      ])

      formationData = responses[0].success ? responses[0] : {}
      students = responses[1].students || []
    } catch (e) {
      console.warn('[WL101] Formation chart data fetch failed:', e)
    }

    // Create formation section BELOW existing React charts
    var section = document.createElement('div')
    section.id = 'wl101-formation-charts'
    section.style.cssText = 'margin-top:var(--s-7, 32px)'

    // Section header
    var header = document.createElement('div')
    header.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:var(--s-5, 20px)'
    header.innerHTML = '<div style="font-size:20px;font-weight:700;color:var(--text-primary,rgba(255,255,255,0.92));letter-spacing:-0.3px">Formation Layer</div>' +
      '<div style="font-size:13px;color:var(--text-tertiary,rgba(255,255,255,0.38))">Group reports, engagement & risk</div>'
    section.appendChild(header)

    // Chart grid
    var grid = document.createElement('div')
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:var(--s-5, 20px)'
    section.appendChild(grid)

    // Build all formation charts
    buildEngagementChart(grid, formationData)
    buildComplianceChart(grid, formationData)
    buildProgressDonut(grid, students)
    buildPastoralChart(grid, formationData)
    buildRiskSummary(grid, students)

    // Insert after charts section (or at end of parent)
    var parent = chartsSection.parentNode
    if (parent) {
      var nextEl = chartsSection.nextSibling
      if (nextEl) {
        parent.insertBefore(section, nextEl)
      } else {
        parent.appendChild(section)
      }
    }

    console.log('[WL101] Formation charts injected')
  }

  // ─── OBSERVE PAGE CHANGES ────────────────────────────────────────────────────

  var lastPath = ''
  var observer = new MutationObserver(function() {
    var path = window.location.pathname
    if (path !== lastPath) {
      lastPath = path
      if (path === '/dashboard' || path === '/') {
        setTimeout(injectFormationCharts, 600)
      }
    }
  })

  document.addEventListener('DOMContentLoaded', function() {
    observer.observe(document.body, { childList: true, subtree: true })
    if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
      setTimeout(injectFormationCharts, 600)
    }
  })

})()
