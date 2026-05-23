import React from 'react'
import { Download, Users, AlertTriangle, FileText, BookOpen, Target, CalendarCheck } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, MenuSectionHeader } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'

export default function ExportsMenu({ openMenu, handleMenuClick, closeMenu, hasRole }) {
    return (
        <MenuTrigger id="exports-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
            <MenuSectionHeader label="Campus Reports" />
            <MenuItem icon={Users} label="Participant Roster"
                onClick={() => menuBus.emit('exports:roster')} closeMenu={closeMenu} />
            <MenuItem icon={AlertTriangle} label="Risk Report"
                onClick={() => menuBus.emit('exports:risk')} closeMenu={closeMenu} />
            <MenuItem icon={FileText} label="Weekly Report Aggregation"
                onClick={() => menuBus.emit('exports:weekly')} closeMenu={closeMenu} />
            <MenuItem icon={BookOpen} label="Formation Evidence Summary"
                onClick={() => menuBus.emit('exports:formation')} closeMenu={closeMenu} />
            <MenuItem icon={Target} label="Checkpoint Summary"
                onClick={() => menuBus.emit('exports:checkpoints')} closeMenu={closeMenu} />
            <MenuSeparator />
            <MenuItem icon={CalendarCheck} label="Attendance Export"
                onClick={() => menuBus.emit('exports:attendance')} closeMenu={closeMenu} />
            {hasRole('Admin') && (
                <>
                    <MenuSeparator />
                    <MenuItem icon={Download} label="Download All"
                        onClick={() => menuBus.emit('exports:all')} closeMenu={closeMenu} />
                </>
            )}
        </MenuTrigger>
    )
}
