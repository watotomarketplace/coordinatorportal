import React from 'react'
import {
    Download, RefreshCw, Shield, AlertTriangle, Activity,
    Building2, SlidersHorizontal, User, StickyNote, Tag, ExternalLink,
} from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, CampusSubmenu } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'
import api from '../../lib/api.js'

export default function StudentsMenu({ openMenu, handleMenuClick, closeMenu, selectedStudent }) {
    const hasStudent = !!selectedStudent

    const handleRefresh = async () => {
        closeMenu()
        try { await api.post('/api/thinkific/refresh') } catch (_) {}
    }

    return (
        <>
            <MenuTrigger id="students-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Download} label="Export Student Roster (CSV)" shortcut="⌘E"
                    onClick={() => menuBus.emit('students:export-roster')} closeMenu={closeMenu} />
                <MenuItem icon={Download} label="Export Risk Report (CSV)"
                    onClick={() => menuBus.emit('students:export-risk')} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={RefreshCw} label="Refresh Student Data" shortcut="⌘R"
                    onClick={handleRefresh} />
            </MenuTrigger>

            <MenuTrigger id="students-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Shield} label="Healthy"
                    onClick={() => menuBus.emit('students:filter-risk', { risk: 'Healthy' })} closeMenu={closeMenu} />
                <MenuItem icon={AlertTriangle} label="Attention"
                    onClick={() => menuBus.emit('students:filter-risk', { risk: 'Attention' })} closeMenu={closeMenu} />
                <MenuItem icon={Activity} label="Critical"
                    onClick={() => menuBus.emit('students:filter-risk', { risk: 'Critical' })} closeMenu={closeMenu} />
                <MenuSeparator />
                <CampusSubmenu icon={Building2}
                    onSelect={campus => menuBus.emit('students:filter-campus', { campus })}
                    closeMenu={closeMenu}
                />
                <MenuSeparator />
                <MenuItem icon={SlidersHorizontal} label="Clear All Filters" shortcut="⌘⇧F"
                    onClick={() => menuBus.emit('students:clear-filters')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="students-student" label="Student" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={User} label="View Profile" shortcut="⌘↓" disabled={!hasStudent}
                    onClick={() => menuBus.emit('students:view-profile', { student: selectedStudent })} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={StickyNote} label="Add Note" disabled={!hasStudent}
                    onClick={() => menuBus.emit('students:add-note', { student: selectedStudent })} closeMenu={closeMenu} />
                <MenuItem icon={Tag} label="Add Tag" disabled={!hasStudent}
                    onClick={() => menuBus.emit('students:add-tag', { student: selectedStudent })} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={ExternalLink} label="View in Thinkific" disabled={!hasStudent}
                    onClick={() => {
                        if (selectedStudent?.userId) {
                            window.open(`https://watoto.thinkific.com/admin/users/${selectedStudent.userId}`, '_blank')
                        }
                    }} closeMenu={closeMenu} />
            </MenuTrigger>
        </>
    )
}
