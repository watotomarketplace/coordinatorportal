import React from 'react'
import { Save, User, Bell, Cloud, Wifi, Monitor } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'

export default function SettingsMenu({ openMenu, handleMenuClick, closeMenu, hasRole }) {
    return (
        <>
            <MenuTrigger id="settings-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Save} label="Save Changes" shortcut="⌘S"
                    onClick={() => menuBus.emit('settings:save')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="settings-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={User} label="General"
                    onClick={() => menuBus.emit('settings:tab', { tab: 'general' })} closeMenu={closeMenu} />
                <MenuItem icon={Bell} label="Notifications"
                    onClick={() => menuBus.emit('settings:tab', { tab: 'notifications' })} closeMenu={closeMenu} />
                {hasRole('Admin') && (
                    <>
                        <MenuItem icon={Cloud} label="Notion Integration"
                            onClick={() => menuBus.emit('settings:tab', { tab: 'notion' })} closeMenu={closeMenu} />
                        <MenuItem icon={Wifi} label="Thinkific Integration"
                            onClick={() => menuBus.emit('settings:tab', { tab: 'thinkific' })} closeMenu={closeMenu} />
                    </>
                )}
                <MenuItem icon={Monitor} label="Appearance"
                    onClick={() => menuBus.emit('settings:tab', { tab: 'appearance' })} closeMenu={closeMenu} />
            </MenuTrigger>
        </>
    )
}
