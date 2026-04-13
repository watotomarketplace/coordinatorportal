import React, { useEffect, useState } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useAuthStore } from '../../stores/authStore'
import { useAppStore } from '../../stores/appStore'
import { useNavigate } from 'react-router-dom'
import { Bell, Moon, RefreshCcw, Maximize, Settings, LogOut } from 'lucide-react'

export default function ControlCenter({ isOpen, onClose }) {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const theme = useAppStore(s => s.theme)
  const setTheme = useAppStore(s => s.setTheme)
  const navigate = useNavigate()

  const [time, setTime] = useState(new Date())

  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  // Slide down animation
  const springProps = useSpring({
    transform: isOpen ? 'translateY(0%)' : 'translateY(-100%)',
    config: { tension: 350, friction: 30 }
  })

  const handleLogout = async () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(20)
    await logout()
    onClose()
  }

  return (
    <animated.div 
      className="control-center-panel" 
      style={{
        ...springProps,
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
    >
      <div className="ios-clock-large" style={{ marginTop: 20 }}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="ios-date-large" style={{ marginBottom: 40 }}>
        {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>

      {/* User Card */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        padding: 16,
        borderRadius: 24,
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 20
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: 25, 
          background: 'var(--accent)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700
        }}>
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{user?.role}</div>
        </div>
      </div>

      {/* Grid of toggles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div 
          className={`control-center-tile ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Moon size={24} />
          <span style={{ fontWeight: 500 }}>Dark Mode</span>
        </div>
        <div className="control-center-tile" onClick={() => navigate('/notifications')}>
          <Bell size={24} />
          <span style={{ fontWeight: 500 }}>Alerts</span>
        </div>
        <div className="control-center-tile" onClick={() => window.location.reload()}>
          <RefreshCcw size={24} />
          <span style={{ fontWeight: 500 }}>Refresh</span>
        </div>
        <div className="control-center-tile" onClick={onClose}>
          <Maximize size={24} />
          <span style={{ fontWeight: 500 }}>Dismiss</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
         <div onClick={() => { onClose(); navigate('/settings') }} style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: 0.8, fontWeight: 500, fontSize: 18 }}>
           <Settings size={20}/> Settings
         </div>
         <div onClick={handleLogout} style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#ff453a', fontWeight: 600, fontSize: 18 }}>
           <LogOut size={20}/> Logout
         </div>
      </div>

    </animated.div>
  )
}
