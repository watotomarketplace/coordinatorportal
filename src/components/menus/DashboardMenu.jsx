import React from 'react'
import { RefreshCw, Building2, Layers, CalendarCheck, Shield } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, CampusSubmenu } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'

export default function DashboardMenu({ openMenu, handleMenuClick, closeMenu }) {
    return (
        <MenuTrigger id="dash-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
            <MenuItem icon={RefreshCw} label="Refresh Dashboard" shortcut="⌘R"
                onClick={() => menuBus.emit('dashboard:refresh')} closeMenu={closeMenu} />
            <MenuSeparator />
            <CampusSubmenu
                icon={Building2}
                onSelect={campus => menuBus.emit('dashboard:filter-campus', { campus })}
                closeMenu={closeMenu}
            />
            <MenuSeparator />
            <MenuItem icon={Shield} label="Show Risk Overview"
                onClick={() => menuBus.emit('dashboard:scroll', { section: 'risk' })} closeMenu={closeMenu} />
            <MenuItem icon={Layers} label="Show Formation Layer"
                onClick={() => menuBus.emit('dashboard:scroll', { section: 'formation' })} closeMenu={closeMenu} />
            <MenuItem icon={CalendarCheck} label="Show Attendance Layer"
                onClick={() => menuBus.emit('dashboard:scroll', { section: 'attendance' })} closeMenu={closeMenu} />
        </MenuTrigger>
    )
}
