import React, { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { getUsers } from '../lib/api'
import api from '../lib/api'
import {
  Search, Plus, Shield, Users as UsersIcon, Eye, Grid3X3, List,
  UserPlus, Trash2, Edit, ChevronRight, X, Check
} from 'lucide-react'
import { CELEBRATION_POINTS } from '../constants/campuses'

const ROLES = ['Admin', 'LeadershipTeam', 'Coordinator', 'Facilitator', 'Pastor', 'TechSupport', 'Student']

function UserAvatar({ u }) {
  const initials = ((u.name || u.username || '?')[0] || '').toUpperCase()
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899']
  const bg = colors[Math.abs((u.id || 0) % colors.length)]
  return (
    <div className="avatar" style={{ background: bg }}>
      {u.profile_image ? <img src={u.profile_image} alt={u.name} /> : initials}
    </div>
  )
}

function RoleBadge({ role, isSecondary }) {
  const map = {
    Admin: 'badge-accent', LeadershipTeam: 'badge-info', Coordinator: 'badge-success',
    Facilitator: 'badge-warning', Pastor: 'badge-neutral', TechSupport: 'badge-info', Student: 'badge-neutral'
  }
  return <span className={`badge ${map[role] || 'badge-neutral'}`} style={isSecondary ? { opacity: 0.7, borderStyle: 'dashed' } : {}}>{role}{isSecondary && ' (Sec)'}</span>
}

function UserModal({ onClose, onSaved, userToEdit = null }) {
  const [form, setForm] = useState({ 
    username: userToEdit?.username || '', 
    name: userToEdit?.name || '', 
    password: '', 
    role: userToEdit?.role || 'Facilitator', 
    celebration_point: userToEdit?.celebration_point || '', 
    secondary_roles: (typeof userToEdit?.secondary_roles === 'string' 
      ? JSON.parse(userToEdit?.secondary_roles || '[]') 
      : userToEdit?.secondary_roles) || [],
    assigned_groups: (typeof userToEdit?.assigned_groups === 'string'
      ? JSON.parse(userToEdit?.assigned_groups || '[]')
      : userToEdit?.assigned_groups) || []
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [groups, setGroups] = useState([])
  const hasRole = useAuthStore(s => s.hasRole)

  useEffect(() => {
    api.get('/api/formation-groups').then(d => setGroups(d.groups || d || [])).catch(console.error)
  }, [])

  const handleSave = async () => {
    if (!form.name.trim() || (!userToEdit && (!form.username.trim() || !form.password))) {
      setError('Required fields missing')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        username: form.username.trim().toLowerCase(),
        secondary_roles: form.secondary_roles,
      }
      if (userToEdit) {
        if (!payload.password) delete payload.password
        await api.put(`/api/admin/users/${userToEdit.id}`, payload)
      } else {
        await api.post('/api/admin/users', payload) // Note: endpoint relies on the actual API defined (/api/admin/users NOT /api/admin/users/create per the admin router)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally { setSaving(false) }
  }

  const toggleSecondary = (role) => {
    if (role === 'Admin') return; // Cannot select Admin
    setForm(prev => ({
      ...prev,
      secondary_roles: prev.secondary_roles.includes(role)
        ? prev.secondary_roles.filter(r => r !== role)
        : [...prev.secondary_roles, role]
    }))
  }

  const toggleGroup = (groupId) => {
    setForm(prev => ({
      ...prev,
      assigned_groups: prev.assigned_groups.includes(groupId)
        ? prev.assigned_groups.filter(g => g !== groupId)
        : [...prev.assigned_groups, groupId]
    }))
  }

  const availableGroups = groups.filter(g => hasRole('Admin') ? true : g.celebration_point === form.celebration_point)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title">{userToEdit ? 'Edit User' : 'Create User'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {error && <div style={{ padding: 10, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 8, color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Username (Login)</label>
            <input className="form-input" disabled={!!userToEdit} value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))} style={{ textTransform: 'lowercase' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Password {userToEdit && '(Leave blank to keep current)'}</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Primary Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Celebration Point (Campus)</label>
            <select
              className="form-select"
              value={form.celebration_point}
              onChange={e => setForm(p => ({ ...p, celebration_point: e.target.value }))}
            >
              <option value="">— Select Campus —</option>
              {CELEBRATION_POINTS.map(cp => <option key={cp} value={cp}>{cp}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Secondary Roles</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ROLES.filter(r => r !== form.role && r !== 'Admin').map(r => (
                <button
                  key={r}
                  className={`btn btn-sm ${form.secondary_roles.includes(r) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleSecondary(r)}
                  type="button"
                >{r}</button>
              ))}
            </div>
          </div>
          {form.role === 'Facilitator' && (
            <div className="form-group">
              <label className="form-label">Assigned Groups</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 150, overflowY: 'auto', padding: '4px' }}>
                {availableGroups.length > 0 ? availableGroups.map(g => (
                  <button
                    key={g.id}
                    className={`btn btn-sm ${form.assigned_groups.includes(g.id) ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => toggleGroup(g.id)}
                    type="button"
                    title={g.name}
                  >{g.group_code}</button>
                )) : <span style={{fontSize: 12, color: 'var(--text-tertiary)'}}>No groups available for this campus.</span>}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save User'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const platform = useAppStore(s => s.platform)
  const hasRole = useAuthStore(s => s.hasRole)

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => { setPageTitle('User Management') }, [setPageTitle])

  const loadUsers = async () => {
    try {
      const data = await getUsers()
      setUsers(data.users || data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  const filtered = useMemo(() => {
    let list = users
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(u => (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
    }
    if (roleFilter !== 'All') list = list.filter(u => u.role === roleFilter)
    return list
  }, [users, search, roleFilter])

  const selectedUser = useMemo(() => users.find(u => u.id === selected), [users, selected])

  const roleCounts = useMemo(() => {
    const counts = { All: users.length }
    ROLES.forEach(r => { counts[r] = users.filter(u => u.role === r).length })
    return counts
  }, [users])

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    try { await api.delete(`/api/admin/users/${id}`) }
    catch (err) { alert(err.message); return }
    setUsers(prev => prev.filter(u => u.id !== id))
    if (selected === id) setSelected(null)
  }

  if (loading) {
    return <div style={{ padding: 24 }}>{[0,1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}</div>
  }

  if (platform === 'desktop') {
    return (
      <div className="three-col">
        {showModal && <UserModal onClose={() => { setShowModal(false); setEditingUser(null); }} onSaved={loadUsers} userToEdit={editingUser} />}
        
        {/* Sidebar - Roles */}
        <div className="col-sidebar">
          <div className="sidebar-title">Roles</div>
          {['All', ...ROLES].map(r => (
            <div
              key={r}
              className={`sidebar-item ${roleFilter === r ? 'active' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              <Shield size={16} />
              {r}
              <span className="sidebar-item-count">{roleCounts[r] || 0}</span>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="col-list">
          <div className="col-list-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{filtered.length} Users</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className={`btn btn-ghost btn-icon btn-sm ${viewMode === 'list' ? '' : ''}`} onClick={() => setViewMode('list')} title="List"><List size={16} /></button>
                <button className={`btn btn-ghost btn-icon btn-sm`} onClick={() => setViewMode('grid')} title="Grid"><Grid3X3 size={16} /></button>
                {hasRole('Admin') && (
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditingUser(null); setShowModal(true); }}><Plus size={14} /> Add</button>
                )}
              </div>
            </div>
            <div className="search-box">
              <Search size={16} />
              <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-list-scroll">
            {filtered.map(u => (
              <div key={u.id} className={`list-item ${selected === u.id ? 'selected' : ''}`} onClick={() => setSelected(u.id)}>
                <UserAvatar u={u} />
                <div className="list-item-info">
                  <div className="list-item-name">{u.name || u.username}</div>
                  <div className="list-item-sub">{u.role}{u.secondary_roles?.length > 0 ? ` +${u.secondary_roles.length}` : ''} · {u.celebration_point || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="col-detail">
          {selectedUser ? (
            <>
              <div className="detail-header">
                <div className="detail-avatar" style={{ width: 72, height: 72, fontSize: 28 }}>
                  {selectedUser.profile_image ? <img src={selectedUser.profile_image} alt="" /> : (selectedUser.name || 'U')[0].toUpperCase()}
                </div>
                <div className="detail-name">{selectedUser.name || selectedUser.username}</div>
                <div className="detail-subtitle">@{selectedUser.username}</div>
                <div className="detail-badges">
                  <RoleBadge role={selectedUser.role} />
                  {(() => {
                    try {
                      const sec = typeof selectedUser.secondary_roles === 'string'
                        ? JSON.parse(selectedUser.secondary_roles || '[]')
                        : (selectedUser.secondary_roles || [])
                      return sec.map(r => <RoleBadge key={r} role={r} isSecondary />)
                    } catch { return null }
                  })()}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Details</div>
                <div className="detail-field"><span className="detail-field-label">Campus</span><span className="detail-field-value">{selectedUser.celebration_point || '—'}</span></div>
                <div className="detail-field"><span className="detail-field-label">Email</span><span className="detail-field-value">{selectedUser.email || '—'}</span></div>
                <div className="detail-field"><span className="detail-field-label">Created</span><span className="detail-field-value">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '—'}</span></div>
                <div className="detail-field"><span className="detail-field-label">Last Login</span><span className="detail-field-value">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}</span></div>
              </div>

              {hasRole('Admin') && (
                <div className="action-btns">
                  <button className="action-btn" onClick={() => { setEditingUser(selectedUser); setShowModal(true); }}><Edit size={20} /><span>Edit</span></button>
                  <button className="action-btn" onClick={() => handleDelete(selectedUser.id)} style={{ color: 'var(--danger)' }}><Trash2 size={20} /><span>Delete</span></button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <UsersIcon className="empty-state-icon" />
              <div className="empty-state-title">Select a user</div>
              <div className="empty-state-text">Choose from the list to view details</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Mobile
  return (
    <div>
      <div className="ios-large-title">Users</div>
      <div className="mobile-search">
        <Search size={16} />
        <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto' }}>
        {['All', ...ROLES].map(r => (
          <button
            key={r}
            className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRoleFilter(r)}
            style={{ flexShrink: 0 }}
          >{r} ({roleCounts[r] || 0})</button>
        ))}
      </div>

      <div className="ios-list">
        {filtered.map(u => (
          <div key={u.id} className="ios-row">
            <UserAvatar u={u} />
            <div className="ios-row-main">
              <div className="ios-row-title">{u.name || u.username}</div>
              <div className="ios-row-subtitle">{u.role}{u.secondary_roles?.length > 0 ? ` +${u.secondary_roles.length}` : ''} · {u.celebration_point || '—'}</div>
            </div>
            <ChevronRight className="ios-row-chevron" />
          </div>
        ))}
      </div>

      {hasRole('Admin') && (
        <button className="fab" onClick={() => { setEditingUser(null); setShowModal(true); }}>
          <Plus size={24} />
        </button>
      )}
      {showModal && <UserModal onClose={() => { setShowModal(false); setEditingUser(null); }} onSaved={loadUsers} userToEdit={editingUser} />}
    </div>
  )
}
