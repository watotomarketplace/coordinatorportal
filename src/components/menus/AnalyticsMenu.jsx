import React from 'react'
import { Download, Building2, BarChart2, TrendingUp, Shield, GraduationCap, Clock } from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, MenuSectionHeader, CampusSubmenu } from './MenuPrimitive.jsx'
import menuBus from '../../lib/menuBus.js'

export default function AnalyticsMenu({ openMenu, handleMenuClick, closeMenu }) {
    return (
        <>
            <MenuTrigger id="analytics-file" label="File" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuItem icon={Download} label="Export Analytics (CSV)" shortcut="⌘E"
                    onClick={() => menuBus.emit('analytics:export')} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="analytics-view" label="View" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <CampusSubmenu icon={Building2}
                    onSelect={campus => menuBus.emit('analytics:filter-campus', { campus })}
                    closeMenu={closeMenu}
                />
                <MenuSeparator />
                <MenuItem icon={TrendingUp} label="Engagement Trend"
                    onClick={() => menuBus.emit('analytics:scroll', { section: 'engagement' })} closeMenu={closeMenu} />
                <MenuItem icon={BarChart2} label="Reporting Compliance"
                    onClick={() => menuBus.emit('analytics:scroll', { section: 'compliance' })} closeMenu={closeMenu} />
                <MenuItem icon={Shield} label="Risk Distribution"
                    onClick={() => menuBus.emit('analytics:scroll', { section: 'risk' })} closeMenu={closeMenu} />
                <MenuItem icon={GraduationCap} label="Student Progress"
                    onClick={() => menuBus.emit('analytics:scroll', { section: 'progress' })} closeMenu={closeMenu} />
            </MenuTrigger>

            <MenuTrigger id="analytics-time" label="Time Range" openMenu={openMenu} handleMenuClick={handleMenuClick}>
                <MenuSectionHeader label="Filter Period" />
                <MenuItem icon={Clock} label="This Week"
                    onClick={() => menuBus.emit('analytics:time-range', { range: 'this-week' })} closeMenu={closeMenu} />
                <MenuItem icon={Clock} label="Last 4 Weeks"
                    onClick={() => menuBus.emit('analytics:time-range', { range: '4-weeks' })} closeMenu={closeMenu} />
                <MenuItem icon={Clock} label="Full Cohort (Weeks 1–13)"
                    onClick={() => menuBus.emit('analytics:time-range', { range: 'full' })} closeMenu={closeMenu} />
            </MenuTrigger>
        </>
    )
}
