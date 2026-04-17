import React, { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { getStudents } from '../lib/api'
import api from '../lib/api'
import { Search, Filter, ChevronRight, User, AlertTriangle, CheckCircle, Clock, MessageSquare, Send, Phone, Calendar, MapPin, Flag, BarChart2, TrendingUp, Target, X, Check, Download } from 'lucide-react'
import { exportToCSV } from '../lib/export'

function getStudentName(s) {
  if (s.name && s.name.trim()) return s.name.trim()
  const full = `${s.first_name || ''} ${s.last_name || ''}`.trim()
  return full || s.student_name || s.email || 'Unknown'
}

function StudentAvatar({ student }) {
  const displayName = getStudentName(student)
  const words = displayName.split(' ')
  const initials = (words[0]?.[0] || '') + (words[1]?.[0] || '')
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899']
  const bg = colors[Math.abs((student.id || 0) % colors.length)]
  return (
    <div className="avatar" style={{ background: bg }}>
      {student.profile_image
        ? <img src={student.profile_image} alt={displayName} />
        : initials.toUpperCase() || '?'
      }
    </div>
  )
}

function RiskDot({ risk }) {
  if (!risk) return null
  const map = { low: 'green', medium: 'yellow', high: 'red', Critical: 'red', Attention: 'yellow', Healthy: 'green' }
  return <div className={`list-item-dot ${map[risk] || ''}`} title={`${risk} risk`} />
}

function RiskBadge({ category }) {
  const config = {
    Healthy: { color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)' },
    Attention: { color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.1)' },
    Critical: { color: '#FF453A', bg: 'rgba(255, 69, 58, 0.1)' },
  }
  const cfg = config[category] || config.Healthy
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}30`,
    }}>
      {category}
    </span>
  )
}

function MetricBar({ label, value, max = 100, color }) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)))
  const barColor = color || (percentage >= 70 ? '#34C759' : percentage >= 40 ? '#FF9F0A' : '#FF453A')
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{value}%</span>
      </div>
      <div style={{
        height: 6,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: barColor,
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

function NoteItem({ note }) {
  return (
    <div style={{
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{note.author || 'System'}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(note.created_at).toLocaleDateString()}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{note.content || note.note}</p>
    </div>
  )
}

function ProgressModal({ student, onClose }) {
  if (!student) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">Progress Report: {getStudentName(student)}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>WL101 Course Progress</h4>
            <MetricBar label="Overall Completion" value={student.progress || student.percentage_completed || 0} color="#4A9EFF" />
            <MetricBar label="Attendance Rate" value={student.attendance_rate || 0} color="#34C759" />
          </div>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Recent Engagement</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Last Activity</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{student.lastActivity || 'No data'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Days Inactive</span>
                <span style={{ fontSize: 13, color: student.daysInactive > 14 ? '#FF453A' : '#34C759', fontWeight: 600 }}>{student.daysInactive || 0} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Risk Status</span>
                <RiskBadge category={student.risk_category || 'Healthy'} />
              </div>
            </div>
          </div>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Formation Context</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Student is enrolled in <strong>{student.course || 'Watoto Leadership 101'}</strong> at <strong>{student.celebration_point || 'Unknown Campus'}</strong>.
              {student.risk_category === 'Critical' && " This student requires immediate outreach due to prolonged inactivity or poor performance benchmarks."}
              {student.risk_category === 'Attention' && " This student is showing signs of lagging; monitoring is recommended."}
              {student.risk_category === 'Healthy' && " This student is performing within expected program benchmarks."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Students() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const platform = useAppStore(s => s.platform)
  const user = useAuthStore(s => s.user)

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)

  useEffect(() => { setPageTitle('Students') }, [setPageTitle])

  useEffect(() => {
    async function load() {
      try {
        const data = await getStudents()
        setStudents(data.students || data || [])
      } catch (err) {
        console.error(err)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  // Load student detail
  useEffect(() => {
    if (!selected) { setDetail(null); setNotes([]); return }
    async function loadDetail() {
      try {
        const data = await api.get(`/api/data/students/${selected}`)
        const s = data.student
        // Map real fields to what UI expects
        const enhanced = {
          ...s,
          daysInactive: s.daysInactive ?? 0,
          riskIntelligence: s.risk_category || 'Healthy',
          loginRecency: Math.max(0, 100 - (s.daysInactive || 0) * 3), // Proxy for login recency
          progressStagnation: Math.min(100, (s.daysInactive || 0) * 2), // Proxy for stagnation
          completionRate: s.progress || s.percentage_completed || 0,
          phone: s.phone || '—',
          birthday: s.birthday || null,
          course: s.course || 'Watoto Leadership 101'
        }
        setDetail(enhanced)
        setNotes(data.notes || [])
      } catch (err) {
        console.error('Load detail error:', err)
        const found = students.find(s => s.id === selected)
        if (found) {
          setDetail({
            ...found,
            riskIntelligence: found.risk_category || 'Healthy',
            completionRate: found.progress || found.percentage_completed || 0
          })
        }
      }
    }
    loadDetail()
  }, [selected])

  const filtered = useMemo(() => {
    let list = students
    if (search) {
      const q = (search || '').toLowerCase().trim()
      list = list.filter(s =>
        (s.first_name || '').toLowerCase().includes(q) ||
        (s.last_name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.student_name || '').toLowerCase().includes(q)
      )
    }
    if (filter === 'active') list = list.filter(s => (s.daysInactive || 0) < 14)
    if (filter === 'inactive') list = list.filter(s => (s.daysInactive || 0) >= 14)
    if (filter === 'at-risk') list = list.filter(s => s.risk_category === 'Critical' || s.risk_category === 'Attention')
    if (filter === 'on-track') list = list.filter(s => (s.progress || s.percentage_completed || 0) >= 75)
    return list
  }, [students, search, filter])

  const handleSaveNote = async () => {
    if (!noteText.trim() || !selected) return
    setSavingNote(true)
    try {
      await api.post(`/api/data/students/${selected}/notes`, {
        content: noteText.trim(),
        student_id: selected,
      })
      setNotes(prev => [{ content: noteText.trim(), author: user?.name || user?.username, created_at: new Date().toISOString() }, ...prev])
      setNoteText('')
    } catch (err) { console.error(err) }
    finally { setSavingNote(false) }
  }

  const filters = [
    { key: 'all', label: 'All Students', icon: User },
    { key: 'at-risk', label: 'At Risk', icon: AlertTriangle },
    { key: 'inactive', label: 'Inactive >14d', icon: Clock },
    { key: 'on-track', label: 'On Track 75%+', icon: CheckCircle },
  ]

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        {[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-row" />)}
      </div>
    )
  }

  if (platform === 'desktop') {
    return (
      <div className="three-col" style={{ height: 'calc(100vh - 195px)', maxHeight: 'calc(100vh - 195px)' }}>
        {showProgressModal && <ProgressModal student={detail} onClose={() => setShowProgressModal(false)} />}
        <div className="col-sidebar">
          <div className="sidebar-title">Filters</div>
          {filters.map(f => {
            const Icon = f.icon
            return (
              <div
                key={f.key}
                className={`sidebar-item ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                <Icon size={16} />
                {f.label}
                <span className="sidebar-item-count">
                  {f.key === 'all' ? students.length : students.filter(s => {
                    if (f.key === 'inactive') return s.daysInactive >= 14
                    if (f.key === 'at-risk') return s.risk_category === 'Critical' || s.risk_category === 'Attention'
                    if (f.key === 'on-track') return (s.progress || s.percentage_completed || 0) >= 75
                    return false
                  }).length}
                </span>
              </div>
            )
          })}
          <div className="sidebar-title" style={{ marginTop: 16 }}>Summary</div>
          <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
            {filtered.length} of {students.length} students shown
          </div>
          <div style={{ padding: '0 16px' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => exportToCSV(filtered, 'students.csv')}
            >
              <Download size={14} style={{ marginRight: 6 }} /> Download CSV
            </button>
          </div>
        </div>

        <div className="col-list">
          <div className="col-list-header">
            <div className="search-box">
              <Search size={16} />
              <input
                placeholder="Search students…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-list-scroll">
            {filtered.map(s => (
              <div
                key={s.id}
                className={`list-item ${selected === s.id ? 'selected' : ''}`}
                onClick={() => setSelected(s.id)}
              >
                <StudentAvatar student={s} />
                <div className="list-item-info">
                  <div className="list-item-name">{getStudentName(s)}</div>
                  <div className="list-item-sub">{s.email || s.celebration_point || '—'}</div>
                </div>
                <RiskDot risk={s.risk_category} />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-title">No students found</div>
                <div className="empty-state-text">Try adjusting your search or filters</div>
              </div>
            )}
          </div>
        </div>

        <div className="col-detail">
          {detail ? (
            <>
              <div className="detail-header">
                <div className="detail-avatar">
                  {detail.profile_image
                    ? <img src={detail.profile_image} alt={getStudentName(detail)} />
                    : (() => { const n = getStudentName(detail).split(' '); return ((n[0]?.[0] || '') + (n[1]?.[0] || '')).toUpperCase() || '?' })()
                  }
                </div>
                <div className="detail-name">{getStudentName(detail)}</div>
                <div className="detail-subtitle">{detail.email}</div>
                <div className="detail-badges">
                  {detail.status && <span className={`badge badge-dot badge-${detail.status === 'Completed' ? 'success' : 'warning'}`}>{detail.status}</span>}
                  {detail.risk_category && <span className={`badge badge-dot badge-${detail.risk_category === 'Critical' ? 'danger' : detail.risk_category === 'Attention' ? 'warning' : 'success'}`}>{detail.risk_category} risk</span>}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Current Status</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Course</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{detail.course}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Days Inactive</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: detail.daysInactive >= 30 ? '#FF453A' : detail.daysInactive >= 14 ? '#FF9F0A' : '#34C759' }}>{detail.daysInactive}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, textAlign: 'right' }}>Risk Intelligence</div>
                    <div style={{ textAlign: 'right' }}>
                      <RiskBadge category={detail.riskIntelligence} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Risk Metrics</div>
                <MetricBar label="Login Recency" value={detail.loginRecency} color="#4A9EFF" />
                <MetricBar label="Progress Consistency" value={100 - detail.progressStagnation} color="#FF9F0A" />
                <MetricBar label="Completion Rate" value={detail.completionRate} color="#34C759" />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  Metrics based on weighted activity and completion benchmarks.
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Contact Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{detail.email || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Phone</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{detail.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Campus</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {detail.celebration_point || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Birthday</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {detail.birthday ? new Date(detail.birthday).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Actions</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => window.location.href = `mailto:${detail.email}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <MessageSquare size={14} /> Email
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowProgressModal(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <BarChart2 size={14} /> View Progress
                  </button>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Notes ({notes.length})</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    className="form-input"
                    placeholder="Add a note…"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveNote()}
                    style={{ flex: 1, height: 36, fontSize: 13 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                    <Send size={14} />
                  </button>
                </div>
                {notes.map((n, i) => <NoteItem key={n.id || i} note={n} />)}
                {notes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>
                    No notes yet
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <User className="empty-state-icon" />
              <div className="empty-state-title">Select a student</div>
              <div className="empty-state-text">Choose from the list to view details</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Mobile bottom sheet — shown when a student is tapped
  const mobileSheetOpen = !!selected && !!detail

  return (
    <div>
      {showProgressModal && <ProgressModal student={detail} onClose={() => setShowProgressModal(false)} />}

      {/* Mobile Bottom Sheet */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: mobileSheetOpen ? 'rgba(0,0,0,0.5)' : 'transparent',
            transition: 'background 0.25s',
            pointerEvents: mobileSheetOpen ? 'all' : 'none',
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--bg-secondary)',
              borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.12)',
              maxHeight: '85vh',
              overflowY: 'auto',
              transform: mobileSheetOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 16px' }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            {detail ? (
              <div style={{ padding: '0 20px 24px' }}>
                {/* Student header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div className="avatar" style={{ width: 52, height: 52, fontSize: 20, background: '#6366f1', flexShrink: 0 }}>
                    {detail.profile_image
                      ? <img src={detail.profile_image} alt={getStudentName(detail)} />
                      : (() => { const n = getStudentName(detail).split(' '); return ((n[0]?.[0] || '') + (n[1]?.[0] || '')).toUpperCase() || '?' })()
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{getStudentName(detail)}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>{detail.email || '—'}</div>
                    <div style={{ marginTop: 6 }}>
                      <RiskBadge category={detail.riskIntelligence || detail.risk_category || 'Healthy'} />
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'Days Inactive', value: detail.daysInactive ?? 0, color: (detail.daysInactive || 0) >= 30 ? '#FF453A' : (detail.daysInactive || 0) >= 14 ? '#FF9F0A' : '#34C759' },
                    { label: 'Completion', value: `${detail.completionRate || detail.progress || 0}%`, color: '#4A9EFF' },
                    { label: 'Campus', value: detail.celebration_point || '—', color: 'var(--text-primary)' },
                    { label: 'Course', value: detail.course || 'WL101', color: 'var(--text-primary)' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Risk metrics */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Risk Metrics</div>
                  <MetricBar label="Login Recency" value={detail.loginRecency || 0} color="#4A9EFF" />
                  <MetricBar label="Completion Rate" value={detail.completionRate || detail.progress || 0} color="#34C759" />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.location.href = `mailto:${detail.email}`}>
                    <MessageSquare size={14} style={{ marginRight: 6 }} /> Email
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowProgressModal(true)}>
                    <BarChart2 size={14} style={{ marginRight: 6 }} /> Progress
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Notes ({notes.length})</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      className="form-input"
                      placeholder="Add a note…"
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveNote()}
                      style={{ flex: 1, fontSize: 14 }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                      <Send size={14} />
                    </button>
                  </div>
                  {notes.slice(0, 3).map((n, i) => <NoteItem key={n.id || i} note={n} />)}
                  {notes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-tertiary)', fontSize: 13 }}>No notes yet</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading…</div>
            )}
          </div>
        </div>
      )}

      <div className="ios-large-title">Students</div>
      <div className="mobile-search">
        <Search size={16} />
        <input placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto' }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f.key)}
            style={{ flexShrink: 0 }}
          >{f.label}</button>
        ))}
      </div>

      <div className="ios-list">
        {filtered.slice(0, 50).map(s => (
          <div key={s.id} className="ios-row" onClick={() => setSelected(s.id)}>
            <StudentAvatar student={s} />
            <div className="ios-row-main">
              <div className="ios-row-title">{getStudentName(s)}</div>
              <div className="ios-row-subtitle">{s.email || s.celebration_point || '—'}</div>
            </div>
            <RiskDot risk={s.risk_category} />
            <ChevronRight className="ios-row-chevron" />
          </div>
        ))}
      </div>
    </div>
  )
}
