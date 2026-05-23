import React from 'react'
import { Download, Plus, Building2, CalendarCheck, AlertCircle, Users, Edit, XCircle } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, CampusSubmenu } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'

export default function AttendanceMenu({ openMenu, handleMenuClick, closeMenu, selectedSession, hasRole }) {
    const hasSession = !!selectedSession
    const canEdit = hasRole('Admin') || hasRole('Coordinator')

    return (
        <>
            <MenuTrigger id="att-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Download} label="Export Attendance (CSV)" shortcut="⌘E"
                    onClick={() => menuBus.emit('attendance:export')} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={Plus} label="New Session…" shortcut="⌘N"
                    onClick={() => menuBus.emit('attendance:new-session')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="att-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <CampusSubmenu icon={Building2}
                    onSelect={campus => menuBus.emit('attendance:filter-campus', { campus })}
                    closeMenu={closeMenu}
                />
                <MenuSeparator />
                <MenuItem icon={CalendarCheck} label="All Groups"
                    onClick={() => menuBus.emit('attendance:filter', { filter: 'all' })} closeMenu={closeMenu} />
                <MenuItem icon={CalendarCheck} label="With Recorded Sessions"
                    onClick={() => menuBus.emit('attendance:filter', { filter: 'has-sessions' })} closeMenu={closeMenu} />
                <MenuItem icon={AlertCircle} label="No Sessions Yet"
                    onClick={() => menuBus.emit('attendance:filter', { filter: 'no-sessions' })} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="att-session" label="Session" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={CalendarCheck} label="Start Check-In…" disabled={!hasSession}
                    onClick={() => menuBus.emit('attendance:checkin', { session: selectedSession })} closeMenu={closeMenu} />
                {canEdit && (
                    <MenuItem icon={Edit} label="Edit Session…" disabled={!hasSession}
                        onClick={() => menuBus.emit('attendance:edit-session', { session: selectedSession })} closeMenu={closeMenu} />
                )}
                <MenuSeparator />
                <MenuItem icon={Users} label="View Member Roster" disabled={!hasSession}
                    onClick={() => menuBus.emit('attendance:view-members', { session: selectedSession })} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={XCircle} label="Mark Group Did Not Meet" danger disabled={!hasSession}
                    onClick={() => menuBus.emit('attendance:did-not-meet', { session: selectedSession })} closeMenu={closeMenu} />
            </MenuTrigger>
        </>
    )
}
