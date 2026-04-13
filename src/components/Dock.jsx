import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import {
  LayoutDashboard, Users, GraduationCap, UsersRound,
  Calendar, FileText, BarChart3, Shield, Download,
  Wrench, Settings, Activity, Database
} from 'lucide-react'

// Same navigation structure as before, mapped to Lucide icons
const DOCK_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'linear-gradient(135deg, #FF9966, #FF5E62)' },
  { path: '/students', label: 'Students', icon: GraduationCap, color: 'linear-gradient(135deg, #56CCF2, #2F80ED)' },
  { path: '/admin', label: 'Users', icon: Users, color: 'linear-gradient(135deg, #11998e, #38ef7d)', roles: ['Admin', 'LeadershipTeam', 'Coordinator', 'TechSupport'] },
  { path: '/groups', label: 'Groups', icon: UsersRound, color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { path: '/attendance', label: 'Attendance', icon: Calendar, color: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { path: '/weekly-reports', label: 'Reports', icon: FileText, color: 'linear-gradient(135deg, #00b09b, #96c93d)' },
  { path: '/reports', label: 'Analytics', icon: BarChart3, color: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', roles: ['Admin', 'LeadershipTeam', 'Coordinator'] },
  { path: '/audit', label: 'Audit', icon: Shield, color: 'linear-gradient(135deg, #F2994A, #F2C94C)', roles: ['Admin', 'LeadershipTeam'] },
  { path: '/exports', label: 'Exports', icon: Download, color: 'linear-gradient(135deg, #fd79a8, #e84393)', roles: ['Admin', 'LeadershipTeam', 'Coordinator'] },
  { path: '/tech-support', label: 'Tech Support', icon: Wrench, color: 'linear-gradient(135deg, #0984e3, #6c5ce7)', roles: ['Admin', 'TechSupport'] },
  { path: '/admin/diagnostics', label: 'Diagnostics', icon: Activity, color: 'linear-gradient(135deg, #1f4037, #99f2c8)', roles: ['Admin', 'LeadershipTeam', 'TechSupport'] },
  { path: '/admin/notion', label: 'Notion', icon: Database, color: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', roles: ['Admin', 'TechSupport'] },
  { path: '/settings', label: 'Settings', icon: Settings, color: 'linear-gradient(135deg, #718096, #4a5568)' },
]

export default function Dock() {
  const location = useLocation()
  const navigate = useNavigate()
  const hasRole = useAuthStore(s => s.hasRole)

  // Filter based on user role assignments
  const visibleItems = DOCK_ITEMS.filter(item => {
    if (!item.roles) return true
    return item.roles.some(r => hasRole(r))
  })

  return (
    <div className="desktop-dock">
      {visibleItems.map(item => {
        const Icon = item.icon
        const isActive = location.pathname.startsWith(item.path)
        
        return (
          <div 
            key={item.path} 
            className={`dock-item ${isActive ? 'dock-item-active' : ''}`}
            onClick={() => navigate(item.path)}
            style={{ position: 'relative' }}
          >
            <div className="dock-icon" style={{ background: item.color }}>
              <Icon size={22} strokeWidth={2.5} />
            </div>
            <div className="dock-label">{item.label}</div>
            
            {/* Active Indication Dot */}
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.7)',
                boxShadow: '0 0 4px rgba(255,255,255,0.5)'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
