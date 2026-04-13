import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import api from '../lib/api'
import { Search, Wrench, Key, UserCog, Shield, Check, X, Copy, CopyCheck } from 'lucide-react'

export default function TechSupport() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  
  // Student password reset state
  const [resetting, setResetting] = useState(false)
  const [tempPassword, setTempPassword] = useState(null)
  const [copied, setCopied] = useState(false)
  
  // Audit logs state
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => { setPageTitle('Tech Support') }, [setPageTitle])

  // Load audit logs on mount
  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async () => {
    setLoadingLogs(true)
    try {
      const data = await api.get('/api/tech-support/audit-log')
      if (data.success) {
        setLogs(data.logs || [])
      }
    } catch {
      setLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  // Search Thinkific students
  useEffect(() => {
    if (search.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const data = await api.get(`/api/data/users?search=${encodeURIComponent(search)}&type=all&limit=20`)
        setResults(data.users || data || [])
      } catch { setResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSelect = (u) => {
    setSelected(u)
    setTempPassword(null)
    setCopied(false)
  }

  const handleResetPassword = async () => {
    if (!selected) return
    if (!confirm(`Are you sure you want to reset the password for ${selected.name}?`)) return
    
    setResetting(true)
    setTempPassword(null)
    try {
      const data = await api.post(`/api/tech-support/reset-password/${selected.userId || selected.id}`)
      if (data.success) {
        setTempPassword(data.tempPassword)
        loadAuditLogs() // Refresh logs
      } else {
        alert(data.message || 'Failed to reset password')
      }
    } catch (err) { 
      alert(err.message) 
    } finally { 
      setResetting(false) 
    }
  }

  const copyToClipboard = () => {
    if (!tempPassword) return
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🔧 Tech Support</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Reset student passwords and view recent activity</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(350px, 1.2fr)', gap: 24, minHeight: 400 }}>
        {/* Search Panel */}
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)', borderRadius: 16,
          padding: 20, display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Find Student</h3>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              className="form-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {results.map(u => {
              const uId = u.userId || u.id;
              return (
                <div key={uId} onClick={() => handleSelect(u)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8,
                  cursor: 'pointer', transition: 'background 0.12s',
                  background: selected && (selected.userId || selected.id) === uId ? 'var(--accent-muted)' : 'transparent',
                }}
                  onMouseEnter={e => { if (!selected || (selected.userId || selected.id) !== uId) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!selected || (selected.userId || selected.id) !== uId) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="avatar avatar-sm" style={{ background: '#6366f1' }}>
                    {(u.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{u.email}</div>
                  </div>
                </div>
              )
            })}
            {search.length >= 2 && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>
                No students found with that name or email.
              </div>
            )}
          </div>
        </div>

        {/* Actions & Detail Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{
            background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)', borderRadius: 16,
            padding: 20,
          }}>
            {selected ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="avatar avatar-lg" style={{ background: '#6366f1', margin: '0 auto 12px' }}>
                    {(selected.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{selected.email}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                    <div className="badge badge-accent">Thinkific ID: {selected.userId || selected.id}</div>
                    {selected.celebration_point && <div className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>{selected.celebration_point}</div>}
                  </div>
                </div>

                <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Course Progress</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{selected.progress || 0}%</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Risk Category</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: selected.risk_category === 'Critical' ? 'var(--danger)' : selected.risk_category === 'Attention' ? 'var(--warning)' : 'var(--success)' }}>
                      {selected.risk_category || 'Healthy'}
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Key size={16} /> Password Reset
                </h3>
                
                {tempPassword ? (
                  <div style={{ background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.2)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#34c759', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check size={14} /> Password Reset Successful!
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Please provide this temporary password to <strong>{selected.name}</strong>. They will be required to change it upon login.
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input 
                        className="form-input" 
                        value={tempPassword} 
                        readOnly 
                        style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: 1 }}
                      />
                      <button className="btn btn-secondary" onClick={copyToClipboard} title="Copy to clipboard">
                        {copied ? <CopyCheck size={16} color="#34c759" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                      This will generate a temporary secure password for the student's Thinkific account. This action will be logged.
                    </p>
                    <button
                      className="btn btn-primary btn-block"
                      onClick={handleResetPassword}
                      disabled={resetting}
                    >
                      {resetting ? 'Resetting…' : 'Generate Temporary Password'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <Wrench className="empty-state-icon" />
                <div className="empty-state-title">Select a student</div>
                <div className="empty-state-text">Search and select a student to manage their account</div>
              </div>
            )}
          </div>
          
          {/* Audit Logs */}
          <div style={{
            background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)', borderRadius: 16,
            padding: 20, flex: 1, display: 'flex', flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} /> Recent Activity
            </h3>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingLogs ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>Loading logs...</div>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>No recent tech support actions.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {logs.map(log => {
                    let detailStr = log.details;
                    try {
                      const parsed = JSON.parse(log.details);
                      detailStr = parsed.student_name ? `Target: ${parsed.student_name}` : 
                                 parsed.error ? `Error: ${parsed.error}` : detailStr;
                    } catch (e) {}
                    
                    return (
                      <div key={log.id} style={{ 
                        padding: 12, background: 'rgba(255,255,255,0.03)', 
                        borderRadius: 8, borderLeft: `3px solid ${log.action.includes('failed') ? 'var(--danger)' : 'var(--accent)'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{log.action.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                           {detailStr}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          By: {log.actor_name} ({log.role})
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
