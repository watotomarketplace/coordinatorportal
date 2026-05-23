import React from 'react'
import { Cloud, Download, Building2, Hash, Layers, AlertTriangle, Clock, Eye, Flag } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, MenuSubmenu, CampusSubmenu } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'
import api from '../../lib/api.js'

const WEEKS = Array.from({ length: 13 }, (_, i) => i + 1)

export default function WeeklyReportsMenu({ openMenu, handleMenuClick, closeMenu, selectedReport, hasRole }) {
    const hasReport = !!selectedReport
    const canFlag = hasRole('Admin') || hasRole('Coordinator') || hasRole('Pastor')

    const handleSync = async () => {
        closeMenu()
        try { await api.post('/api/notion/sync') } catch (_) {}
    }

    return (
        <>
            <MenuTrigger id="reports-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Cloud} label="Sync from Notion Now" shortcut="⌘R"
                    onClick={handleSync} />
                <MenuSeparator />
                <MenuItem icon={Download} label="Export Reports (CSV)" shortcut="⌘E"
                    onClick={() => menuBus.emit('weekly-reports:export')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="reports-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <CampusSubmenu icon={Building2}
                    onSelect={campus => menuBus.emit('weekly-reports:filter-campus', { campus })}
                    closeMenu={closeMenu}
                />
                <MenuSubmenu icon={Hash} label="Filter by Week">
                    <button className="menu-item" onClick={() => { menuBus.emit('weekly-reports:filter-week', { week: null }); closeMenu() }}>
                        <span className="menu-item-icon" /><span className="menu-item-label">All Weeks</span>
                    </button>
                    <div className="menu-separator" />
                    {WEEKS.map(w => (
                        <button key={w} className="menu-item"
                            onClick={() => { menuBus.emit('weekly-reports:filter-week', { week: w }); closeMenu() }}>
                            <span className="menu-item-icon" /><span className="menu-item-label">Week {w}</span>
                        </button>
                    ))}
                </MenuSubmenu>
                <MenuItem icon={Layers} label="Filter by Group"
                    onClick={() => menuBus.emit('weekly-reports:filter-group')} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={AlertTriangle} label="With Pastoral Concerns Only"
                    onClick={() => menuBus.emit('weekly-reports:filter-pastoral')} closeMenu={closeMenu} />
                <MenuItem icon={Clock} label="Overdue Groups Only"
                    onClick={() => menuBus.emit('weekly-reports:filter-overdue')} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem label="Clear All Filters" shortcut="⌘⇧F"
                    onClick={() => menuBus.emit('weekly-reports:clear-filters')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="reports-report" label="Report" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Eye} label="View Full Report" disabled={!hasReport}
                    onClick={() => menuBus.emit('weekly-reports:view', { report: selectedReport })} closeMenu={closeMenu} />
                <MenuSeparator />
                {canFlag && (
                    <MenuItem icon={Flag} label="Flag Pastoral Concern" disabled={!hasReport}
                        onClick={() => menuBus.emit('weekly-reports:flag-pastoral', { report: selectedReport })} closeMenu={closeMenu} />
                )}
                <MenuItem icon={Flag} label="Mark as Reviewed" disabled={!hasReport}
                    onClick={() => menuBus.emit('weekly-reports:mark-reviewed', { report: selectedReport })} closeMenu={closeMenu} />
            </MenuTrigger>
        </>
    )
}
