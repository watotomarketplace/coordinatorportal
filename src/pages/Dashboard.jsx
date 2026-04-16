import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { getDashboardStats, getAttendanceDashboard } from '../lib/api'
import api from '../lib/api'
import { CELEBRATION_POINTS } from '../constants/campuses'
import {
  Chart as ChartJS,
  ArcElement, CategoryScale, LinearScale, BarElement,
  Tooltip, Legend, PointElement, LineElement, Filler,
  BarController, LineController, DoughnutController,
} from 'chart.js'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import GlassCard from '../components/GlassCard'
import { DashboardWidget } from '../components/AttendanceDashboard'
import {
  Users, TrendingUp, AlertTriangle, CheckCircle, Activity,
  ChevronRight, Calendar, Target, BarChart3, PieChart,
  Clock, UserCheck, Users as UsersIcon, Flag, MessageSquare
} from 'lucide-react'

ChartJS.register(
  ArcElement, CategoryScale, LinearScale, BarElement,
  Tooltip, Legend, PointElement, LineElement, Filler,
  BarController, LineController, DoughnutController,
)

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 },
    },
    tooltip: {
      backgroundColor: 'rgba(20,20,32,0.95)',
      titleColor: 'rgba(255,255,255,0.9)',
      bodyColor: 'rgba(255,255,255,0.7)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: { display: false },
    y: { display: false },
  },
}

function KPICard({ icon, label, value, change, changeType, color }) {
  const Icon = icon
  return (
    <div className="kpi-card">
      <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {Icon && <Icon size={16} />}
        {label}
      </div>
      <div className="kpi-value" style={{ color: color || 'var(--text-primary)' }}>
        {value ?? '—'}
      </div>
      {change !== undefined && (
        <div className={`kpi-change ${changeType || 'neutral'}`}>
          {change}
        </div>
      )}
    </div>
  )
}

