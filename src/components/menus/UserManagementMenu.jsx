import React from 'react'
import {
    Plus, Upload, Download, Shield, User, UserCheck,
    Users, Wrench, Building2, Edit, KeyRound, ToggleLeft, Layers,
} from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, MenuSectionHeader, CampusSubmenu } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'

export default function UserManagementMenu({ openMenu, handleMenuClick, closeMenu, selectedUser, hasRole }) {
    const hasUser = !!selectedUser

    return (
        <>
            <MenuTrigger id="users-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Plus} label="New User…" shortcut="⌘N"
                    onClick={() => menuBus.emit('users:new')} closeMenu={closeMenu} />
                <MenuSeparator />
                {hasRole('Admin') && (
                    <MenuItem icon={Upload} label="Import Users (CSV)"
                        onClick={() => menuBus.emit('users:import')} closeMenu={closeMenu} />
                )}
                <MenuItem icon={Download} label="Export User List (CSV)" shortcut="⌘E"
                    onClick={() => menuBus.emit('users:export')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="users-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuSectionHeader label="Filter by Role" />
                <MenuItem label="All Roles"
                    onClick={() => menuBus.emit('users:filter-role', { role: null })} closeMenu={closeMenu} />
                {hasRole('Admin') && (
                    <MenuItem icon={Shield} label="Admin"
                        onClick={() => menuBus.emit('users:filter-role', { role: 'Admin' })} closeMenu={closeMenu} />
                )}
                <MenuItem icon={User} label="Coordinator"
                    onClick={() => menuBus.emit('users:filter-role', { role: 'Coordinator' })} closeMenu={closeMenu} />
                <MenuItem icon={UserCheck} label="Pastor"
                    onClick={() => menuBus.emit('users:filter-role', { role: 'Pastor' })} closeMenu={closeMenu} />
                <MenuItem icon={Users} label="Facilitator"
                    onClick={() => menuBus.emit('users:filter-role', { role: 'Facilitator' })} closeMenu={closeMenu} />
                <MenuItem icon={Users} label="CoFacilitator"
                    onClick={() => menuBus.emit('users:filter-role', { role: 'CoFacilitator' })} closeMenu={closeMenu} />
                <MenuItem icon={Wrench} label="TechSupport"
                    onClick={() => menuBus.emit('users:filter-role', { role: 'TechSupport' })} closeMenu={closeMenu} />
                {hasRole('Admin') && (
                    <MenuItem icon={Shield} label="LeadershipTeam"
                        onClick={() => menuBus.emit('users:filter-role', { role: 'LeadershipTeam' })} closeMenu={closeMenu} />
                )}
                <MenuSeparator />
                <CampusSubmenu icon={Building2}
                    onSelect={campus => menuBus.emit('users:filter-campus', { campus })}
                    closeMenu={closeMenu}
                />
            </MenuTrigger>

            <MenuTrigger id="users-user" label="User" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Edit} label="Edit User…" disabled={!hasUser}
                    onClick={() => menuBus.emit('users:edit', { user: selectedUser })} closeMenu={closeMenu} />
                {(hasRole('Admin') || hasRole('TechSupport')) && (
                    <MenuItem icon={KeyRound} label="Reset Password…" disabled={!hasUser}
                        onClick={() => menuBus.emit('users:reset-password', { user: selectedUser })} closeMenu={closeMenu} />
                )}
                <MenuSeparator />
                {hasRole('Admin') && (
                    <MenuItem icon={ToggleLeft} label="Deactivate / Activate" disabled={!hasUser}
                        onClick={() => menuBus.emit('users:toggle-active', { user: selectedUser })} closeMenu={closeMenu} />
                )}
                <MenuSeparator />
                <MenuItem icon={Layers} label="View Assigned Groups" disabled={!hasUser}
                    onClick={() => menuBus.emit('users:view-groups', { user: selectedUser })} closeMenu={closeMenu} />
            </MenuTrigger>
        </>
    )
}
