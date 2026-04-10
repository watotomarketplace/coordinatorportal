// charts-overhaul.js — WL101 Chart.js Global Defaults + Apple-style Plugins
// Runs after Chart.js is available via window.Chart

(function() {
  'use strict'

  // ─── Wait for Chart.js to be available ───────────────────────────────────────
  function whenChartReady(fn) {
    if (window.Chart) { fn(); return }
    const iv = setInterval(() => { if (window.Chart) { clearInterval(iv); fn() } }, 100)
  }

  // ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
  const T = {
    blue:    '#6366f1',
    green:   '#34C759',
    amber:   '#FF9F0A',
    red:     '#FF453A',
    purple:  '#8b5cf6',
    teal:    '#0EA5E9',
    indigo:  '#6366f1',

    textPrimary:   'rgba(255,255,255,0.92)',
    textSecondary: 'rgba(255,255,255,0.60)',
    textMuted:     'rgba(255,255,255,0.28)',

    gridLine:      'rgba(255,255,255,0.06)',
    gridLineMid:   'rgba(255,255,255,0.10)',

    tooltipBg:     '#1c1c2a',
    tooltipBorder: 'rgba(255,255,255,0.12)',
  }

  // ─── GRADIENT FACTORY ─────────────────────────────────────────────────────────
  function makeAreaGradient(ctx, color, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height || 280)
    const rgb = hexToRgb(color)
    if (rgb) {
      gradient.addColorStop(0,   'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.55)')
      gradient.addColorStop(0.4, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.25)')
      gradient.addColorStop(1,   'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.00)')
    } else {
      gradient.addColorStop(0, 'rgba(74,158,255,0.55)')
      gradient.addColorStop(1, 'rgba(74,158,255,0.00)')
    }
    return gradient
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  function makeBarGradient(ctx, color, chartHeight) {
    const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight || 280)
    const rgb = hexToRgb(color)
    if (rgb) {
      gradient.addColorStop(0,   'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',1.0)')
      gradient.addColorStop(1,   'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.7)')
    }
    return gradient
  }

  // ─── GLOBAL CHART.JS DEFAULTS ────────────────────────────────────────────────
  function applyGlobalDefaults() {
    const C = window.Chart
    if (!C || !C.defaults) return

    C.defaults.font.family = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    C.defaults.font.size = 12
    C.defaults.color = T.textSecondary
    C.defaults.borderColor = T.gridLine
    C.defaults.responsive = true
    C.defaults.maintainAspectRatio = false

    C.defaults.animation = {
      duration: 650,
      easing: 'easeOutQuart',
    }

    if (C.defaults.elements?.line) {
      C.defaults.elements.line.tension = 0.42
      C.defaults.elements.line.borderWidth = 2.5
      C.defaults.elements.line.borderCapStyle = 'round'
      C.defaults.elements.line.fill = false
    }

    if (C.defaults.elements?.point) {
      C.defaults.elements.point.radius = 0
      C.defaults.elements.point.hoverRadius = 5
      C.defaults.elements.point.hitRadius = 20
    }

    if (C.defaults.elements?.bar) {
      C.defaults.elements.bar.borderRadius = 6
      C.defaults.elements.bar.borderSkipped = 'bottom'
      C.defaults.elements.bar.borderWidth = 0
    }

    if (C.defaults.scales) {
      var scaleDefaults = {
        grid: {
          color: T.gridLine,
          tickColor: 'transparent',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: T.textMuted,
          maxTicksLimit: 5,
          padding: 8,
          font: { size: 11, weight: '500' }
        }
      }
      if (C.defaults.scales.linear) Object.assign(C.defaults.scales.linear, scaleDefaults)
      if (C.defaults.scales.category) Object.assign(C.defaults.scales.category, scaleDefaults)
      if (C.defaults.scales.time) Object.assign(C.defaults.scales.time, scaleDefaults)
    }

    if (C.defaults.plugins) {
      // Detailed keys on every chart: mutate existing nested legend defaults
      // in place (DO NOT replace the object — Chart.js's legend plugin reads
      // sub-keys like legend.title.font that would become undefined and
      // crash the React render with "Cannot read properties of undefined
      // (reading 'font')").
      if (C.defaults.plugins.legend) {
        C.defaults.plugins.legend.display = true
        C.defaults.plugins.legend.position = 'bottom'
        C.defaults.plugins.legend.align = 'center'
        if (!C.defaults.plugins.legend.labels) C.defaults.plugins.legend.labels = {}
        var lblDefaults = C.defaults.plugins.legend.labels
        lblDefaults.color = T.textSecondary
        lblDefaults.usePointStyle = true
        lblDefaults.pointStyle = 'circle'
        lblDefaults.boxWidth = 8
        lblDefaults.boxHeight = 8
        lblDefaults.padding = 14
        if (!lblDefaults.font) lblDefaults.font = {}
        lblDefaults.font.family = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
        lblDefaults.font.size = 12
        lblDefaults.font.weight = '500'
      }

      // Tooltip: mutate in place so any nested defaults Chart.js internals
      // read (e.g. animation, callbacks) remain intact.
      if (C.defaults.plugins.tooltip) {
        var tt = C.defaults.plugins.tooltip
        tt.enabled = true
        tt.mode = 'index'
        tt.intersect = false
        tt.backgroundColor = T.tooltipBg
        tt.borderColor = T.tooltipBorder
        tt.borderWidth = 1
        tt.titleColor = T.textPrimary
        tt.bodyColor = T.textSecondary
        tt.padding = { top: 10, right: 14, bottom: 10, left: 14 }
        tt.cornerRadius = 12
        if (!tt.titleFont) tt.titleFont = {}
        tt.titleFont.size = 12
        tt.titleFont.weight = '600'
        tt.titleFont.family = "'Plus Jakarta Sans', sans-serif"
        if (!tt.bodyFont) tt.bodyFont = {}
        tt.bodyFont.size = 12
        tt.bodyFont.family = "'Plus Jakarta Sans', sans-serif"
        tt.displayColors = true
        tt.boxWidth = 8
        tt.boxHeight = 8
        tt.boxPadding = 4
        tt.caretSize = 6
        tt.caretPadding = 8
      }
    }

    console.log('[WL101] Chart.js defaults applied')
  }

  // ─── CROSSHAIR PLUGIN ─────────────────────────────────────────────────────────
  var crosshairPlugin = {
    id: 'wl101-crosshair',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx
      var chartArea = chart.chartArea
      var tooltip = chart.tooltip
      if (!tooltip || !tooltip._active || !tooltip._active.length) return

      var x = tooltip._active[0].element.x
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x, chartArea.top)
      ctx.lineTo(x, chartArea.bottom)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.restore()
    }
  }

  // ─── AVERAGE LINE PLUGIN ──────────────────────────────────────────────────────
  var averageLinePlugin = {
    id: 'wl101-avgline',
    afterDatasetsDraw: function(chart) {
      if (!chart.options.plugins?.showAverageLine) return

      var ctx = chart.ctx
      var chartArea = chart.chartArea
      var scales = chart.scales
      var dataset = chart.data.datasets[0]
      if (!dataset?.data?.length) return

      var nums = dataset.data.filter(function(v) { return typeof v === 'number' })
      var avg = nums.reduce(function(a, b) { return a + b }, 0) / (nums.length || 1)
      var y = scales.y.getPixelForValue(avg)

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(chartArea.left, y)
      ctx.lineTo(chartArea.right, y)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1
      ctx.setLineDash([6, 4])
      ctx.stroke()
      ctx.restore()
    }
  }

  // ─── REGISTER PLUGINS ─────────────────────────────────────────────────────────
  function registerPlugins() {
    // The real Chart.js Filler plugin was tree-shaken out of the React bundle,
    // but react-chartjs-2 datasets use `fill: true` which makes Chart.js warn
    // "Tried to use the 'fill' option without the 'Filler' plugin enabled".
    // We register a no-op stub plugin with id 'filler' so the existence check passes;
    // actual area fills are drawn by our own gradientPlugin via backgroundColor.
    var fillerStub = {
      id: 'filler',
      beforeDatasetsDraw: function () { /* no-op */ }
    }
    try {
      var reg = window.Chart.registry && window.Chart.registry.plugins
      var alreadyHasFiller = reg && reg.items && reg.items.filler
      if (!alreadyHasFiller) {
        window.Chart.register(fillerStub)
      }
    } catch (e) { /* non-fatal */ }

    window.Chart.register(crosshairPlugin, averageLinePlugin, gradientPlugin)
  }

  // ─── GRADIENT PLUGIN ───────────────────────────────────────────────────────────
  // Applies gradients via a beforeInit hook instead of wrapping the constructor,
  // which would break Chart.js internals (plugin position lookups, instanceof, etc.)
  var gradientPlugin = {
    id: 'wl101-gradient',
    beforeInit: function(chart) {
      var ctx = chart.ctx
      if (!ctx) return
      var chartHeight = chart.canvas.offsetHeight || 280
      var colors = [T.blue, T.green, T.purple, T.amber]

      if (chart.config.type === 'line') {
        chart.config.data.datasets.forEach(function(ds, i) {
          if (ds.fill === true || ds.fill === '+1' || ds.fill === 'origin') {
            var baseColor = ds.borderColor || colors[i % 4]
            ds.backgroundColor = makeAreaGradient(ctx, baseColor, chartHeight)
          }
        })
      }

      if (chart.config.type === 'bar') {
        chart.config.data.datasets.forEach(function(ds, i) {
          if (!ds.backgroundColor || typeof ds.backgroundColor === 'string') {
            var baseColor = ds.backgroundColor || colors[i % 4]
            if (typeof baseColor === 'string' && baseColor.startsWith('#')) {
              ds.backgroundColor = makeBarGradient(ctx, baseColor, chartHeight)
            }
          }
        })
      }
    }
  }

  // ─── INITIALISE ───────────────────────────────────────────────────────────────
  whenChartReady(function() {
    applyGlobalDefaults()
    registerPlugins()
    console.log('[WL101] Charts Overhaul active')
  })

  // Export tokens for other addons
  window.__CHART_TOKENS__ = T

})()
