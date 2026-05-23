import React from 'react'
import {
    LayoutDashboard, GraduationCap, Layers, Users,
    CalendarCheck, FileText, BarChart2, Target, Download,
    Wrench, Activity, Settings,
} from 'lucide-react'
import { MenuTrigger, MenuItem, MenuSeparator, MenuSectionHeader } from './MenuPrimitive.jsx'

export default function WindowMenu({ openMenu, handleMenuClick, closeMenu, navigate, hasRole }) {
    return (
        <MenuTrigger id="window" label="Window" openMenu={openMenu} handleMenuClick={handleMenuClick}>
            <MenuSectionHeader label="Navigate" />
            <MenuItem icon={LayoutDashboard} label="Dashboard"
                onClick={() => navigate('/dashboard')} closeMenu={closeMenu} />
            <MenuItem icon={GraduationCap} label="Students"
                onClick={() => navigate('/students')} closeMenu={closeMenu} />
            <MenuItem icon={Layers} label="Formation Groups"
                onClick={() => navigate('/groups')} closeMenu={closeMenu} />
            <MenuItem icon={CalendarCheck} label="Attendance"
                onClick={() => navigate('/attendance')} closeMenu={closeMenu} />
            <MenuItem icon={FileText} label="Weekly Reports"
                onClick={() => navigate('/weekly-reports')} closeMenu={closeMenu} />
            <MenuSeparator />
            {(hasRole('Admin') || hasRole('LeadershipTeam') || hasRole('Coordinator') || hasRole('TechSupport')) && (
                <MenuItem icon={Users} label="User Management"
                    onClick={() => navigate('/admin')} closeMenu={closeMenu} />
            )}
            {(hasRole('Admin') || hasRole('LeadershipTeam') || hasRole('Coordinator')) && (
                <MenuItem icon={BarChart2} label="Analytics"
                    onClick={() => navigate('/reports')} closeMenu={closeMenu} />
            )}
            {(hasRole('Admin') || hasRole('LeadershipTeam') || hasRole('Coordinator') || hasRole('Pastor')) && (
                <MenuItem icon={Target} label="Checkpoints"
                    onClick={() => navigate('/checkpoints')} closeMenu={closeMenu} />
            )}
            {(hasRole('Admin') || hasRole('LeadershipTeam') || hasRole('Coordinator')) && (
                <MenuItem icon={Download} label="Exports"
                    onClick={() => navigate('/exports')} closeMenu={closeMenu} />
            )}
            {(hasRole('Admin') || hasRole('TechSupport')) && (
                <MenuItem icon={Wrench} label="Tech Support"
                    onClick={() => navigate('/tech-support')} closeMenu={closeMenu} />
            )}
            {(hasRole('Admin') || hasRole('LeadershipTeam') || hasRole('TechSupport')) && (
                <MenuItem icon={Activity} label="Diagnostics"
                    onClick={() => navigate('/admin/diagnostics')} closeMenu={closeMenu} />
            )}
            <MenuSeparator />
            <MenuItem icon={Settings} label="Settings"
                onClick={() => navigate('/settings')} closeMenu={closeMenu} />
        </MenuTrigger>
    )
}
