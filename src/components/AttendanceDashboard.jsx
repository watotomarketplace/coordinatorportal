import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import GroupAttendance from './GroupAttendance.jsx';
import AttendanceRing from './AttendanceRing.jsx';
import { exportToCSV } from '../lib/export';

const glass = { background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 16 }

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div style={{ ...glass, padding: '20px 24px', flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value ?? '—'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>{label}</div>
            {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sub}</div>}
        </div>
    )
}

function AttBar({ pct }) {
    if (pct === null || pct === undefined) {
        return <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>No data</span>
    }
    const color = pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171'
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 30, textAlign: 'right' }}>{pct}%</span>
        </div>
    )
}

export function DashboardWidget() {
    const navigate = useNavigate()
    const [data, setData] = React.useState(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        fetch('/api/attendance/dashboard')
            .then(r => r.json())
            .then(json => { if (json.success) setData(json) })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    if (loading) return null

    const summary = data?.summary || { totalSessions: 0, groupsWithSessions: 0, overallPct: null, totalGroups: 0 }
    const topGroups = (data?.groups || []).filter(g => Number(g.total_sessions) > 0).slice(0, 6)
    const hasSessions = summary.totalSessions > 0

    const sectionStyle = { marginTop: 24 }
    const headerStyle = {
        fontSize: 17, fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
    }
    const iconStyle = {
        width: 28, height: 28, borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', fontSize: 14,
    }
    const cardBase = {
        background: 'var(--glass-layer-2)',
        backdropFilter: 'var(--blur-layer-2)',
        border: 'var(--border-layer-2)',
        borderRadius: 16,
    }
    const pillColor = summary.overallPct >= 80 ? '#34d399' : summary.overallPct >= 60 ? '#fbbf24' : '#f87171'

    return (
        <div style={sectionStyle}>
            <h2 style={headerStyle}>
                <span style={iconStyle}>📅</span>
                Attendance Layer
            </h2>

            {/* 3 summary pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ ...cardBase, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Sessions</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{summary.totalSessions}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>recorded total</div>
                </div>
                <div style={{ ...cardBase, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Groups</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{summary.groupsWithSessions} <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>/ {summary.totalGroups}</span></div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>tracking sessions</div>
                </div>
                <div style={{ ...cardBase, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Avg Attendance</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: summary.overallPct !== null ? pillColor : 'var(--text-primary)' }}>
                        {summary.overallPct !== null ? `${summary.overallPct}%` : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>across all sessions</div>
                </div>
            </div>

            {/* Top groups list or empty state */}
            <div style={{ ...cardBase, overflow: 'hidden' }}>
                <div style={{
                    padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {hasSessions ? 'Top Groups by Sessions' : 'No Sessions Yet'}
                    </span>
                    <button
                        onClick={() => navigate('/attendance')}
                        style={{
                            background: 'none', border: 'none', color: '#4A9EFF',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
                        }}
                    >
                        View All →
                    </button>
                </div>

                {hasSessions ? (
                    <div style={{ padding: '8px 0' }}>
                        {topGroups.map(g => (
                            <div
                                key={g.id}
                                onClick={() => navigate('/attendance')}
                                style={{
                                    padding: '8px 16px', display: 'grid',
                                    gridTemplateColumns: '80px 1fr 60px',
                                    alignItems: 'center', gap: 12, cursor: 'pointer',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{g.group_code}</span>
                                <AttBar pct={g.avg_pct} />
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>
                                    {g.total_sessions} sess
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Start tracking attendance</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                            Open a Formation Group and record your first session to see attendance data here
                        </div>
                        <button
                            onClick={() => navigate('/attendance')}
                            style={{
                                padding: '8px 18px', borderRadius: 8, border: 'none',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            Go to Attendance
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Attendance Overview Page ──────────────────────────────────────────────────

export default function AttendanceDashboard() {
    const [user, setUser] = React.useState(null)
    const [summary, setSummary] = React.useState(null)
    const [groups, setGroups] = React.useState([])
    const [selectedGroupId, setSelectedGroupId] = React.useState(null)
    const [selectedGroupName, setSelectedGroupName] = React.useState('')
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [campusFilter, setCampusFilter] = React.useState('')

    React.useEffect(() => {
        async function init() {
            try {
                const sessionRes = await fetch('/api/auth/session')
                const sessionData = await sessionRes.json()
                if (!sessionData.user) {
                    setError('Not authenticated')
                    return
                }
                setUser(sessionData.user)
            } catch (err) {
                setError('Not authenticated')
                return
            }

            try {
                const dashRes = await fetch('/api/attendance/dashboard')
                const dashData = await dashRes.json()
                if (dashData.success) {
                    setSummary(dashData.summary)
                    setGroups(dashData.groups || [])
                } else {
                    setSummary({ totalSessions: 0, groupsWithSessions: 0, overallPct: null, totalGroups: 0 })
                }
            } catch (err) {
                console.error('AttendanceDashboard dashboard fetch error:', err)
                setSummary({ totalSessions: 0, groupsWithSessions: 0, overallPct: null, totalGroups: 0 })
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const campuses = React.useMemo(() => [...new Set(groups.map(g => g.celebration_point).filter(Boolean))].sort(), [groups])
    const filteredGroups = campusFilter ? groups.filter(g => g.celebration_point === campusFilter) : groups

    if (loading) {
        return (
            <div className="tahoe-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #4A9EFF', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="tahoe-page">
                <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>{error}</div>
            </div>
        )
    }

    if (selectedGroupId) {
        return (
            <div className="tahoe-page">
                <button onClick={() => { setSelectedGroupId(null); setSelectedGroupName('') }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#4A9EFF', cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0 }}>
                    ← Back to Overview
                </button>
                <GroupAttendance key={selectedGroupId} groupId={selectedGroupId} groupName={selectedGroupName} currentUser={user || {}} />
            </div>
        )
    }

    return (
        <div className="tahoe-page" style={{ display: 'flex', gap: 24 }}>
            {/* Campus Filter Sidebar */}
            {campuses.length > 1 && (
                <div style={{ width: 200, flexShrink: 0 }}>
                    <div style={{ position: 'sticky', top: 20 }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, paddingLeft: 8 }}>Campuses</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <button
                                onClick={() => setCampusFilter('')}
                                style={{
                                    textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: 'none',
                                    background: !campusFilter ? 'rgba(74,158,255,0.15)' : 'transparent',
                                    color: !campusFilter ? '#4A9EFF' : 'var(--text-primary)',
                                    fontSize: 13, fontWeight: !campusFilter ? 700 : 500, cursor: 'pointer',
                                }}
                                onMouseEnter={e => !campusFilter ? null : e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => !campusFilter ? null : e.currentTarget.style.background = 'transparent'}
                            >
                                All Campuses
                            </button>
                            {campuses.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCampusFilter(c)}
                                    style={{
                                        textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: 'none',
                                        background: campusFilter === c ? 'rgba(74,158,255,0.15)' : 'transparent',
                                        color: campusFilter === c ? '#4A9EFF' : 'var(--text-primary)',
                                        fontSize: 13, fontWeight: campusFilter === c ? 700 : 500, cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => campusFilter === c ? null : e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => campusFilter === c ? null : e.currentTarget.style.background = 'transparent'}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>📅 Attendance Overview</h2>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Session attendance across all formation groups</p>
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => exportToCSV(filteredGroups, 'attendance-summary.csv')}
                    >
                        <Download size={14} style={{ marginRight: 6 }} /> Export
                    </button>
                </div>

                {/* Summary cards */}
                {summary && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                        <StatCard icon="📋" label="Total Sessions" value={summary.totalSessions} sub="across all groups" />
                        <StatCard icon="🏘️" label="Groups Tracked" value={`${summary.groupsWithSessions} / ${summary.totalGroups}`} sub="have recorded sessions" />
                        <StatCard
                            icon="✅" label="Overall Attendance"
                            value={summary.overallPct !== null ? `${summary.overallPct}%` : '—'}
                            sub="average across sessions"
                            color={summary.overallPct >= 80 ? '#34d399' : summary.overallPct >= 60 ? '#fbbf24' : summary.overallPct !== null ? '#f87171' : undefined}
                        />
                    </div>
                )}

                {/* Groups grid */}
                {filteredGroups.length === 0 ? (
                    <div style={{ ...glass, padding: 48, textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 6 }}>No sessions recorded yet</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Open a Formation Group and use the Attendance section to record your first session</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                        {filteredGroups.map(g => (
                            <div key={g.id} onClick={() => { setSelectedGroupId(g.id); setSelectedGroupName(`${g.group_code} — ${g.name}`) }}
                                style={{ ...glass, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'rgba(74,158,255,0.4)'
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                    e.currentTarget.style.transform = 'none'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{g.group_code}</div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: 500 }}>{g.celebration_point}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{g.total_sessions} sessions</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{g.member_count} members</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <AttendanceRing percentage={g.avg_pct || 0} size={44} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Attendance</div>
                                        <AttBar pct={g.avg_pct} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
