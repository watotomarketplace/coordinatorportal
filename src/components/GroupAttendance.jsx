import { useState, useEffect, useCallback } from 'react'

// Initials avatar — colour derived from name hash, matches existing portal style
function InitialsAvatar({ name, size = 36 }) {
    const initials = name
        ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?'
    const hue = name
        ? [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
        : 200
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: `hsl(${hue},55%,45%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.38, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px'
        }}>
            {initials}
        </div>
    )
}

// Attendance % badge — green / amber / red tint, same glass-tint style
function PctBadge({ pct }) {
    const [bg, border, color] =
        pct >= 80 ? ['rgba(0,184,148,0.15)', 'rgba(0,184,148,0.35)', '#00b894'] :
        pct >= 60 ? ['rgba(253,203,110,0.15)', 'rgba(253,203,110,0.35)', '#fdcb6e'] :
                    ['rgba(255,118,117,0.15)', 'rgba(255,118,117,0.35)', '#ff7675']
    return (
        <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: bg, border: `1px solid ${border}`, color
        }}>
            {pct}%
        </span>
    )
}

export default function GroupAttendance({ groupId, groupName, currentUser }) {
    const [members, setMembers]       = useState([])
    const [sessions, setSessions]     = useState([])
    const [summaries, setSummaries]   = useState([])
    const [loading, setLoading]       = useState(true)
    const [showModal, setShowModal]   = useState(false)
    const [saving, setSaving]         = useState(false)
    const [toast, setToast]           = useState(null)
    const [deleting, setDeleting]     = useState(null) // sessionId being deleted

    // The session being edited (null = creating new)
    const [editingSession, setEditingSession] = useState(null)

    // Check-in form state
    const today = new Date().toISOString().slice(0, 10)
    const [checkInDate, setCheckInDate]     = useState(today)
    const [checkInWeek, setCheckInWeek]     = useState(1)
    const [didNotMeet, setDidNotMeet]       = useState(false)
    const [sessionNotes, setSessionNotes]   = useState('')
    const [attendanceLog, setAttendanceLog] = useState({})
    // attendanceLog[memberId] = { attended: bool, note: string, noteOpen: bool }

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchData = useCallback(async () => {
        if (!groupId) return
        setLoading(true)
        try {
            const [mRes, sRes, sumRes] = await Promise.all([
                fetch(`/api/attendance/group/${groupId}/members`),
                fetch(`/api/attendance/group/${groupId}/sessions`),
                fetch(`/api/attendance/group/${groupId}/summary`),
            ])
            const [mData, sData, sumData] = await Promise.all([mRes.json(), sRes.json(), sumRes.json()])
            if (mData.success) setMembers(mData.members || [])
            if (sData.success) setSessions(sData.sessions || [])
            if (sumData.success) setSummaries(sumData.summaries || [])
        } catch (e) {
            console.error('GroupAttendance fetch error:', e)
        } finally {
            setLoading(false)
        }
    }, [groupId])

    useEffect(() => { fetchData() }, [fetchData])

    // Open modal for NEW session
    const openNewSession = () => {
        setEditingSession(null)
        setCheckInDate(today)
        setCheckInWeek(1)
        setDidNotMeet(false)
        setSessionNotes('')
        setShowModal(true)
    }

    // Open modal for EDITING an existing session
    const openEditSession = async (session) => {
        setEditingSession(session)
        setCheckInDate(session.session_date || today)
        setCheckInWeek(session.week_number || 1)
        setDidNotMeet(!!session.did_not_meet)
        setSessionNotes(session.notes || '')

        // Load existing attendance for this session
        try {
            const res = await fetch(`/api/attendance/sessions/${session.id}`)
            const data = await res.json()
            if (data.success && data.attendance) {
                const log = {}
                members.forEach(m => {
                    const record = data.attendance.find(a => a.group_member_id === m.id)
                    log[m.id] = {
                        attended: record ? !!record.attended : false,
                        note: record?.note || '',
                        noteOpen: !!(record?.note),
                    }
                })
                setAttendanceLog(log)
            }
        } catch (e) {
            console.error('Failed to load session attendance:', e)
            // Fallback: blank log
            const log = {}
            members.forEach(m => { log[m.id] = { attended: false, note: '', noteOpen: false } })
            setAttendanceLog(log)
        }

        setShowModal(true)
    }

    // Re-initialise attendanceLog when modal opens for NEW session
    useEffect(() => {
        if (!showModal || editingSession) return
        const log = {}
        members.forEach(m => {
            log[m.id] = { attended: false, note: '', noteOpen: false }
        })
        setAttendanceLog(log)
    }, [showModal, members, editingSession])

    const toggleAttended = (id) => {
        setAttendanceLog(prev => ({
            ...prev,
            [id]: { ...prev[id], attended: !prev[id].attended }
        }))
    }

    const setNote = (id, val) => {
        setAttendanceLog(prev => ({ ...prev, [id]: { ...prev[id], note: val } }))
    }

    const toggleNoteOpen = (id) => {
        setAttendanceLog(prev => ({ ...prev, [id]: { ...prev[id], noteOpen: !prev[id].noteOpen } }))
    }

    const attendedCount = Object.values(attendanceLog).filter(v => v.attended).length

    const handleSave = async () => {
        setSaving(true)
        try {
            let sessionId

            if (editingSession) {
                // UPDATE existing session
                const uRes = await fetch(`/api/attendance/sessions/${editingSession.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_date: checkInDate,
                        week_number: checkInWeek,
                        did_not_meet: didNotMeet,
                        notes: sessionNotes || null,
                    })
                })
                const uData = await uRes.json()
                if (!uData.success) throw new Error(uData.message)
                sessionId = editingSession.id
            } else {
                // CREATE new session
                const sRes = await fetch(`/api/attendance/group/${groupId}/sessions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_date: checkInDate,
                        week_number: checkInWeek,
                        did_not_meet: didNotMeet,
                        notes: sessionNotes || null,
                    })
                })
                const sData = await sRes.json()
                if (!sData.success) throw new Error(sData.message)
                sessionId = sData.sessionId
            }

            // Submit attendance (skip if group did not meet)
            if (!didNotMeet) {
                const payload = members.map(m => ({
                    group_member_id: m.id,
                    attended: !!(attendanceLog[m.id]?.attended),
                    note: attendanceLog[m.id]?.note || null,
                }))
                const cRes = await fetch(`/api/attendance/sessions/${sessionId}/checkin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ attendance: payload })
                })
                const cData = await cRes.json()
                if (!cData.success) throw new Error(cData.message)
            }

            setShowModal(false)
            setEditingSession(null)
            await fetchData()
            showToast(editingSession ? 'Session updated' : 'Session saved')
        } catch (e) {
            showToast(e.message || 'Failed to save session', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (sessionId) => {
        if (!confirm('Delete this session and all its attendance records?')) return
        setDeleting(sessionId)
        try {
            const res = await fetch(`/api/attendance/sessions/${sessionId}`, { method: 'DELETE' })
            const data = await res.json()
            if (!data.success) throw new Error(data.message)
            await fetchData()
            showToast('Session deleted')
        } catch (e) {
            showToast(e.message || 'Failed to delete session', 'error')
        } finally {
            setDeleting(null)
        }
    }

    // ─── Shared inline styles matching the app's design tokens ───────────────

    const panelStyle = {
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 20,
    }

    const panelHeaderStyle = {
        padding: '12px 16px',
        borderBottom: '1px solid var(--glass-border)',
        fontSize: 13, fontWeight: 600,
        color: 'var(--text-primary)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }

    const rowStyle = {
        padding: '10px 14px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', gap: 10,
    }

    const inputStyle = {
        width: '100%', padding: '9px 12px', borderRadius: 8,
        background: 'rgba(255,255,255,0.07)', border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
    }

    // ─── Loading state ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={panelStyle}>
                <div style={panelHeaderStyle}>📅 Attendance</div>
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                    Loading attendance…
                </div>
            </div>
        )
    }

    // ─── Summary map (memberId → summary) ────────────────────────────────────

    const summaryMap = {}
    summaries.forEach(s => { summaryMap[s.memberId] = s })

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
                    padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: toast.type === 'error' ? 'rgba(255,59,48,0.9)' : 'rgba(0,184,148,0.9)',
                    color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* ── Attendance header panel ── */}
            <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                    <span>📅 Attendance</span>
                    <button
                        onClick={openNewSession}
                        style={{
                            padding: '6px 14px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                        }}
                    >
                        + Record Session
                    </button>
                </div>

                {/* Members attendance overview */}
                {members.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                        No members in this group yet. Add students above to start tracking attendance.
                    </div>
                ) : (
                    <div>
                        {members.map(m => {
                            const sum = summaryMap[m.id]
                            const pct = sum?.percentage ?? 0
                            return (
                                <div key={m.id} style={rowStyle}>
                                    <InitialsAvatar name={m.student_name} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {m.student_name}
                                        </div>
                                        {sum && sum.totalSessions > 0 && (
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                {sum.sessionsAttended}/{sum.totalSessions} sessions
                                                {sum.currentStreak > 1 && ` · 🔥 ${sum.currentStreak} streak`}
                                            </div>
                                        )}
                                    </div>
                                    {sum && sum.totalSessions > 0 && <PctBadge pct={pct} />}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Sessions history panel ── */}
            <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                    <span>Sessions ({sessions.length})</span>
                </div>
                {sessions.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                        No sessions recorded yet. Use "Record Session" above to log the first one.
                    </div>
                ) : (
                    <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                        {sessions.map(s => {
                            const dateStr = new Date(s.session_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                            const isDeleting = deleting === s.id
                            return (
                                <div key={s.id} style={{
                                    padding: 14, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                    position: 'relative',
                                }}
                                    onClick={() => openEditSession(s)}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{dateStr}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {s.did_not_meet ? (
                                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(253,203,110,0.15)', color: '#fdcb6e', fontWeight: 600 }}>DNM</span>
                                            ) : (
                                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Wk {s.week_number || '—'}</span>
                                            )}
                                            {/* Delete button */}
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDelete(s.id) }}
                                                disabled={isDeleting}
                                                title="Delete session"
                                                style={{
                                                    background: 'none', border: 'none', cursor: isDeleting ? 'wait' : 'pointer',
                                                    color: 'rgba(255,118,117,0.6)', fontSize: 14, padding: '0 2px',
                                                    lineHeight: 1, transition: 'color 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#ff7675'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,118,117,0.6)'}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                    {!s.did_not_meet && (
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                            👥 {s.attendance_count}/{s.member_count} attended
                                        </div>
                                    )}
                                    {s.notes && (
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                                            {s.notes.slice(0, 80)}{s.notes.length > 80 ? '…' : ''}
                                        </div>
                                    )}
                                    {/* Edit hint */}
                                    <div style={{ fontSize: 10, color: 'rgba(74,158,255,0.5)', marginTop: 6 }}>
                                        Tap to edit
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Check-in Modal (Create + Edit) ── */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 10000,
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    }}
                    onClick={() => { setShowModal(false); setEditingSession(null) }}
                >
                    <div
                        style={{
                            width: '100%', maxWidth: 480,
                            background: 'var(--glass-layer-2, rgba(30,30,40,0.96))',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '20px 20px 0 0',
                            padding: '20px 20px 32px',
                            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {editingSession ? 'Edit Session' : 'Record Session'}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{groupName}</div>
                            </div>
                            <button onClick={() => { setShowModal(false); setEditingSession(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
                        </div>

                        {/* Date + Week */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date</label>
                                <input
                                    type="date" value={checkInDate}
                                    onChange={e => setCheckInDate(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ width: 90 }}>
                                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Week</label>
                                <select
                                    value={checkInWeek}
                                    onChange={e => setCheckInWeek(Number(e.target.value))}
                                    style={inputStyle}
                                >
                                    {Array.from({ length: 13 }, (_, i) => i + 1).map(w => (
                                        <option key={w} value={w}>Week {w}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Session notes */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Session Notes (optional)</label>
                            <textarea
                                value={sessionNotes}
                                onChange={e => setSessionNotes(e.target.value)}
                                placeholder="How did the session go?"
                                rows={2}
                                style={{
                                    ...inputStyle,
                                    resize: 'vertical',
                                    minHeight: 48,
                                }}
                            />
                        </div>

                        {/* Did not meet toggle */}
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                            padding: '10px 12px', borderRadius: 8,
                            background: didNotMeet ? 'rgba(253,203,110,0.1)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${didNotMeet ? 'rgba(253,203,110,0.3)' : 'var(--glass-border)'}`,
                            cursor: 'pointer',
                        }}>
                            <input
                                type="checkbox" checked={didNotMeet}
                                onChange={e => setDidNotMeet(e.target.checked)}
                                style={{ width: 16, height: 16, accentColor: '#fdcb6e', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 13, color: didNotMeet ? '#fdcb6e' : 'var(--text-secondary)', fontWeight: didNotMeet ? 600 : 400 }}>
                                Group did not meet this week
                            </span>
                        </label>

                        {/* Member checklist */}
                        {!didNotMeet && (
                            <>
                                <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
                                    {members.map(m => {
                                        const log = attendanceLog[m.id] || { attended: false, note: '', noteOpen: false }
                                        return (
                                            <div key={m.id} style={{ marginBottom: 4 }}>
                                                {/* Member row — 44px min height for mobile touch targets */}
                                                <div
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10,
                                                        minHeight: 44, padding: '6px 8px', borderRadius: 8,
                                                        background: log.attended ? 'rgba(74,158,255,0.08)' : 'transparent',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => toggleAttended(m.id)}
                                                >
                                                    {/* Custom checkbox */}
                                                    <div style={{
                                                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                                        border: log.attended ? 'none' : '2px solid rgba(255,255,255,0.3)',
                                                        background: log.attended ? '#4A9EFF' : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.15s',
                                                    }}>
                                                        {log.attended && (
                                                            <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                                                                <path d="M1 5l3.5 3.5L12 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                        )}
                                                    </div>

                                                    <InitialsAvatar name={m.student_name} size={30} />

                                                    <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', fontWeight: log.attended ? 600 : 400 }}>
                                                        {m.student_name}
                                                    </span>

                                                    {/* Note button */}
                                                    <button
                                                        onClick={e => { e.stopPropagation(); toggleNoteOpen(m.id) }}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            fontSize: 11, color: log.noteOpen || log.note ? '#4A9EFF' : 'var(--text-secondary)',
                                                            padding: '4px 6px', borderRadius: 4,
                                                        }}
                                                    >
                                                        {log.note ? '📝' : 'Note'}
                                                    </button>
                                                </div>

                                                {/* Inline note input */}
                                                {log.noteOpen && (
                                                    <input
                                                        autoFocus
                                                        placeholder="Add a note…"
                                                        value={log.note}
                                                        onChange={e => setNote(m.id, e.target.value)}
                                                        onClick={e => e.stopPropagation()}
                                                        style={{
                                                            width: '100%', margin: '2px 0 4px', padding: '7px 12px',
                                                            borderRadius: 6, fontSize: 12,
                                                            background: 'rgba(255,255,255,0.07)',
                                                            border: '1px solid rgba(74,158,255,0.4)',
                                                            color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Live counter */}
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>
                                    Attended: <strong style={{ color: 'var(--text-primary)' }}>{attendedCount}</strong> / {members.length}
                                </div>
                            </>
                        )}

                        {/* Save button */}
                        <button
                            disabled={saving}
                            onClick={handleSave}
                            style={{
                                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                                background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: saving ? 'var(--text-secondary)' : '#fff',
                                fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {saving ? 'Saving…' : editingSession ? 'Update Session' : 'Save Session'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
