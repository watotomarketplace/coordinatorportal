import React from 'react'
import { Zap, Download, Building2, Hash, AlertTriangle, Clock } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, MenuSubmenu, CampusSubmenu } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'

export default function CheckpointsMenu({ openMenu, handleMenuClick, closeMenu, hasRole }) {
    const CHECKPOINT_WEEKS = [4, 8, 13]

    return (
        <>
            <MenuTrigger id="cp-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                {hasRole('Admin') && (
                    <MenuItem icon={Zap} label="Generate Checkpoints…" shortcut="⌘G"
                        onClick={() => menuBus.emit('checkpoints:generate')} closeMenu={closeMenu} />
                )}
                <MenuSeparator />
                <MenuItem icon={Download} label="Export Checkpoints (CSV)" shortcut="⌘E"
                    onClick={() => menuBus.emit('checkpoints:export')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="cp-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <CampusSubmenu icon={Building2}
                    onSelect={campus => menuBus.emit('checkpoints:filter-campus', { campus })}
                    closeMenu={closeMenu}
                />
                <MenuSubmenu icon={Hash} label="Filter by Week">
                    <button className="menu-item" onClick={() => { menuBus.emit('checkpoints:filter-week', { week: null }); closeMenu() }}>
                        <span className="menu-item-icon" /><span className="menu-item-label">All Checkpoints</span>
                    </button>
                    <div className="menu-separator" />
                    {CHECKPOINT_WEEKS.map(w => (
                        <button key={w} className="menu-item"
                            onClick={() => { menuBus.emit('checkpoints:filter-week', { week: w }); closeMenu() }}>
                            <span className="menu-item-icon" /><span className="menu-item-label">Week {w}</span>
                        </button>
                    ))}
                </MenuSubmenu>
                <MenuSeparator />
                <MenuItem icon={AlertTriangle} label="With Pastoral Concerns"
                    onClick={() => menuBus.emit('checkpoints:filter-pastoral')} closeMenu={closeMenu} />
                <MenuItem icon={Clock} label="Pending Review"
                    onClick={() => menuBus.emit('checkpoints:filter-pending')} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem label="Clear Filters"
                    onClick={() => menuBus.emit('checkpoints:clear-filters')} closeMenu={closeMenu} />
            </MenuTrigger>
        </>
    )
}
