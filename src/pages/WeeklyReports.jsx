import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import { FileText, Send, CheckCircle, Clock, AlertCircle, ChevronRight, Plus, X, BarChart3, Users, MessageSquare, Download } from 'lucide-react'
import { exportToCSV } from '../lib/export'

function EngagementBadge({ level }) {
  const colors = {
    high: { bg: 'rgba(52, 199, 89, 0.15)', text: '#34C759', label: 'High Engagement' },
    medium: { bg: 'rgba(255, 159, 10, 0.15)', text: '#FF9F0A', label: 'Medium Engagement' },
    low: { bg: 'rgba(255, 69, 58, 0.15)', text: '#FF453A', label: 'Low Engagement' }
  }
  const config = colors[level?.toLowerCase()] || { bg: 'rgba(255,255,255,0.06)', text: 'var(--text-tertiary)', label: 'No Data' }
  
  return (
    <span style={{ 
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: config.bg, color: config.text, textTransform: 'uppercase', letterSpacing: 0.5
    }}>
      {config.label}
    </span>
  )
}

export default function WeeklyReports() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const hasRole = useAuthStore(s => s.hasRole)
  const user = useAuthStore(s => s.user)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [campusFilter, setCampusFilter] = useState('All')
  const [expandedReportId, setExpandedReportId] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { setPageTitle('Weekly Reports') }, [setPageTitle])

  const loadReports = async () => {
    try {
      const data = await api.get('/api/reports')
      const reportsArray = Array.isArray(data) ? data : (data && Array.isArray(data.reports) ? data.reports : [])
      setReports(reportsArray)
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReports() }, [])

  const handleSync = async () => {
    if (!confirm('Trigger manual sync with Notion? This may take a moment.')) return
    setSyncing(true)
    try {
      await api.post('/api/reports/sync')
      await loadReports()
    } catch (err) {
      console.error('Sync failed:', err)
      alert('Sync failed. Check server logs.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>{[0, 1, 2, 3].map(i => <div key={i} className="skeleton skeleton-row" style={{ height: 100, marginBottom: 12, borderRadius: 16 }} />)}</div>

  const campuses = [...new Set(reports.map(r => r.celebration_point).filter(Boolean))].sort()
  const filteredReports = reports.filter(r => campusFilter === 'All' || r.celebration_point === campusFilter)

  return (
    <div className="tahoe-page" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>📝 Weekly Reports</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Centralized oversight of campus-level formation metrics</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {hasRole('Admin') && (
            <button 
              className={`btn ${syncing ? 'btn-ghost' : 'btn-secondary'}`} 
              onClick={handleSync} 
              disabled={syncing}
              style={{ fontSize: 13 }}
            >
              <Clock size={16} className={syncing ? 'spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Notion'}
            </button>
          )}
          {(hasRole('Admin') || hasRole('LeadershipTeam') || hasRole('Coordinator')) && (
            <>
              <select
                className="form-select"
                value={campusFilter}
                onChange={e => setCampusFilter(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, minWidth: 160 }}
              >
                <option value="All">All Campuses</option>
                {campuses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                className="btn btn-secondary"
                title="Download CSV"
                onClick={() => exportToCSV(filteredReports, 'weekly-reports.csv')}
              >
                <Download size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center', background: 'var(--glass-bg)', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>empty</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No reports found</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Reports synced from Notion will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredReports.map(r => {
            const isExpanded = expandedReportId === r.id
            return (
              <div key={r.id} 
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isExpanded ? 'rgba(74, 158, 255, 0.4)' : 'var(--glass-border)'}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <div 
                  style={{ padding: '18px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20 }}
                  onClick={() => setExpandedReportId(isExpanded ? null : r.id)}
                >
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 12, 
                    background: 'rgba(255,255,255,0.04)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: '#4A9EFF'
                  }}>
                    {r.week_number}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{r.group_code}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>•</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{r.celebration_point}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
                        <Users size={14} /> {r.attendance_count || 0} attended
                      </div>
                      <EngagementBadge level={r.engagement_level} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginRight: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>{r.facilitator_name || 'Notion User'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : 'Unsynced'}
                    </div>
                  </div>

                  <ChevronRight size={20} style={{ 
                    transform: isExpanded ? 'rotate(90deg)' : 'none', 
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    color: isExpanded ? '#4A9EFF' : 'rgba(255,255,255,0.2)' 
                  }} />
                </div>

                {isExpanded && (
                  <div style={{ 
                    padding: '0 24px 24px', 
                    marginTop: -4,
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: 24,
                    animation: 'slideDown 0.3s ease-out'
                  }}>
                    <div style={{ display: 'grid', gap: 20 }}>
                      <section>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <BarChart3 size={14} /> Key Themes
                        </h4>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                          {r.key_themes || 'No themes documented for this week.'}
                        </div>
                      </section>
                      <section>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MessageSquare size={14} /> Formation Evidence
                        </h4>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                          {r.formation_evidence || 'No evidence provided.'}
                        </div>
                      </section>
                    </div>
                    
                    <div style={{ display: 'grid', gap: 20 }}>
                      <section>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: '#FF9F0A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertCircle size={14} /> Pastoral Concerns
                        </h4>
                        <div style={{ fontSize: 14, color: '#FF9F0A', lineHeight: 1.6, background: 'rgba(255, 159, 10, 0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 159, 10, 0.1)' }}>
                          {r.pastoral_concerns || 'None reported.'}
                        </div>
                      </section>
                      <section>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                          Session Details
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Module</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.module_number || '—'}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Lesson</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.lesson_number || '—'}</div>
                          </div>
                        </div>
                        {r.questions_to_escalate && (
                          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Escalations</div>
                            <div style={{ fontSize: 13 }}>{r.questions_to_escalate}</div>
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
