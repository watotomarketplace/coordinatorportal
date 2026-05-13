import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import { Target, CheckCircle, Clock, AlertCircle, Edit2, X, Save } from 'lucide-react'

function EditCheckpointModal({ checkpoint, onClose, onSaved }) {
  const [summary, setSummary] = useState(checkpoint.summary || '')
  const [recommendations, setRecommendations] = useState(checkpoint.recommendations || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!summary.trim() && !recommendations.trim()) {
      return setError('Provide at least a summary or recommendations')
    }
    setSaving(true)
    setError('')
    try {
      await api.put(`/api/checkpoints/${checkpoint.id}`, { summary: summary.trim() || undefined, recommendations: recommendations.trim() || undefined })
      onSaved?.({ ...checkpoint, summary: summary.trim(), recommendations: recommendations.trim() })
      onClose()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 560, padding: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Checkpoint — {checkpoint.group_code} Week {checkpoint.checkpoint_week}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Summary
            </label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Overall summary of student progress at this checkpoint…"
              rows={4}
              style={{
                width: '100%', background: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14,
                resize: 'vertical', boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recommendations
            </label>
            <textarea
              value={recommendations}
              onChange={e => setRecommendations(e.target.value)}
              placeholder="Recommended actions or follow-up for facilitator / pastor…"
              rows={4}
              style={{
                width: '100%', background: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14,
                resize: 'vertical', boxSizing: 'border-box'
              }}
            />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleSave} disabled={saving}>
              <Save size={15} />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Checkpoints() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const hasRole = useAuthStore(s => s.hasRole)
  const [checkpoints, setCheckpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCheckpoint, setEditingCheckpoint] = useState(null)

  const canEdit = hasRole('Admin') || hasRole('Coordinator')

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

  const handleSaved = (updated) => {
    setCheckpoints(prev => prev.map(cp => cp.id === updated.id ? { ...cp, ...updated } : cp))
  }

  const statusIcon = (status) => {
    if (status === 'completed' || status === 'reviewed') return <CheckCircle size={18} style={{ color: '#30d158' }} />
    if (status === 'in-progress') return <Clock size={18} style={{ color: '#f59e0b' }} />
    return <AlertCircle size={18} style={{ color: 'var(--text-tertiary)' }} />
  }

  if (loading) return <div style={{ padding: 24 }}>{[0,1,2].map(i => <div key={i} className="skeleton skeleton-row" />)}</div>

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {editingCheckpoint && (
        <EditCheckpointModal
          checkpoint={editingCheckpoint}
          onClose={() => setEditingCheckpoint(null)}
          onSaved={handleSaved}
        />
      )}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Discernment Checkpoints</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Track student progress through program milestones</p>
      </div>

      {checkpoints.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <Target className="empty-state-icon" />
          <div className="empty-state-title">No checkpoints yet</div>
          <div className="empty-state-text">Checkpoint data will appear here as students progress through the program</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {checkpoints.map(cp => (
            <div key={cp.id} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
              padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ paddingTop: 2 }}>{statusIcon(cp.status)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {cp.group_code || cp.group_name} — Week {cp.checkpoint_week}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span className={`badge badge-${cp.status === 'completed' || cp.status === 'reviewed' ? 'success' : cp.status === 'in-progress' ? 'warning' : 'neutral'}`}>
                        {cp.status || 'pending'}
                      </span>
                      {canEdit && (
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Edit summary / recommendations"
                          onClick={() => setEditingCheckpoint(cp)}
                          style={{ padding: '4px 8px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {cp.facilitator_name && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Facilitator: {cp.facilitator_name}
                    </div>
                  )}
                  {cp.summary && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                      {cp.summary}
                    </div>
                  )}
                  {cp.recommendations && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px', background: 'rgba(99,102,241,0.08)',
                      borderLeft: '3px solid var(--accent)', borderRadius: '0 8px 8px 0',
                      fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5
                    }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommendations</strong>
                      <div style={{ marginTop: 4 }}>{cp.recommendations}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
