import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { getGroups, getGroupDetail } from '../lib/api'
import api from '../lib/api'
import {
  Search, Plus, UsersRound, MapPin, ChevronRight, X, UserPlus, Trash2, Users,
  Filter, Calendar, MessageSquare, Layout, Info, Download
} from 'lucide-react'
import { GroupOverviewTabs, MemberDetailPanel, AttendanceRing, AddMemberModal } from './GroupDetail'
import { exportToCSV } from '../lib/export'
import { CELEBRATION_POINTS } from '../constants/campuses'

const CAMPUS_CODES = {
  WBB: 'Bbira', WBG: 'Bugolobi', WBW: 'Bweyogerere', WDT: 'Downtown',
  WEN: 'Entebbe', WGN: 'Nakwero', WGU: 'Gulu', WJB: 'Juba',
  WJJ: 'Jinja', WKA: 'Kansanga', WKY: 'Kyengera', WLB: 'Lubowa',
  WLM: 'Laminadera', WMB: 'Mbarara', WMK: 'Mukono', WNT: 'Ntinda',
  WNW: 'Nansana', WON: 'Online', WSU: 'Suubi',
}

function CreateGroupModal({ onClose, onCreated }) {
  const [campusCode, setCampusCode] = useState('WNT')
  const [groupNumber, setGroupNumber] = useState('')
  const [existingCodes, setExistingCodes] = useState([])
  const [nextNum, setNextNum] = useState(1)
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchCodes = async (code) => {
    setLoadingCodes(true)
    try {
      const campus = CAMPUS_CODES[code]
      const data = await api.get(`/api/formation-groups/codes?campus=${encodeURIComponent(campus)}`)
      setExistingCodes(data.codes || [])
      setNextNum(data.nextNum || 1)
      setGroupNumber(String(data.nextNum || 1))
    } catch { setExistingCodes([]); setNextNum(1); setGroupNumber('1') }
    finally { setLoadingCodes(false) }
  }

  useEffect(() => { fetchCodes(campusCode) }, [campusCode])

  const numVal = parseInt(groupNumber, 10)
  const previewCode = (!isNaN(numVal) && numVal > 0) ? `${campusCode}${String(numVal).padStart(2, '0')}` : `${campusCode}??`
  const isDuplicate = existingCodes.includes(previewCode)

  const handleSave = async () => {
    if (isDuplicate) { setError(`${previewCode} already exists — choose a different number`); return }
    if (isNaN(numVal) || numVal < 1) { setError('Enter a valid group number'); return }
    setSaving(true)
    setError(null)
    try {
      const celebration_point = CAMPUS_CODES[campusCode]
      await api.post('/api/formation-groups', { celebration_point, group_number: numVal })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">Create Formation Group</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label className="form-label">Campus</label>
            <select className="form-select" value={campusCode} onChange={e => setCampusCode(e.target.value)}>
              {Object.entries(CAMPUS_CODES).map(([code, name]) => (
                <option key={code} value={code}>{code} — {name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Group Number</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={groupNumber}
              onChange={e => setGroupNumber(e.target.value)}
              style={{ borderColor: isDuplicate ? 'var(--danger)' : undefined }}
            />
            {isDuplicate && (
              <div className="form-hint" style={{ color: 'var(--danger)' }}>{previewCode} is already taken</div>
            )}
          </div>

          <div style={{
            background: 'var(--bg-tertiary)', borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>Group Code Preview</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, color: isDuplicate ? 'var(--danger)' : 'var(--accent)' }}>{previewCode}</div>
            </div>
            {loadingCodes ? (
              <div className="spinner" style={{ width: 18, height: 18 }} />
            ) : existingCodes.length > 0 ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Existing codes</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end', maxWidth: 180 }}>
                  {existingCodes.map(c => (
                    <span key={c} style={{
                      fontSize: 11, padding: '2px 7px', borderRadius: 6,
                      background: c === previewCode ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)',
                      color: c === previewCode ? 'var(--danger)' : 'var(--text-secondary)',
                      border: `1px solid ${c === previewCode ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.3)'}`,
                      fontWeight: c === previewCode ? 700 : 400
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No existing groups</div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || isDuplicate || isNaN(numVal) || numVal < 1}>
            {saving ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FormationGroups() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const platform = useAppStore(s => s.platform)
  const navigate = useNavigate()
  const hasRole = useAuthStore(s => s.hasRole)
  const user = useAuthStore(s => s.user)

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [campusFilter, setCampusFilter] = useState('All')
  const [showCreate, setShowCreate] = useState(false)

  // Sub-detail states
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const [activeMembers, setActiveMembers] = useState([])
  const [activeReports, setActiveReports] = useState([])
  const [loadingGroupDetail, setLoadingGroupDetail] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')

  useEffect(() => { setPageTitle('Formation Groups') }, [setPageTitle])

  const loadGroups = async () => {
    try {
      const data = await getGroups()
      setGroups(data.groups || data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadGroups() }, [])

  const loadGroupDetail = async (id) => {
    setLoadingGroupDetail(true)
    setSelectedMember(null)
    setActiveGroup(groups.find(g => g.id === id) || null)
    try {
      const data = await getGroupDetail(id)
      setActiveGroup(data.group || data)
      setActiveMembers(data.members || data.students || [])
      setActiveReports(data.reports || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingGroupDetail(false)
    }
  }

  useEffect(() => {
    if (selectedGroupId && platform === 'desktop') {
      loadGroupDetail(selectedGroupId)
    }
  }, [selectedGroupId, platform])

  const campuses = ['All', ...CELEBRATION_POINTS]

  const filtered = useMemo(() => {
    let list = groups
    if (campusFilter !== 'All') list = list.filter(g => g.celebration_point === campusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(g =>
        (g.group_code || '').toLowerCase().includes(q) ||
        (g.name || '').toLowerCase().includes(q) ||
        (g.facilitator_name || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [groups, campusFilter, search])

  const handleGroupSelect = (g) => {
    if (platform === 'mobile') {
      navigate(`/groups/${g.id}`)
    } else {
      setSelectedGroupId(g.id)
    }
  }

  const filteredMembers = activeMembers.filter(m =>
    (m.student_name || '').toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    (m.student_email || '').toLowerCase().includes(memberSearchQuery.toLowerCase())
  )

  if (loading) return <div style={{ padding: 24 }}>{[0, 1, 2, 3].map(i => <div key={i} className="skeleton skeleton-row" />)}</div>

  if (platform === 'desktop') {
    return (
      <div className="three-col" style={{ gridTemplateColumns: '300px 380px 1fr', gap: 0, margin: '-24px', height: 'calc(100vh - 64px)' }}>
        {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={loadGroups} />}
        {showAddMember && selectedGroupId && <AddMemberModal groupId={selectedGroupId} onClose={() => setShowAddMember(false)} onAdded={() => loadGroupDetail(selectedGroupId)} />}

        {/* Column 1 - Groups List */}
        <div className="col-sidebar" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(20,20,32,0.2)' }}>
          <div style={{ padding: '20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Groups ({filtered.length})</h2>
              {(hasRole('Admin') || hasRole('Coordinator') || hasRole('TechSupport') || hasRole('Pastor')) && (
                <button className="btn btn-primary btn-icon btn-sm" onClick={() => setShowCreate(true)}>
                  <Plus size={16} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="search-box">
                <Search size={14} />
                <input placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
                <select 
                  className="form-select form-select-sm" 
                  value={campusFilter} 
                  onChange={e => setCampusFilter(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {campuses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  title="Download CSV"
                  onClick={() => exportToCSV(filtered, 'formation-groups.csv')}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="col-list-scroll" style={{ padding: '0 8px 20px' }}>
            {filtered.map(g => (
              <div 
                key={g.id} 
                className={`list-item ${selectedGroupId === g.id ? 'selected' : ''}`} 
                onClick={() => handleGroupSelect(g)}
                style={{ borderRadius: 12, marginBottom: 4, padding: '12px' }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'white', marginRight: 12
                }}>{(g.group_code || '??').slice(0, 3)}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{g.group_code}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={10} /> {g.celebration_point}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{g.member_count || 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Members</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2 - Members List */}
        <div className="col-list" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {selectedGroupId && activeGroup ? (
            <>
              <div style={{ padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{activeGroup.group_code} Members</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)} style={{ color: 'var(--accent-light)' }}>
                    <UserPlus size={14} style={{ marginRight: 6 }} /> Add
                  </button>
                </div>
                <div className="search-box">
                  <Search size={14} />
                  <input placeholder="Filter members…" value={memberSearchQuery} onChange={e => setMemberSearchQuery(e.target.value)} />
                </div>
              </div>
              
              <div className="col-list-scroll" style={{ padding: '0 0 20px' }}>
                {loadingGroupDetail ? (
                  <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : filteredMembers.length === 0 ? (
                  <div className="empty-state" style={{ padding: 40 }}>
                    <Users size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No members found</div>
                  </div>
                ) : (
                  filteredMembers.map((m, i) => {
                    const risk = m.risk_category || 'Healthy'
                    return (
                      <div
                        key={m.student_id || i}
                        onClick={() => setSelectedMember(m)}
                        className={`list-item ${selectedMember?.student_id === m.student_id ? 'selected' : ''}`}
                        style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', borderRadius: 0 }}
                      >
                        <div className="avatar avatar-sm" style={{ 
                          background: risk === 'Critical' ? '#FF453A' : risk === 'Attention' ? '#FF9F0A' : '#6366f1' 
                        }}>
                          {(m.student_name || m.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{m.student_name || m.name || m.email || `Student ${m.student_id || i}`}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ 
                              color: risk === 'Critical' ? '#FF453A' : risk === 'Attention' ? '#FF9F0A' : '#34C759',
                              fontWeight: 600
                            }}>{risk}</span>
                            <span>•</span>
                            <span>{m.progress || 0}% Progress</span>
                          </div>
                        </div>
                        <AttendanceRing percentage={Math.floor(Math.random() * 40) + 60} size={36} />
                      </div>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: 60 }}>
              <Layout size={40} style={{ opacity: 0.1, marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>Select a group</h3>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>Choose from the left column to view roster</p>
            </div>
          )}
        </div>

        {/* Column 3 - Detail Panel */}
        <div className="col-detail" style={{ background: 'rgba(15,15,22,0.4)', padding: 20, overflowY: 'auto' }}>
          {selectedMember ? (
            <MemberDetailPanel
              member={selectedMember}
              group={activeGroup}
              onClose={() => setSelectedMember(null)}
            />
          ) : activeGroup ? (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Info size={20} style={{ color: 'var(--accent-light)' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Group Overview</h3>
              </div>
              <GroupOverviewTabs group={activeGroup} reports={activeReports} currentUser={user} />
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 60 }}>
              <UsersRound size={40} style={{ opacity: 0.1, marginBottom: 16 }} />
              <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Select a group or member to see details</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Mobile list
  return (
    <div>
      <div className="ios-large-title">Groups</div>
      <div className="mobile-search">
        <Search size={16} />
        <input placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="ios-list">
        {filtered.map(g => (
          <div key={g.id} className="ios-row" onClick={() => handleGroupSelect(g)}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>{(g.group_code || '??').slice(0, 3)}</div>
            <div className="ios-row-main">
              <div className="ios-row-title">{g.group_code}</div>
              <div className="ios-row-subtitle">{g.facilitator_name || 'No facilitator'} · {g.member_count || 0} members</div>
            </div>
            <ChevronRight className="ios-row-chevron" />
          </div>
        ))}
      </div>

      {(hasRole('Admin') || hasRole('Coordinator') || hasRole('TechSupport') || hasRole('Pastor')) && (
        <button className="fab" onClick={() => setShowCreate(true)}><Plus size={24} /></button>
      )}
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={loadGroups} />}
    </div>
  )
}
