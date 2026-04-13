import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { getAuditLogs } from '../lib/api'
import { Shield, Search, Filter, User, Clock } from 'lucide-react'

export default function AuditLogs() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { setPageTitle('Audit Logs') }, [setPageTitle])

  useEffect(() => {
    async function load() {
      try {
        const data = await getAuditLogs()
        // Ensure we always get an array, even if API structure is unexpected
        const logsArray = Array.isArray(data) ? data :
          (data && Array.isArray(data.logs) ? data.logs : [])
        setLogs(logsArray)
      } catch (err) {
        console.error('Failed to load audit logs:', err)
        setLogs([])
      }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = search
    ? logs.filter(l =>
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.details || '').toLowerCase().includes(search.toLowerCase())
    )
    : logs

  // Group by date
  const grouped = {}
  filtered.forEach(l => {
    const date = l.created_at ? new Date(l.created_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : 'Unknown'
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(l)
  })

  if (loading) return <div style={{ padding: 24 }}>{[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-row" />)}</div>

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🛡️ Audit Logs</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{logs.length} recorded actions</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          className="form-input"
          placeholder="Search logs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
          <Shield className="empty-state-icon" />
          <div className="empty-state-title">No audit logs</div>
          <div className="empty-state-text">System activity will appear here</div>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, padding: '0 4px' }}>
              {date}
            </div>
            <div style={{
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)', borderRadius: 12,
              overflow: 'hidden',
            }}>
              {items.map((l, i) => (
                <div key={l.id || i} style={{
                  padding: '12px 16px',
                  borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--accent-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={14} style={{ color: 'var(--accent-light)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                      <span style={{ color: 'var(--accent-light)' }}>{l.user_name || 'System'}</span>
                      {' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{l.action}</span>
                    </div>
                    {l.details && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{l.details}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} />
                      {l.created_at ? new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
