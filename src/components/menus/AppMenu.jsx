import React from 'react'
import { RefreshCw, Cloud, LogOut, Settings, Info } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'
import api from '../../lib/api.js'

export default function AppMenu({ openMenu, handleMenuClick, closeMenu, navigate, hasRole, user }) {
    const handleRefresh = () => {
        closeMenu()
        menuBus.emit('app:refreshThinkific')
    }

    const handleNotionSync = async () => {
        closeMenu()
        try { await api.post('/api/notion/sync') } catch (_) {}
    }

    const handleLogout = async () => {
        closeMenu()
        try { await api.post('/api/auth/logout') } catch (_) {}
        window.location.href = '/login'
    }

    return (
        <MenuTrigger id="app" label="WL101" openMenu={openMenu} handleMenuClick={handleMenuClick} appName>
            <MenuItem icon={Info} label="About WL101 Portal"
                onClick={() => menuBus.emit('about')} closeMenu={closeMenu} />
            <MenuSeparator />
            <MenuItem icon={Settings} label="Preferences…" shortcut="⌘,"
                onClick={() => navigate('/settings')} closeMenu={closeMenu} />
            <MenuSeparator />
            <MenuItem icon={RefreshCw} label="Refresh Data" shortcut="⌘R"
                onClick={handleRefresh} />
            {(hasRole('Admin') || hasRole('TechSupport')) && (
                <MenuItem icon={Cloud} label="Sync Notion Now"
                    onClick={handleNotionSync} />
            )}
            <MenuSeparator />
            <MenuItem icon={LogOut} label="Sign Out" danger onClick={handleLogout} />
        </MenuTrigger>
    )
}
