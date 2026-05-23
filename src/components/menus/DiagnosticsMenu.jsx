import React from 'react'
import { Activity, RefreshCw, Database, Cloud, Server, Wifi } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'
import api from '../../lib/api.js'

export default function DiagnosticsMenu({ openMenu, handleMenuClick, closeMenu }) {
    const handleClearCache = async () => {
        closeMenu()
        try { await api.post('/api/thinkific/refresh') } catch (_) {}
    }

    return (
        <>
            <MenuTrigger id="diag-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Activity} label="Run Full Diagnostic" shortcut="⌘R"
                    onClick={() => { menuBus.emit('diagnostics:run'); closeMenu() }} />
                <MenuItem icon={RefreshCw} label="Clear Cache & Retry"
                    onClick={handleClearCache} />
            </MenuTrigger>

            <MenuTrigger id="diag-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Wifi} label="Thinkific Status"
                    onClick={() => menuBus.emit('diagnostics:scroll', { section: 'thinkific' })} closeMenu={closeMenu} />
                <MenuItem icon={Cloud} label="Notion Status"
                    onClick={() => menuBus.emit('diagnostics:scroll', { section: 'notion' })} closeMenu={closeMenu} />
                <MenuItem icon={Database} label="Database Stats"
                    onClick={() => menuBus.emit('diagnostics:scroll', { section: 'database' })} closeMenu={closeMenu} />
                <MenuItem icon={Server} label="Cache Status"
                    onClick={() => menuBus.emit('diagnostics:scroll', { section: 'cache' })} closeMenu={closeMenu} />
            </MenuTrigger>
        </>
    )
}
