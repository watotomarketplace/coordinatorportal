import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import api from '../lib/api'
import { Target, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react'

export default function Checkpoints() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const [checkpoints, setCheckpoints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { setPageTitle('Discernment Checkpoints') }, [setPageTitle])

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/api/checkpoints')
        setCheckpoints(data.checkpoints || data || [])
      } catch { /* endpoint may not exist yet */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: 24 }}>{[0,1,2].map(i => <div key={i} className="skeleton skeleton-row" />)}</div>

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🎯 Discernment Checkpoints</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Track student progress through program milestones</p>
      </div>

      {checkpoints.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
          <Target className="empty-state-icon" />
          <div className="empty-state-title">No checkpoints yet</div>
          <div className="empty-state-text">Checkpoint data will appear here as students progress through the program</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {checkpoints.map(cp => (
            <div key={cp.id} style={{
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)', borderRadius: 16,
              padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {cp.status === 'completed' ? <CheckCircle size={18} style={{ color: 'var(--success)' }} /> :
                 cp.status === 'in-progress' ? <Clock size={18} style={{ color: 'var(--warning)' }} /> :
                 <AlertCircle size={18} style={{ color: 'var(--text-tertiary)' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{cp.name || cp.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{cp.description || ''}</div>
                </div>
                <span className={`badge badge-${cp.status === 'completed' ? 'success' : cp.status === 'in-progress' ? 'warning' : 'neutral'}`}>
                  {cp.status || 'pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
