import React, { useState, useEffect } from 'react'
import { X, Save, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import { CELEBRATION_POINTS } from '../constants/campuses'

export default function EditGroupModal({ group, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    group_code: group.group_code || '',
    celebration_point: group.celebration_point || '',
    cohort: group.cohort || '2026 Q1',
    facilitator_user_id: group.facilitator_user_id || '',
    co_facilitator_user_id: group.co_facilitator_user_id || '',
    active: group.active ?? 1
  })
  const [facilitators, setFacilitators] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFacilitators = async () => {
      setLoading(true)
      try {
        // Fetch users who are facilitators
        const res = await api.get(`/api/admin/users`)
        if (res.success) {
          // Filter to facilitators at the same campus (or all for Admin)
          const list = res.users.filter(u => 
            (u.role === 'Facilitator' || u.role === 'CoFacilitator' || (u.roles && u.roles.includes('Facilitator'))) &&
            (u.celebration_point === formData.celebration_point || !formData.celebration_point)
          )
          setFacilitators(list)
        }
      } catch (err) {
        console.error('Failed to fetch facilitators', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFacilitators()
  }, [formData.celebration_point])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.put(`/api/formation-groups/${group.id}`, formData)
      onUpdated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update group')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal glass-card" style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}>
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="modal-title" style={{ fontSize: 18, fontWeight: 700 }}>Edit Formation Group</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ 
                padding: '12px 16px', 
                background: 'rgba(255, 69, 58, 0.15)', 
                border: '1px solid rgba(255, 69, 58, 0.3)', 
                borderRadius: 12,
                color: '#FF453A',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Group Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.group_code}
                  onChange={e => setFormData({ ...formData, group_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. WDT01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Campus</label>
                <select 
                  className="form-input"
                  value={formData.celebration_point}
                  onChange={e => setFormData({ ...formData, celebration_point: e.target.value })}
                  required
                >
                  <option value="">Select Campus</option>
                  {CELEBRATION_POINTS.map(cp => (
                    <option key={cp} value={cp}>{cp}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Cohort</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.cohort}
                  onChange={e => setFormData({ ...formData, cohort: e.target.value })}
                  placeholder="e.g. 2026 Q1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-input"
                  value={formData.active}
                  onChange={e => setFormData({ ...formData, active: parseInt(e.target.value) })}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Main Facilitator</label>
              <select 
                className="form-input"
                value={formData.facilitator_user_id}
                onChange={e => setFormData({ ...formData, facilitator_user_id: e.target.value })}
              >
                <option value="">No Facilitator Assigned</option>
                {facilitators.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.username})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Co-Facilitator (Optional)</label>
              <select 
                className="form-input"
                value={formData.co_facilitator_user_id}
                onChange={e => setFormData({ ...formData, co_facilitator_user_id: e.target.value })}
              >
                <option value="">No Co-Facilitator</option>
                {facilitators.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.username})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} style={{ marginRight: 8 }} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
