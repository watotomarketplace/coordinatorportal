import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, MessageSquare, Check, Users } from 'lucide-react'
import api from '../lib/api'

// Initials avatar — colour derived from name hash
function InitialsAvatar({ name, size = 32 }) {
    const initials = name
        ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?'
    const hue = name
        ? [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
        : 200
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: 'hsl(' + hue + ',55%,45%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.38, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px'
        }}>
            {initials}
        </div>
    )
}

export default function AttendanceModal({ groupId, sessionId = null, groupName, onClose, onSave }) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [members, setMembers] = useState([])
    const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10))
    const [weekNumber, setWeekNumber] = useState(1)
    const [didNotMeet, setDidNotMeet] = useState(false)
    const [notes, setSessionNotes] = useState('')
    const [attendanceLog, setAttendanceLog] = useState({})

    const loadData = async () => {
        setLoading(true)
        try {
            const mRes = await api.get(`/api/attendance/group/${groupId}/members`)
            const groupMembers = mRes.members || []
            setMembers(groupMembers)

            const initialLog = {}
            groupMembers.forEach(m => {
                initialLog[m.id] = { attended: false, note: '', noteOpen: false }
            })

            if (sessionId) {
                const sRes = await api.get(`/api/attendance/sessions/${sessionId}`)
                if (sRes.success) {
                    setSessionDate(sRes.session.session_date)
                    setWeekNumber(sRes.session.week_number || 1)
                    setDidNotMeet(!!sRes.session.did_not_meet)
                    setSessionNotes(sRes.session.notes || '')

                    if (sRes.attendance) {
                        sRes.attendance.forEach(record => {
                            if (initialLog[record.group_member_id]) {
                                initialLog[record.group_member_id] = {
                                    attended: !!record.attended,
                                    note: record.note || '',
                                    noteOpen: !!record.note
                                }
                            }
                        })
                    }
                }
            }
            setAttendanceLog(initialLog)
        } catch (err) {
            console.error('Failed to load attendance data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [groupId, sessionId])

    const handleSave = async () => {
        setSaving(true)
        try {
            let actualSessionId = sessionId
            
            const sessionPayload = {
                session_date: sessionDate,
                week_number: weekNumber,
                did_not_meet: didNotMeet,
                notes: notes || null
            }

            if (sessionId) {
                await api.put(`/api/attendance/sessions/${sessionId}`, sessionPayload)
            } else {
                const res = await api.post(`/api/attendance/group/${groupId}/sessions`, sessionPayload)
                actualSessionId = res.sessionId
            }

            if (!didNotMeet) {
                const checkinPayload = members.map(m => ({
                    group_member_id: m.id,
                    attended: !!attendanceLog[m.id]?.attended,
                    note: attendanceLog[m.id]?.note || null
                }))
                await api.post(`/api/attendance/sessions/${actualSessionId}/checkin`, { attendance: checkinPayload })
            }

            if (onSave) onSave()
            onClose()
        } catch (err) {
            alert('Failed to save attendance: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const toggleAttended = (id) => {
        setAttendanceLog(prev => ({
            ...prev,
            [id]: { ...prev[id], attended: !prev[id].attended }
        }))
    }

    const toggleNote = (id) => {
        setAttendanceLog(prev => ({
            ...prev,
            [id]: { ...prev[id], noteOpen: !prev[id].noteOpen }
        }))
    }

    const setMemberNote = (id, val) => {
        setAttendanceLog(prev => ({
            ...prev,
            [id]: { ...prev[id], note: val }
        }))
    }

    const attendedCount = Object.values(attendanceLog).filter(v => v.attended).length

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 1000 }}>
            <div className="glass-card-solid" style={{ 
                width: '100%', 
                maxWidth: 500, 
                padding: 0, 
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{ 
                    padding: '20px 24px', 
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)'
                }}>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{sessionId ? 'Edit Session' : 'Record Session'}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{groupName} • Week {weekNumber}</p>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ padding: 24, maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : (
                        <div style={{ display: 'grid', gap: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Calendar size={14} /> Session Date
                                    </label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={sessionDate} 
                                        onChange={e => setSessionDate(e.target.value)} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Clock size={14} /> Week
                                    </label>
                                    <select 
                                        className="form-select" 
                                        value={weekNumber} 
                                        onChange={e => setWeekNumber(Number(e.target.value))}
                                    >
                                        {Array.from({ length: 13 }, (_, i) => i + 1).map(w => (
                                            <option key={w} value={w}>Week {w}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <label style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 12, 
                                padding: '12px 16px', 
                                borderRadius: 12, 
                                background: didNotMeet ? 'rgba(255, 69, 58, 0.1)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${didNotMeet ? 'rgba(255, 69, 58, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}>
                                <input 
                                    type="checkbox" 
                                    checked={didNotMeet} 
                                    onChange={e => setDidNotMeet(e.target.checked)}
                                    style={{ width: 18, height: 18, accentColor: '#FF453A' }}
                                />
                                <span style={{ fontSize: 14, fontWeight: 600, color: didNotMeet ? '#FF453A' : 'var(--text-primary)' }}>
                                    Group did not meet this week
                                </span>
                            </label>

                            {!didNotMeet && (
                                <>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Users size={14} /> Attendance Checklist
                                            </label>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-light)' }}>
                                                {attendedCount} / {members.length} Present
                                            </span>
                                        </div>
                                        <div style={{ 
                                            background: 'rgba(255,255,255,0.03)', 
                                            borderRadius: 16, 
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            maxHeight: 320,
                                            overflowY: 'auto'
                                        }}>
                                            {members.map(m => {
                                                const log = attendanceLog[m.id] || { attended: false, note: '', noteOpen: false }
                                                return (
                                                    <div key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div 
                                                            onClick={() => toggleAttended(m.id)}
                                                            style={{ 
                                                                padding: '12px 16px', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: 12,
                                                                cursor: 'pointer',
                                                                background: log.attended ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: 24, height: 24, borderRadius: 6,
                                                                border: `2px solid ${log.attended ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                                                                background: log.attended ? '#6366f1' : 'transparent',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}>
                                                                {log.attended && <Check size={16} color="white" strokeWidth={3} />}
                                                            </div>
                                                            <div style={{
                                                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                                                background: `rgba(255,255,255,0.1)`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: 12, fontWeight: 700, color: '#fff'
                                                            }}>
                                                                {(m.student_name || m.name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.student_name || m.name || m.email || `Student ${m.id}`}</div>
                                                                {log.note && <div style={{ fontSize: 11, color: 'var(--accent-light)', marginTop: 2 }}>📝 {log.note}</div>}
                                                            </div>
                                                            <button 
                                                                className="btn btn-ghost btn-icon btn-sm"
                                                                onClick={(e) => { e.stopPropagation(); toggleNote(m.id); }}
                                                                style={{ color: log.noteOpen || log.note ? 'var(--accent-light)' : 'var(--text-tertiary)' }}
                                                            >
                                                                <MessageSquare size={14} />
                                                            </button>
                                                        </div>
                                                        {log.noteOpen && (
                                                            <div style={{ padding: '0 16px 16px 52px' }}>
                                                                <input 
                                                                    className="form-input"
                                                                    placeholder="Add a note for this student..."
                                                                    value={log.note}
                                                                    onChange={e => setMemberNote(m.id, e.target.value)}
                                                                    autoFocus
                                                                    style={{ fontSize: 12, padding: '8px 12px' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <MessageSquare size={14} /> Session Highlights
                                </label>
                                <textarea 
                                    className="form-input" 
                                    rows={3} 
                                    placeholder="How did the session go? Any special moments or concerns?"
                                    value={notes}
                                    onChange={e => setSessionNotes(e.target.value)}
                                    style={{ resize: 'none' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ 
                    padding: '20px 24px', 
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    gap: 12,
                    background: 'rgba(255,255,255,0.03)'
                }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
                    <button 
                        className="btn btn-primary" 
                        style={{ flex: 2 }} 
                        onClick={handleSave} 
                        disabled={saving || loading}
                    >
                        {saving ? 'Saving...' : sessionId ? 'Update Session' : 'Record Session'}
                    </button>
                </div>
            </div>
        </div>
    )
}
