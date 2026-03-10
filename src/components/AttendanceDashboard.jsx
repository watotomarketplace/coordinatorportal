import * as React from 'react';
import GroupAttendance from './GroupAttendance.jsx';

export default function AttendanceDashboard() {
    const [user, setUser] = React.useState(null)
    const [groups, setGroups] = React.useState([])
    const [selectedGroupId, setSelectedGroupId] = React.useState(null)
    const [selectedGroupName, setSelectedGroupName] = React.useState('')
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)

    React.useEffect(() => {
        async function init() {
            try {
                // 1. Get the active session user
                const sessionRes = await fetch('/api/auth/session')
                const sessionData = await sessionRes.json()
                if (!sessionData.success || !sessionData.user) {
                    setError('Not authenticated')
                    return
                }
                const currentUser = sessionData.user
                setUser(currentUser)

                // 2. Fetch groups scoped to this user's role/campus
                const groupsRes = await fetch('/api/formation-groups')
                const groupsData = await groupsRes.json()
                const availableGroups = groupsData.success ? (groupsData.groups || []) : []
                setGroups(availableGroups)

                // 3. Check for ?groupId= deep-link param (from group card button)
                const urlParams = new URLSearchParams(window.location.search)
                const deepLinkId = urlParams.get('groupId')

                if (deepLinkId) {
                    const group = availableGroups.find(g => String(g.id) === String(deepLinkId))
                    if (group) {
                        setSelectedGroupId(group.id)
                        setSelectedGroupName(`${group.group_code} — ${group.name}`)
                        return
                    }
                }

                // 4. Facilitators only have one group — auto-select it
                if (currentUser.role === 'Facilitator' && availableGroups.length > 0) {
                    setSelectedGroupId(availableGroups[0].id)
                    setSelectedGroupName(`${availableGroups[0].group_code} — ${availableGroups[0].name}`)
                }
            } catch (err) {
                setError('Failed to load attendance data')
                console.error('AttendanceDashboard init error:', err)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const handleGroupChange = (e) => {
        const id = e.target.value
        if (!id) {
            setSelectedGroupId(null)
            setSelectedGroupName('')
            return
        }
        const group = groups.find(g => String(g.id) === String(id))
        setSelectedGroupId(Number(id))
        setSelectedGroupName(group ? `${group.group_code} — ${group.name}` : '')
    }

    if (loading) {
        return (
            <div className="tahoe-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid #4A9EFF', borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite'
                }} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="tahoe-page">
                <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                    {error}
                </div>
            </div>
        )
    }

    const showGroupSelector = user && user.role !== 'Facilitator'

    return (
        <div className="tahoe-page">
            {/* Page header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>Attendance</h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                        Track member-level attendance across group sessions
                    </p>
                </div>

                {showGroupSelector && (
                    <select
                        value={selectedGroupId || ''}
                        onChange={handleGroupChange}
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.35)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 12,
                            color: 'white',
                            padding: '9px 14px',
                            fontSize: 14,
                            minWidth: 220,
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="">— Select a Group —</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>
                                {g.group_code} — {g.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Content area */}
            {!selectedGroupId ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: 320, gap: 14,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20, padding: 40,
                }}>
                    <span style={{ fontSize: 48 }}>📅</span>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
                        {showGroupSelector ? 'Select a group above to view attendance' : 'No formation group assigned'}
                    </p>
                    {showGroupSelector && groups.length === 0 && (
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                            No groups found for your campus
                        </p>
                    )}
                </div>
            ) : (
                <GroupAttendance
                    key={selectedGroupId}
                    groupId={selectedGroupId}
                    groupName={selectedGroupName}
                    currentUser={user || {}}
                />
            )}
        </div>
    )
}
