import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { getGroupDetail } from '../lib/api'
import api from '../lib/api'
import GroupAttendance from '../components/GroupAttendance'
import EditGroupModal from '../components/EditGroupModal'
import { ArrowLeft, Users, MapPin, UserPlus, Trash2, Search, X, Calendar, MessageSquare, BarChart3, FileText, ChevronRight, Mail, Phone, Cake, Target, Activity, AlertTriangle, CheckCircle, Send, Eye, Flag, Edit } from 'lucide-react'

export function AddMemberModal({ groupId, onClose, onAdded }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [adding, setAdding] = useState(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = await api.get(`/api/data/available?group_id=${groupId}&search=${encodeURIComponent(search)}`)
        setResults(data.students || [])
      } catch { setResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, groupId])

  const handleAdd = async (student) => {
    setAdding(student.id)
    try {
      await api.post(`/api/formation-groups/${groupId}/members`, { 
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        student_email: student.email
      })
      onAdded()
      onClose()
    } catch (err) { alert(err.message) }
    finally { setAdding(null) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <span className="modal-title">Add Student</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <input
            className="form-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div style={{ marginTop: 12, maxHeight: 300, overflowY: 'auto' }}>
            {results.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div className="avatar avatar-sm" style={{ background: '#6366f1' }}>
                  {((s.first_name || '?')[0] + (s.last_name || '')[0]).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{s.first_name} {s.last_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.email}</div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAdd(s)}
                  disabled={adding === s.id}
                >{adding === s.id ? '…' : 'Add'}</button>
              </div>
            ))}
            {search.length >= 2 && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>
                No students found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AttendanceRing({ percentage, size = 40 }) {
  const color = percentage >= 70 ? '#34C759' : percentage >= 40 ? '#FF9F0A' : '#FF453A'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r="17" fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${percentage * 1.07} 107`}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.25, fontWeight: 600, color,
      }}>{percentage}%</div>
    </div>
  )
}

export function MemberDetailPanel({ member, group, onClose }) {
  if (!member) return null

  // Use real data from member
  const daysInactive = member.daysInactive || 0
  const riskCategory = member.risk_category || 'Healthy'
  const riskColor = riskCategory === 'Critical' ? '#FF453A' : riskCategory === 'Attention' ? '#FF9F0A' : '#34C759'
  
  const metrics = [
    { label: 'Login Recency', value: Math.max(0, 100 - (member.daysInactive || 0) * 3), percentage: Math.max(0, 100 - (member.daysInactive || 0) * 3), color: '#0A84FF' },
    { label: 'Progress Consistency', value: 100 - Math.min(100, (member.daysInactive || 0) * 2), percentage: 100 - Math.min(100, (member.daysInactive || 0) * 2), color: '#FF9F0A' },
    { label: 'Completion Rate', value: member.progress || 0, percentage: member.progress || 0, color: '#34C759' },
  ]

  return (
    <div style={{
      background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--glass-border)', borderRadius: 16,
      padding: 20,
      height: 'fit-content',
      position: 'sticky',
      top: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Member Details</h3>
        <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Member Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div className="avatar" style={{ background: '#6366f1', width: 48, height: 48, fontSize: 18 }}>
          {(member.student_name || member.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{member.student_name || member.name || member.email || `Student ${member.student_id || member.id}`}</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{member.student_email || member.email || '—'}</div>
        </div>
      </div>

      {/* Course & Status */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 6 }}>Current Course</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Watoto Leadership 101</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Days Inactive</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: daysInactive > 14 ? '#FF453A' : '#34C759' }}>
              {daysInactive}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Risk Intelligence</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: riskColor,
              }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: riskColor }}>
                {riskCategory}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Risk Metrics</h4>
        {metrics.map((metric, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{metric.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: metric.color }}>{metric.value}%</span>
            </div>
            <div style={{
              height: 6,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${metric.percentage}%`,
                height: '100%',
                background: metric.color,
                borderRadius: 3,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Contact Info */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Contact Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Email</div>
            <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Mail size={12} /> {member.student_email || '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Campus</div>
            <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={12} /> {group?.celebration_point || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.location.href = `mailto:${member.student_email}`}>
          <Send size={14} style={{ marginRight: 6 }} /> Message
        </button>
        <button className="btn btn-secondary" style={{ flex: 1 }}>
          <Eye size={14} style={{ marginRight: 6 }} /> View Progress
        </button>
      </div>
    </div>
  )
}

export function GroupOverviewTabs({ group, reports, currentUser, onUpdated }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const res = await api.get(`/api/formation-groups/${group.id}/comments`)
      setComments(res.comments || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingComments(false)
    }
  }

  const postComment = async () => {
    if (!newComment.trim()) return
    setPostingComment(true)
    try {
      await api.post(`/api/formation-groups/${group.id}/comments`, { content: newComment })
      setNewComment('')
      loadComments()
    } catch (err) {
      alert('Failed to post comment')
    } finally {
      setPostingComment(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'comments') {
      loadComments()
    }
  }, [activeTab, group.id])

  return (
    <div style={{
      background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--glass-border)', borderRadius: 16,
      padding: 20,
      height: 'fit-content',
    }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
        {['overview', 'reports', 'sessions', 'comments'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab ? '#6366f1' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'reports' && 'Weekly Reports'}
            {tab === 'sessions' && 'Sessions'}
            {tab === 'comments' && 'Comments'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Group Overview</h3>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'TechSupport') && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowEditModal(true)}
                style={{ height: 28, padding: '0 8px', gap: 4 }}
              >
                <Edit size={14} /> Edit Group
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Campus</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{group.celebration_point || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Cohort</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{group.cohort || '2026 Q1'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Facilitator</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{group.facilitator_name || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Co-Facilitator</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{group.co_facilitator_name || '—'}</div>
            </div>
          </div>

          {showEditModal && (
            <EditGroupModal 
              group={group} 
              onClose={() => setShowEditModal(false)} 
              onUpdated={onUpdated} 
            />
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Weekly Reports</h3>
          {(!reports || reports.length === 0) ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>
              No reports submitted yet
            </div>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {reports.map(report => (
                <div key={report.id} style={{
                  padding: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Week {report.week_number}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {new Date(report.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Attendance: {report.attendance_count} • Engagement: {report.engagement_level}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div style={{ marginTop: -10 }}>
          <GroupAttendance groupId={group.id} groupName={group.group_code} currentUser={currentUser} />
        </div>
      )}

      {activeTab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Group Comments</h3>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, paddingRight: 8 }}>
            {loadingComments ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>Loading comments...</div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>No comments yet.</div>
            ) : (
              comments.map((comment, i) => (
                <div key={i} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{comment.author} · {comment.role}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: 14, margin: 0, color: 'var(--text-primary)' }}>{comment.content}</p>
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && postComment()}
              placeholder="Write a comment..."
              className="form-input"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={postComment} disabled={postingComment || !newComment.trim()}>
              <Send size={16} /> Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const platform = useAppStore(s => s.platform)
  const hasRole = useAuthStore(s => s.hasRole)

  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadGroup = async () => {
    try {
      const data = await getGroupDetail(id)
      console.log('[GroupDetail] API response:', data)
      setGroup(data.group || data)
      const membersData = data.members || data.students || []
      console.log('[GroupDetail] Members data:', membersData)
      setMembers(membersData)
      setReports(data.reports || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadGroup() }, [id])
  useEffect(() => { if (group) setPageTitle(group.group_code || 'Group') }, [group, setPageTitle])

  const handleRemoveMember = async (studentId) => {
    if (!confirm('Remove this student from the group?')) return
    try {
      await api.delete(`/api/formation-groups/${id}/members/${studentId}`)
      setMembers(prev => prev.filter(m => m.id !== studentId && m.student_id !== studentId))
      if (selectedMember && (selectedMember.id === studentId || selectedMember.student_id === studentId)) {
        setSelectedMember(null)
      }
    } catch (err) { alert(err.message) }
  }

  const filteredMembers = members.filter(m =>
    m.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.student_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <div style={{ padding: 24 }}>{[0, 1, 2, 3].map(i => <div key={i} className="skeleton skeleton-row" />)}</div>

  if (!group) return (
    <div style={{ padding: 24 }}>
      <button className="btn btn-ghost" onClick={() => navigate('/groups')}>
        <ArrowLeft size={18} /> Back to Groups
      </button>
      <div className="empty-state" style={{ marginTop: 40 }}>
        <div className="empty-state-title">Group not found</div>
      </div>
    </div>
  )

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {showAddMember && <AddMemberModal groupId={id} onClose={() => setShowAddMember(false)} onAdded={loadGroup} />}

      {/* Back */}
      <button className="btn btn-ghost" onClick={() => navigate('/groups')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={18} /> Back to Groups
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Left Column - Group Info */}
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)', borderRadius: 16,
          padding: 24, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: 'white',
            }}>{(group.group_code || '??').slice(0, 3)}</div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{group.group_code}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {group.celebration_point || '—'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {members.length} members</span>
              </div>
            </div>
          </div>

          {group.facilitator_name && (
            <div style={{
              padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
              borderRadius: 10, fontSize: 13,
            }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Facilitator: </span>
              <span style={{ fontWeight: 600 }}>{group.facilitator_name}</span>
              {group.co_facilitator_name && (
                <>
                  <span style={{ color: 'var(--text-tertiary)', margin: '0 8px' }}>•</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>Co-Facilitator: </span>
                  <span style={{ fontWeight: 600 }}>{group.co_facilitator_name}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Middle Column - Members */}
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)', borderRadius: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Members ({members.length})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 32px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    width: 160,
                  }}
                />
              </div>
              {(hasRole('Admin') || hasRole('Coordinator') || hasRole('TechSupport') || hasRole('Facilitator')) && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>
                  <UserPlus size={14} /> Add
                </button>
              )}
            </div>
          </div>

          {members.length === 0 ? (
            <div className="empty-state">
              <Users className="empty-state-icon" />
              <div className="empty-state-title">No members yet</div>
              <div className="empty-state-text">Add students to this group</div>
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {filteredMembers.map((m, i) => {
                const attendancePercentage = m.percentage || 0
                return (
                  <div
                    key={m.id || m.membership_id || m.student_id || i}
                    onClick={() => setSelectedMember(m)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      background: selectedMember === m ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div className="avatar avatar-sm" style={{ background: '#6366f1' }}>
                      {(m.student_name || m.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{m.student_name || m.name || m.email || `Student ${m.student_id || m.id}`}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.student_email || m.email || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Attendance</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {m.attended || 0}/{m.total || 0} sessions · {attendancePercentage}%
                        </div>
                      </div>
                      <AttendanceRing percentage={attendancePercentage} size={40} />
                      {(hasRole('Admin') || hasRole('Coordinator') || hasRole('TechSupport')) && (
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.id || m.membership_id || m.student_id); }}
                          title="Remove"
                        >
                          <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column - Member Detail or Group Overview */}
        <div>
          {selectedMember ? (
            <MemberDetailPanel
              member={selectedMember}
              group={group}
              onClose={() => setSelectedMember(null)}
            />
          ) : (
            <GroupOverviewTabs group={group} reports={reports} currentUser={user} onUpdated={loadData} />
          )}
        </div>
      </div>
    </div>
  )
}