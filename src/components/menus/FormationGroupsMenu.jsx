import React from 'react'
import {
    Plus, Download, Building2, SlidersHorizontal, Users,
    UserCheck, AlertCircle, Edit, UserPlus, CalendarCheck, FileText, PowerOff,
} from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, CampusSubmenu } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'

export default function FormationGroupsMenu({ openMenu, handleMenuClick, closeMenu, selectedGroup, hasRole }) {
    const hasGroup = !!selectedGroup
    const canDeactivate = hasRole('Admin') || hasRole('Coordinator')

    return (
        <>
            <MenuTrigger id="groups-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Plus} label="New Group…" shortcut="⌘N"
                    onClick={() => menuBus.emit('groups:new')} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={Download} label="Export Groups (CSV)" shortcut="⌘E"
                    onClick={() => menuBus.emit('groups:export')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="groups-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <CampusSubmenu icon={Building2}
                    onSelect={campus => menuBus.emit('groups:filter-campus', { campus })}
                    closeMenu={closeMenu}
                />
                <MenuSeparator />
                <MenuItem icon={SlidersHorizontal} label="Active Groups Only"
                    onClick={() => menuBus.emit('groups:filter-active')} closeMenu={closeMenu} />
                <MenuItem icon={UserCheck} label="Needs Facilitator"
                    onClick={() => menuBus.emit('groups:filter-no-facilitator')} closeMenu={closeMenu} />
                <MenuItem icon={AlertCircle} label="Overdue Reports"
                    onClick={() => menuBus.emit('groups:filter-overdue')} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={SlidersHorizontal} label="Clear Filters" shortcut="⌘⇧F"
                    onClick={() => menuBus.emit('groups:clear-filters')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="groups-group" label="Group" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Edit} label="Edit Group…" disabled={!hasGroup}
                    onClick={() => menuBus.emit('groups:edit', { group: selectedGroup })} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={UserPlus} label="Assign Facilitator…" disabled={!hasGroup}
                    onClick={() => menuBus.emit('groups:assign-facilitator', { group: selectedGroup })} closeMenu={closeMenu} />
                <MenuItem icon={UserPlus} label="Assign Co-Facilitator…" disabled={!hasGroup}
                    onClick={() => menuBus.emit('groups:assign-co-facilitator', { group: selectedGroup })} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={Users} label="View Members" disabled={!hasGroup}
                    onClick={() => menuBus.emit('groups:view-members', { group: selectedGroup })} closeMenu={closeMenu} />
                <MenuItem icon={CalendarCheck} label="View Attendance" disabled={!hasGroup}
                    onClick={() => menuBus.emit('groups:view-attendance', { group: selectedGroup })} closeMenu={closeMenu} />
                <MenuItem icon={FileText} label="View Reports" disabled={!hasGroup}
                    onClick={() => menuBus.emit('groups:view-reports', { group: selectedGroup })} closeMenu={closeMenu} />
                {canDeactivate && (
                    <>
                        <MenuSeparator />
                        <MenuItem icon={PowerOff} label="Deactivate Group" danger disabled={!hasGroup}
                            onClick={() => menuBus.emit('groups:deactivate', { group: selectedGroup })} closeMenu={closeMenu} />
                    </>
                )}
            </MenuTrigger>
        </>
    )
}
