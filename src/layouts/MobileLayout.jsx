import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import ControlCenter from '../components/Mobile/ControlCenter'
import AppIcon from '../components/Mobile/AppIcon'
import {
  LayoutDashboard, Users, GraduationCap, UsersRound,
  Calendar, FileText, BarChart3, Shield, Download,
  Wrench, Settings
} from 'lucide-react'

// App Grid definitions
export const MOBILE_APPS = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard, color: 'linear-gradient(135deg, #FF9966, #FF5E62)' },
  { path: '/students', label: 'Students', icon: GraduationCap, color: 'linear-gradient(135deg, #56CCF2, #2F80ED)' },
  { path: '/admin', label: 'Users', icon: Users, color: 'linear-gradient(135deg, #11998e, #38ef7d)', roles: ['Admin', 'TechSupport'] },
  { path: '/groups', label: 'Groups', icon: UsersRound, color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { path: '/attendance', label: 'Attendance', icon: Calendar, color: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { path: '/weekly-reports', label: 'Reports', icon: FileText, color: 'linear-gradient(135deg, #00b09b, #96c93d)' },
  { path: '/reports', label: 'Analytics', icon: BarChart3, color: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', roles: ['Admin', 'LeadershipTeam', 'Pastor'] },
  { path: '/checkpoints', label: 'Checkpoints', icon: LayoutDashboard, color: 'linear-gradient(135deg, #e17055, #d63031)' },
  { path: '/audit', label: 'Audit', icon: Shield, color: 'linear-gradient(135deg, #F2994A, #F2C94C)', roles: ['Admin', 'LeadershipTeam'] },
  { path: '/exports', label: 'Exports', icon: Download, color: 'linear-gradient(135deg, #fd79a8, #e84393)' },
  { path: '/tech-support', label: 'Tech', icon: Wrench, color: 'linear-gradient(135deg, #0984e3, #6c5ce7)', roles: ['Admin', 'TechSupport'] },
  { path: '/settings', label: 'Settings', icon: Settings, color: 'linear-gradient(135deg, #718096, #4a5568)', roles: ['Admin'] },
]

export default function MobileLayout({ children }) {
  const user = useAuthStore(s => s.user)
  const hasRole = useAuthStore(s => s.hasRole)
  const location = useLocation()
  const navigate = useNavigate()

  const [ccOpen, setCcOpen] = useState(false)
  const [time, setTime] = useState(new Date())

  // Swipe-down detection for Control Center (Native JS approach as requested alternative)
  useEffect(() => {
    let startY = 0
    let startX = 0
    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY
      startX = e.touches[0].clientX
    }
    const handleTouchEnd = (e) => {
      const deltaY = e.changedTouches[0].clientY - startY
      const deltaX = Math.abs(e.changedTouches[0].clientX - startX)
      // Top 40px, mostly vertical, swipe down > 50px
      if (startY < 40 && deltaY > 50 && deltaX < 50) {
        setCcOpen(true)
      }
      
      // Bottom 40px swipe up to go home
      if (startY > window.innerHeight - 40 && deltaY < -80 && deltaX < 50) {
        navigate('/dashboard')
      }
    }
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [navigate])

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Filter apps
  const visibleApps = MOBILE_APPS.filter(app => {
    if (!app.roles) return true
    return app.roles.some(r => hasRole(r))
  })

  // State checks
  const isLogin = location.pathname === '/login'

  // If we are on Dashboard AND logged in, we render the App Grid over the content
  // Actually, MobileDashboard will handle its own content if needed, but the prompt
  // specifies the Home Screen is the App Grid. We will render it if location is EXACTLY /dashboard
  const isHome = location.pathname === '/dashboard'

  // Render Lock Screen if not logged in (and on /login)
  if (!user || isLogin) {
    return (
      <div className="mobile-layout" style={{ backgroundImage: 'url(/bg.jpeg)' }}>
        <div className="ios-lock-screen">
          <div className="ios-clock-large">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="ios-date-large">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="lock-screen-form">
            {/* The actual login form handles auth */}
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-layout" style={{ backgroundImage: 'url(/bg.jpeg)', backgroundSize: 'cover' }}>
      
      {/* Home Screen App Grid Overlay */}
      {isHome && (
        <div className="ios-home-screen">
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <h1 style={{ color: 'white', fontSize: 32, fontWeight: 700 }}>Hey, {user.name?.split(' ')[0]}</h1>
          </div>
          <div className="ios-app-grid">
            {visibleApps.map(app => (
              <AppIcon 
                key={app.path} 
                icon={app.icon} 
                label={app.label} 
                color={app.color} 
                onClick={() => navigate(app.path)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Pages Content Container (Behind home grid if active) */}
      {!isHome && (
        <div className="mobile-page-content" style={{ background: 'var(--bg-app)' }}>
          {children}
        </div>
      )}

      {/* Bottom Tab Bar (Visible on all inner pages except Home) */}
      {!isHome && (
        <div className="ios-tab-bar">
          <TabItem path="/dashboard" icon={LayoutDashboard} label="Home" />
          <TabItem path="/groups" icon={UsersRound} label="Groups" />
          <TabItem path="/weekly-reports" icon={FileText} label="Reports" />
          <TabItem path="/settings" icon={Settings} label="Settings" />
        </div>
      )}

      {/* Control Center Panel */}
      <ControlCenter isOpen={ccOpen} onClose={() => setCcOpen(false)} />
      
      {/* Home Indicator (Visual only) */}
      <div style={{
        position: 'fixed',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 134,
        height: 5,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.8)',
        zIndex: 200
      }} />
    </div>
  )
}

function TabItem({ path, icon: Icon, label }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname.startsWith(path)

  return (
    <div 
      className={`ios-tab-item ${isActive ? 'active' : ''}`} 
      onClick={() => navigate(path)}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
    </div>
  )
}
