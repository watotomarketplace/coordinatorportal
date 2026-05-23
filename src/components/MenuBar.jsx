import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import { useAppStore } from '../stores/appStore.js'
import menuBus from '../lib/menuBus.js'
import api from '../lib/api.js'
import AppMenu from './menus/AppMenu.jsx'
import WindowMenu from './menus/WindowMenu.jsx'
import DashboardMenu from './menus/DashboardMenu.jsx'
import StudentsMenu from './menus/StudentsMenu.jsx'
import FormationGroupsMenu from './menus/FormationGroupsMenu.jsx'
import UserManagementMenu from './menus/UserManagementMenu.jsx'
import AttendanceMenu from './menus/AttendanceMenu.jsx'
import WeeklyReportsMenu from './menus/WeeklyReportsMenu.jsx'
import AnalyticsMenu from './menus/AnalyticsMenu.jsx'
import CheckpointsMenu from './menus/CheckpointsMenu.jsx'
import ExportsMenu from './menus/ExportsMenu.jsx'
import TechSupportMenu from './menus/TechSupportMenu.jsx'
import DiagnosticsMenu from './menus/DiagnosticsMenu.jsx'
import SettingsMenu from './menus/SettingsMenu.jsx'
import MenuBarRight from './MenuBarRight.jsx'
import './MenuBar.css'

// Route → page-specific menu components to render (in order, between App and Window)
const PAGE_MENUS = {
    '/dashboard':         [DashboardMenu],
    '/students':          [StudentsMenu],
    '/groups':            [FormationGroupsMenu],
    '/admin':             [UserManagementMenu],
    '/attendance':        [AttendanceMenu],
    '/weekly-reports':    [WeeklyReportsMenu],
    '/reports':           [AnalyticsMenu],
    '/checkpoints':       [CheckpointsMenu],
    '/exports':           [ExportsMenu],
    '/tech-support':      [TechSupportMenu],
    '/admin/diagnostics': [DiagnosticsMenu],
    '/settings':          [SettingsMenu],
}

export default function MenuBar() {
    const location = useLocation()
    const navigate = useNavigate()
    const user = useAuthStore(s => s.user)
    const hasRole = useAuthStore(s => s.hasRole)
    const platform = useAppStore(s => s.platform)
    const menuBar = useAppStore(s => s.menuBar)
    const [openMenu, setOpenMenu] = useState(null)
    const barRef = useRef(null)

    // Desktop only
    if (platform === 'mobile') return null

    const closeMenu = () => setOpenMenu(null)

    const handleMenuClick = (menuId) => {
        setOpenMenu(prev => prev === menuId ? null : menuId)
    }

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (barRef.current && !barRef.current.contains(e.target)) setOpenMenu(null)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setOpenMenu(null) }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    // Global keyboard shortcuts
    useEffect(() => {
        const currentPath = location.pathname

        const handler = (e) => {
            const meta = e.metaKey || e.ctrlKey
            if (!meta) return

            // ⌘, → Settings
            if (e.key === ',') {
                e.preventDefault()
                navigate('/settings')
                return
            }

            // ⌘R → Refresh data
            if (e.key === 'r' && !e.shiftKey) {
                e.preventDefault()
                api.post('/api/thinkific/refresh').catch(() => {})
                menuBus.emit('dashboard:refresh')
                menuBus.emit('diagnostics:run')
                return
            }

            // Page-specific shortcuts
            if (['/students', '/groups', '/admin'].includes(currentPath)) {
                if (e.key === 'n') { e.preventDefault(); menuBus.emit(`${currentPath.slice(1)}:new`) }
                if (e.key === 'e') { e.preventDefault(); menuBus.emit(`${currentPath.slice(1)}:export`) }
            }
            if (currentPath === '/groups' && e.key === 'n') {
                e.preventDefault(); menuBus.emit('groups:new')
            }
            if (e.key === 'F' && e.shiftKey) {
                e.preventDefault()
                menuBus.emit('students:clear-filters')
                menuBus.emit('groups:clear-filters')
                menuBus.emit('weekly-reports:clear-filters')
                menuBus.emit('checkpoints:clear-filters')
            }
            if (e.key === 'e' && currentPath === '/exports') {
                e.preventDefault(); menuBus.emit('exports:roster')
            }
            if (e.key === 'g' && currentPath === '/checkpoints') {
                e.preventDefault(); menuBus.emit('checkpoints:generate')
            }
            if (e.key === 's' && currentPath === '/settings') {
                e.preventDefault(); menuBus.emit('settings:save')
            }
            if (e.key === 'f' && currentPath === '/tech-support') {
                e.preventDefault(); menuBus.emit('tech-support:focus-search')
            }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [location.pathname, navigate])

    // Determine page-specific menus — exact match first, then prefix match
    const path = location.pathname
    const pageMenuComponents = PAGE_MENUS[path]
        || Object.entries(PAGE_MENUS).find(([k]) => path.startsWith(k))?.[1]
        || []

    // Shared props passed to all menu components
    const ctx = {
        openMenu,
        handleMenuClick,
        closeMenu,
        navigate,
        hasRole,
        user,
        selectedStudent: menuBar.selectedStudent,
        selectedGroup:   menuBar.selectedGroup,
        selectedReport:  menuBar.selectedReport,
        selectedUser:    menuBar.selectedUser,
        selectedSession: menuBar.selectedSession,
    }

    return (
        <div className="menu-bar" ref={barRef} role="menubar" aria-label="Application menu">
            <div className="menu-bar-left">
                <AppMenu {...ctx} />
                {pageMenuComponents.map((MenuComponent, i) => (
                    <MenuComponent key={i} {...ctx} />
                ))}
                <WindowMenu {...ctx} />
            </div>
            <div className="menu-bar-right">
                <MenuBarRight user={user} hasRole={hasRole} navigate={navigate} />
            </div>
        </div>
    )
}