function GaugeWidget({ label, value, max, color, icon }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const gaugeColor = color || (pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)')

  return (
    <GlassCard className="gauge-card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 10px' }}>
        <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke={gaugeColor} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${pct * 2.136} 213.6`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: gaugeColor,
        }}>{pct}%</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{value} / {max}</div>
    </GlassCard>
  )
}

function AlertBar({ icon, title, count, color, onClick }) {
  return (
    <div className="alert-bar" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className={`alert-icon ${color}`}>
        {icon}
      </div>
      <div className="alert-info">
        <div className="alert-title">{title}</div>
        <div className="alert-meta">{count} student{count !== 1 ? 's' : ''} need attention</div>
      </div>
      {onClick && <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />}
    </div>
  )
}

function HorizontalProgressBar({ label, value, max, color, showPercentage = true }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0
  const barColor = color || (percentage >= 70 ? 'var(--success)' : percentage >= 40 ? 'var(--warning)' : 'var(--danger)')

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>
          {showPercentage ? `${percentage}%` : `${value}/${max}`}
        </span>
      </div>
      <div style={{
        height: 8,
        borderRadius: 4,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: barColor,
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
      {!showPercentage && (
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textAlign: 'right' }}>
          {value} students
        </div>
      )}
    </div>
  )
}

function FormationLayerCard({ title, value, subtitle, icon, color, trend }) {
  return (
    <GlassCard style={{ padding: '16px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: color || 'rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          color: color ? 'inherit' : '#6366f1',
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
        </div>
        {trend && (
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: trend > 0 ? 'var(--success)' : trend < 0 ? 'var(--danger)' : 'var(--text-tertiary)',
          }}>
            {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{subtitle}</div>
    </GlassCard>
  )
}

export default function Dashboard() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const hasRole = useAuthStore(s => s.hasRole)
  const isGlobal = hasRole('Admin') || hasRole('LeadershipTeam')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState(isGlobal ? '' : (user?.celebration_point || ''))

  const handleForceRefresh = async () => {
    try {
      setRefreshing(true)
      await api.post('/api/thinkific/force-refresh')
      window.location.reload() // Force a hard reload of the UI
    } catch (err) {
      console.error('Force refresh failed:', err)
      alert('Failed to force refresh: ' + err.message)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setPageTitle('Dashboard')
  }, [setPageTitle])

  useEffect(() => {
    async function fetchData() {
      try {
        // Use consolidated endpoint — returns correct active students, pastoral
        // concerns, and all chart data aggregated from real sources.
        const params = selectedCampus ? `?campus=${encodeURIComponent(selectedCampus)}` : ''
        const payload = await api.get(`/api/dashboard/all${params}`)
        if (payload?.success) {
          setData(payload)
        } else {
          setData({})
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
        setData({})
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    fetchData()
  }, [selectedCampus])

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <div className="skeleton skeleton-text" style={{ width: '40%', height: 28, marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
        <div className="kpi-row">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton skeleton-row" style={{ height: 100 }} />)}
        </div>
        <div className="chart-grid">
          {[0, 1].map(i => <div key={i} className="skeleton skeleton-row" style={{ height: 260 }} />)}
        </div>
      </div>
    )
  }

  const totalStudents = data?.totalStudents || 0
  const activeStudents = data?.activeStudents || 0
  const completedStudents = data?.completedStudents || 0
  const avgProgress = data?.avgProgress || 0
  const inactiveCount = data?.inactiveCount || 0
  const atRiskCount = data?.atRiskCount || 0
  const atRiskDist = data?.atRiskDist || { healthy: 0, attention: 0, critical: 0 }
  const progressDistribution = data?.progressDistribution || [0, 0, 0, 0, 0]
  const attendanceStats = data?.attendanceStats || { avgAttendance: 0, totalSessions: 0, trend: [] }
  const formationStats = data?.formationStats || { compliance: 0, totalReports: 0, pastoralConcerns: 0, trends: [] }
  const topGroups = data?.topGroups || []

  // Chart data
  const riskData = {
    labels: ['Healthy', 'Attention', 'Critical'],
    datasets: [{
      data: [
        atRiskDist.healthy || 0,
        atRiskDist.attention || 0,
        atRiskDist.critical || 0
      ],
      backgroundColor: ['#34C759', '#FF9F0A', '#FF453A'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }

  const progressData = {
    labels: ['0-19%', '20-39%', '40-59%', '60-79%', '80-100%'],
    datasets: [{
      label: 'Students',
      data: progressDistribution,
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1,
      borderRadius: 4,
    }],
  }

  const trendData = {
    labels: attendanceStats.trend.length > 0 ? attendanceStats.trend.map(t => t.label) : ['W1', 'W2', 'W3', 'W4', 'W5'],
    datasets: [{
      label: 'Attendance %',
      data: attendanceStats.trend.length > 0 ? attendanceStats.trend.map(t => t.value) : [0, 0, 0, 0, 0],
      fill: true,
      backgroundColor: 'rgba(52, 199, 89, 0.1)',
      borderColor: '#34C759',
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#34C759',
    }],
  }

  const completionData = {
    labels: ['On Track (75%+)', 'In Progress (30-74%)', 'Needs Help (<30%)'],
    datasets: [{
      data: Array.isArray(data?.completionStatus) ? data.completionStatus : [0, 0, 0],
      backgroundColor: ['#34C759', '#0A84FF', '#FF453A'],
      borderWidth: 0,
    }],
  }

  const pastoralData = {
    labels: formationStats.trends.length > 0 ? formationStats.trends.map(t => `Week ${t.week}`) : ['W1', 'W2', 'W3'],
    datasets: [{
      label: 'Pastoral Concerns',
      data: formationStats.trends.length > 0 ? formationStats.trends.map(t => t.concerns) : [0, 0, 0],
      fill: true,
      backgroundColor: 'rgba(255, 69, 58, 0.1)',
      borderColor: '#FF453A',
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#FF453A',
    }],
  }

  const courseProgressData = {
    labels: data?.courseProgress?.labels || [],
    datasets: [{
      label: 'Average Progress',
      data: data?.courseProgress?.values || [],
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1,
      borderRadius: 4,
    }],
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
            {getGreeting(user?.name)}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Here's your program overview for {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            {selectedCampus && <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--text-primary)' }}>— {selectedCampus}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Campus Filter */}
          {isGlobal ? (
            <select
              className="form-select"
              value={selectedCampus}
              onChange={e => setSelectedCampus(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '8px 14px',
                color: 'var(--text-primary)',
                fontSize: 13,
                minWidth: 160,
                backdropFilter: 'blur(12px)',
              }}
            >
              <option value="">All Campuses</option>
              {CELEBRATION_POINTS.map(cp => <option key={cp} value={cp}>{cp}</option>)}
            </select>
          ) : (
            <span className="badge badge-info" style={{ fontSize: 13, padding: '6px 14px' }}>
              📍 {user?.celebration_point || 'Unassigned'}
            </span>
          )}

          {/* Force Sync Button (Admin only) */}
          {hasRole('Admin') && (
            <button
              onClick={handleForceRefresh}
              disabled={refreshing}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span className={refreshing ? 'spin' : ''}>🔄</span>
              {refreshing ? 'Refreshing...' : 'Force Sync'}
            </button>
          )}
        </div>
      </div>

      {/* Sync Warning Banner */}
      {!loading && totalStudents === 0 && (
        <div style={{
          background: 'rgba(255, 69, 58, 0.1)',
          border: '1px solid rgba(255, 69, 58, 0.2)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle color="#ff453a" />
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#ff453a', fontSize: 15 }}>Thinkific Sync Pending</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                No students found. Please check Thinkific integration in Admin → Diagnostics to force a raw synchronization.
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/admin/diagnostics')}>
            Go to Diagnostics <ChevronRight size={14} style={{ marginLeft: 4 }} />
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="kpi-row">
        <KPICard icon={Users} label="Total Enrolled" value={totalStudents.toLocaleString()} />
        <KPICard icon={Activity} label="Active Students" value={activeStudents.toLocaleString()} color="var(--success)" />
        <KPICard icon={TrendingUp} label="On Track" value={`${atRiskDist.healthy || 0}`} color="var(--info)" />
        <KPICard icon={CheckCircle} label="Avg Progress" value={`${avgProgress}%`} color="var(--accent-light)" />
      </div>

      {/* Alert Bars */}
      {(inactiveCount > 0 || atRiskCount > 0) && (
        <div className="alert-bars">
          <AlertBar
            icon={<AlertTriangle size={16} />}
            title="Students at Risk"
            count={atRiskCount}
            color="danger"
            onClick={() => navigate('/students?filter=at-risk')}
          />
          <AlertBar
            icon={<Activity size={16} />}
            title="Recent Inactivity"
            count={inactiveCount}
            color="warning"
            onClick={() => navigate('/students?filter=inactive')}
          />
          <AlertBar
            icon={<MessageSquare size={16} />}
            title="Pastoral Concerns"
            count={formationStats.pastoralConcerns}
            color="info"
            onClick={() => navigate('/weekly-reports')}
          />
        </div>
      )}

      {/* Inactivity Progress Bars */}
      {inactiveCount > 0 && (
        <GlassCard className="chart-card" style={{ marginBottom: 24 }}>
          <div className="chart-title" style={{ marginBottom: '20px', fontWeight: 600, fontSize: '15px' }}>
            <Clock size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Student Inactivity
          </div>
          <HorizontalProgressBar
            label="Critical Inactivity (>30 days)"
            value={atRiskDist.critical || 0}
            max={totalStudents}
            color="#FF453A"
          />
          <HorizontalProgressBar
            label="Needs Attention (>14 days)"
            value={atRiskDist.attention || 0}
            max={totalStudents}
            color="#FF9F0A"
          />
        </GlassCard>
      )}

      {/* Charts Grid */}
      <div className="chart-grid">
        {/* Risk Donut with Center Total */}
        <GlassCard className="chart-card">
          <div className="chart-title" style={{ marginBottom: '16px', fontWeight: 600, fontSize: '15px' }}>Student Risk Overview</div>
          <div className="chart-container" style={{ position: 'relative', height: '220px' }}>
            <Doughnut data={riskData} options={{
              ...chartDefaults,
              cutout: '65%',
              scales: undefined,
              plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                  ...chartDefaults.plugins.tooltip,
                  callbacks: {
                    label: (context) => {
                      const value = context.raw;
                      const percentage = totalStudents > 0 ? Math.round((value / totalStudents) * 100) : 0;
                      return `${context.label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              }
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{totalStudents}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Total Students</div>
            </div>
          </div>
        </GlassCard>

        {/* Course Progress Horizontal Bar */}
        <GlassCard className="chart-card">
          <div className="chart-title" style={{ marginBottom: '16px', fontWeight: 600, fontSize: '15px' }}>Average Progress per Course</div>
          <div className="chart-container" style={{ position: 'relative', height: '220px' }}>
            {courseProgressData.labels.length > 0 ? (
              <Bar
                data={courseProgressData}
                options={{
                  ...chartDefaults,
                  indexAxis: 'y',
                  scales: {
                    x: {
                      display: true,
                      grid: { color: 'rgba(255,255,255,0.04)' },
                      ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
                      min: 0,
                      max: 100
                    },
                    y: {
                      display: true,
                      grid: { display: false },
                      ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } }
                    },
                  },
                }}
              />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                No course data available
              </div>
            )}
            <div style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(20,20,32,0.8)',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              Benchmark: 64%
            </div>
          </div>
        </GlassCard>

        {/* Progress Distribution */}
        <GlassCard className="chart-card">
          <div className="chart-title" style={{ marginBottom: '16px', fontWeight: 600, fontSize: '15px' }}>Progress Distribution</div>
          <div className="chart-container" style={{ position: 'relative', height: '220px' }}>
            <Bar data={progressData} options={{
              ...chartDefaults,
              scales: {
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } } },
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)' } },
              },
            }} />
          </div>
        </GlassCard>

        {/* Attendance Trend */}
        <GlassCard className="chart-card">
          <div className="chart-title" style={{ marginBottom: '16px', fontWeight: 600, fontSize: '15px' }}>Attendance Over Time</div>
          <div className="chart-container" style={{ position: 'relative', height: '220px' }}>
            <Line data={trendData} options={{
              ...chartDefaults,
              scales: {
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } } },
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)' }, min: 0, max: 100 },
              },
            }} />
          </div>
        </GlassCard>

        {/* Pastoral Concerns */}
        <GlassCard className="chart-card">
          <div className="chart-title" style={{ marginBottom: '16px', fontWeight: 600, fontSize: '15px' }}>Pastoral Concerns Trend</div>
          <div className="chart-container" style={{ position: 'relative', height: '220px' }}>
            <Line data={pastoralData} options={{
              ...chartDefaults,
              scales: {
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } } },
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }, beginAtZero: true },
              },
            }} />
          </div>
        </GlassCard>

        {/* Completion Status */}
        <GlassCard className="chart-card">
          <div className="chart-title" style={{ marginBottom: '16px', fontWeight: 600, fontSize: '15px' }}>Milestone Progress</div>
          <div className="chart-container" style={{ position: 'relative', height: '220px' }}>
            <Doughnut data={completionData} options={{
              ...chartDefaults,
              cutout: '65%',
              scales: undefined,
            }} />
          </div>
        </GlassCard>
      </div>

      {/* Formation Layer Section */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={18} /> Formation Layer
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          <FormationLayerCard
            title="Attendance"
            value={attendanceStats.avgAttendance > 0 ? `${Math.round(attendanceStats.avgAttendance)}%` : '—'}
            subtitle={`${attendanceStats.totalSessions} sessions recorded`}
            icon={<Calendar size={16} />}
            color="rgba(52, 199, 89, 0.2)"
          />
          <FormationLayerCard
            title="Reporting Compliance"
            value={`${formationStats.compliance}%`}
            subtitle={`${formationStats.totalReports} reports submitted`}
            icon={<CheckCircle size={16} />}
            color="rgba(0, 132, 255, 0.2)"
          />
          <FormationLayerCard
            title="Pastoral Concerns"
            value={formationStats.pastoralConcerns}
            subtitle="requiring follow-up"
            icon={<Flag size={16} />}
            color="rgba(255, 69, 58, 0.2)"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <GlassCard style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Student Progress Summary</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Total: {totalStudents}</div>
            </div>
            <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                flex: data?.completionStatus?.[0] || 0,
                background: '#34C759',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 600,
              }}>{data?.completionStatus?.[0] > 0 ? 'On Track' : ''}</div>
              <div style={{
                flex: data?.completionStatus?.[1] || 0,
                background: '#0A84FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 600,
              }}>{data?.completionStatus?.[1] > 0 ? 'In Progress' : ''}</div>
              <div style={{
                flex: data?.completionStatus?.[2] || 0,
                background: '#FF453A',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 600,
              }}>{data?.completionStatus?.[2] > 0 ? 'Needs Help' : ''}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34C759' }} />
                <span style={{ color: 'var(--text-secondary)' }}>On Track: </span>
                <span style={{ fontWeight: 600 }}>{data?.completionStatus?.[0] || 0}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0A84FF' }} />
                <span style={{ color: 'var(--text-secondary)' }}>In Progress: </span>
                <span style={{ fontWeight: 600 }}>{data?.completionStatus?.[1] || 0}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF453A' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Needs Help: </span>
                <span style={{ fontWeight: 600 }}>{data?.completionStatus?.[2] || 0}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '16px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Top Groups by Sessions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topGroups.length > 0 ? topGroups.map((g, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <span style={{ color: 'var(--text-tertiary)', width: 14 }}>{i+1}.</span>
                     <span style={{ fontWeight: 500 }}>{g.group_code}</span>
                   </div>
                   <div style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{g.sessions} sessions</div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 11, padding: '10px 0' }}>No session data</div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Gauges */}
      <div className="gauge-row">
        <GaugeWidget 
          label="Attendance" 
          value={Math.round(attendanceStats.avgAttendance || 0)} 
          max={100} 
          icon={<Calendar size={20} />} 
        />
        <GaugeWidget 
          label="Reporting" 
          value={formationStats.compliance} 
          max={100} 
          icon={<MessageSquare size={20} />} 
        />
        <GaugeWidget 
          label="Risk Level" 
          value={atRiskCount} 
          max={totalStudents || 1} 
          color={atRiskCount > (totalStudents * 0.2) ? 'var(--danger)' : 'var(--warning)'}
          icon={<AlertTriangle size={20} />} 
        />
      </div>

      {/* Attendance Widget */}
      <DashboardWidget />
    </div>
  )
}

function getGreeting(name) {
  const h = new Date().getHours()
  const first = name ? name.split(' ')[0] : ''
  const g = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
  return first ? `${g}, ${first}` : g
}
