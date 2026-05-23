import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, RefreshCw, CheckCircle2, Clock, AlertCircle, Settings, LogOut } from 'lucide-react'
import api from '../lib/api.js'
import menuBus from '../lib/menuBus.js'

// ─── Sync Status Pill ─────────────────────────────────────────────────────────

function SyncPill({ hasRole }) {
    const [status, setStatus] = useState(null) // { lastSync, studentCount, syncing }
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    const fetchStatus = useCallback(async () => {
        try {
            const data = await api.get('/api/thinkific/status')
            if (data.success !== false) setStatus(data)
        } catch (_) {}
    }, [])

    useEffect(() => {
        fetchStatus()
    }, [fetchStatus])

    // Poll faster while syncing, slower when idle
    useEffect(() => {
        const ms = status?.syncing ? 5000 : 60000
        const interval = setInterval(fetchStatus, ms)
        return () => clearInterval(interval)
    }, [fetchStatus, status?.syncing])

    // Trigger refresh when AppMenu emits 'app:refreshThinkific'
    useEffect(() => {
        return menuBus.on('app:refreshThinkific', async () => {
            try { await api.post('/api/thinkific/refresh') } catch (_) {}
            fetchStatus()
        })
    }, [fetchStatus])

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const canSee = hasRole('Admin') || hasRole('LeadershipTeam') || hasRole('TechSupport') || hasRole('Coordinator')
    if (!canSee || !status) return null

    const lastSync = status.lastSync ? new Date(status.lastSync) : null
    const minAgo = lastSync ? Math.floor((Date.now() - lastSync.getTime()) / 60000) : null
    const isSyncing = !!status.syncing
    const isError = !!status.error

    let pillClass = 'menu-bar-status-pill--fresh'
    let Icon = CheckCircle2
    let label = minAgo !== null ? (minAgo < 1 ? 'Just synced' : `Synced ${minAgo}m ago`) : 'Not synced'

    if (isSyncing)        { pillClass = 'menu-bar-status-pill--syncing'; Icon = RefreshCw; label = 'Syncing…' }
    else if (isError)     { pillClass = 'menu-bar-status-pill--error'; Icon = AlertCircle; label = 'Sync error' }
    else if (minAgo > 15) { pillClass = 'menu-bar-status-pill--stale'; Icon = Clock }
    else if (minAgo > 5)  { pillClass = 'menu-bar-status-pill--stale'; Icon = Clock }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                className={`menu-bar-status-pill ${pillClass}`}
                onClick={() => setOpen(o => !o)}
            >
                <Icon size={12} strokeWidth={1.75} />
                {label}
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 220,
                    background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--r-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    padding: '12px 14px', zIndex: 9999, fontSize: 12,
                    animation: 'menuDropIn 0.1s cubic-bezier(0.22,1,0.36,1)',
                }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Thinkific Sync</div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Last sync: {lastSync ? lastSync.toLocaleTimeString() : '—'}
                    </div>
                    {status.studentCount && (
                        <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                            Students: {status.studentCount.toLocaleString()}
                        </div>
                    )}
                    {status.cacheSize && (
                        <div style={{ color: 'var(--text-tertiary)' }}>
                            Cache: {status.cacheSize}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Notification Bell ────────────────────────────────────────────────────────

function NotificationBell({ navigate }) {
    const [notifications, setNotifications] = useState([])
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await api.get('/api/notifications?limit=5&unread=true')
            if (data.success) setNotifications(data.notifications || [])
        } catch (_) {}
    }, [])

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const unreadCount = notifications.filter(n => !n.read_at).length

    const markAllRead = async () => {
        try { await api.post('/api/notifications/mark-all-read') } catch (_) {}
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button className="menu-bar-bell-btn" onClick={() => setOpen(o => !o)} title="Notifications">
                <Bell size={14} strokeWidth={1.75} />
                {unreadCount > 0 && (
                    <div className="menu-bar-bell-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>

            {open && (
                <div className="menu-bar-notif-dropdown">
                    <div className="menu-bar-notif-header">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} style={{
                                fontSize: 11, color: 'var(--accent)', background: 'none',
                                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)',
                            }}>
                                Mark all read
                            </button>
                        )}
                    </div>
                    {notifications.length === 0 ? (
                        <div className="menu-bar-notif-empty">No new notifications</div>
                    ) : (
                        notifications.slice(0, 5).map(n => (
                            <div key={n.id} className="menu-bar-notif-item"
                                style={{ opacity: n.read_at ? 0.55 : 1 }}>
                                <div className="menu-bar-notif-msg">{n.message || n.title}</div>
                                <div className="menu-bar-notif-time">
                                    {new Date(n.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

// ─── User Pill ────────────────────────────────────────────────────────────────

function UserPill({ user, navigate }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const handleLogout = async () => {
        try { await api.post('/api/auth/logout') } catch (_) {}
        window.location.href = '/login'
    }

    const initials = (user?.name || user?.username || 'U')
        .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button className="menu-bar-user-pill" onClick={() => setOpen(o => !o)}>
                {user?.profile_image ? (
                    <img src={user.profile_image} className="menu-bar-avatar" alt={user.name} />
                ) : (
                    <div className="menu-bar-avatar-initials">{initials}</div>
                )}
                <span className="menu-bar-username">{user?.name || user?.username}</span>
            </button>

            {open && (
                <div className="menu-bar-user-dropdown">
                    <div className="menu-bar-user-info">
                        <div className="menu-bar-user-info-name">{user?.name || user?.username}</div>
                        <div className="menu-bar-user-info-role">
                            {user?.role}{user?.celebration_point ? ` · ${user.celebration_point}` : ''}
                        </div>
                    </div>
                    <button className="menu-item" style={{ borderRadius: 0 }}
                        onClick={() => { navigate('/settings'); setOpen(false) }}>
                        <span className="menu-item-icon"><Settings size={13} strokeWidth={1.75} /></span>
                        <span className="menu-item-label">Profile &amp; Preferences</span>
                    </button>
                    <div className="menu-separator" />
                    <button className="menu-item menu-item--danger" style={{ borderRadius: 0 }} onClick={handleLogout}>
                        <span className="menu-item-icon"><LogOut size={13} strokeWidth={1.75} /></span>
                        <span className="menu-item-label">Sign Out</span>
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function MenuBarRight({ user, hasRole, navigate }) {
    return (
        <>
            <SyncPill hasRole={hasRole} />
            <NotificationBell navigate={navigate} />
            <UserPill user={user} navigate={navigate} />
        </>
    )
}
