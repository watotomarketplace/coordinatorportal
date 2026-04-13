import { useState, useEffect, useCallback } from 'react'
import AttendanceRing from './AttendanceRing.jsx'
import AttendanceModal from './AttendanceModal.jsx'

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
        setEditingSession({ id: null })
        setShowModal(true)
    }

    // Open modal for EDITING an existing session
    const openEditSession = async (session) => {
        setEditingSession(session)
        setShowModal(true)
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
                                    <InitialsAvatar name={m.student_name || m.name || 'U'} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {m.student_name || m.name || m.email || `Student ${m.id}`}
                                        </div>
                                        {sum && sum.totalSessions > 0 && (
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                {sum.sessionsAttended}/{sum.totalSessions} sessions
                                                {sum.currentStreak > 1 && ` · 🔥 ${sum.currentStreak} streak`}
                                            </div>
                                        )}
                                    </div>
                                    {sum && sum.totalSessions > 0 && <AttendanceRing percentage={pct} size={36} />}
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
                <AttendanceModal
                    groupId={groupId}
                    sessionId={editingSession?.id}
                    groupName={groupName}
                    onClose={() => { setShowModal(false); setEditingSession(null); }}
                    onSave={() => { fetchData(); showToast(editingSession?.id ? 'Session updated' : 'Session saved'); }}
                />
            )}
        </div>
    )
}
