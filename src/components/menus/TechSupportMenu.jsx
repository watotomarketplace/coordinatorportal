import React from 'react'
import { Search, Shield, KeyRound, Edit, Copy, FileText } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'

export default function TechSupportMenu({ openMenu, handleMenuClick, closeMenu, selectedUser, navigate }) {
    const hasUser = !!selectedUser

    const handleCopyId = () => {
        if (selectedUser?.userId || selectedUser?.id) {
            navigator.clipboard.writeText(String(selectedUser.userId || selectedUser.id))
        }
        closeMenu()
    }

    return (
        <>
            <MenuTrigger id="ts-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Search} label="Search Participant…" shortcut="⌘F"
                    onClick={() => menuBus.emit('tech-support:focus-search')} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={Shield} label="View Audit Log"
                    onClick={() => navigate('/audit')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="ts-actions" label="Actions" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={KeyRound} label="Reset Password…" disabled={!hasUser}
                    onClick={() => menuBus.emit('tech-support:reset-password', { user: selectedUser })} closeMenu={closeMenu} />
                <MenuItem icon={Edit} label="Update Name…" disabled={!hasUser}
                    onClick={() => menuBus.emit('tech-support:update-name', { user: selectedUser })} closeMenu={closeMenu} />
                <MenuSeparator />
                <MenuItem icon={Copy} label="Copy Thinkific ID" disabled={!hasUser}
                    onClick={handleCopyId} />
                <MenuSeparator />
                <MenuItem icon={FileText} label="View Full Report" disabled={!hasUser}
                    onClick={() => menuBus.emit('tech-support:view-report', { user: selectedUser })} closeMenu={closeMenu} />
            </MenuTrigger>
        </>
    )
}
