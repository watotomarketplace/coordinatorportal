import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function WindowControls({ title }) {
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  const handleClose = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout()
      navigate('/login', { replace: true })
    }
  }

  const handleMinimize = () => {
    // We could dispatch a window minimize event to a store.
    // For now, it's a visual no-op or trivial console log.
    console.log("Minimize window triggered")
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.02)', // slight tint for titlebar
    }}>
      {/* Traffic Lights */}
      <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
        {/* Close (Red) */}
        <div 
          onClick={handleClose}
          title="Logout"
          style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#ff5f56', border: '1px solid #e0443e',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {/* SVG hover icon could go here */}
        </div>
        
        {/* Minimize (Yellow) */}
        <div 
          onClick={handleMinimize}
          title="Minimize"
          style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#ffbd2e', border: '1px solid #dea123',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        ></div>
        
        {/* Fullscreen (Green) */}
        <div 
          onClick={handleFullscreen}
          title="Fullscreen"
          style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#27c93f', border: '1px solid #1aab29',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        ></div>
      </div>
      
      {/* Centered Title */}
      <div style={{
        flex: 1, 
        textAlign: 'center', 
        fontSize: '13px', 
        fontWeight: '600', 
        color: 'var(--text-secondary)',
        userSelect: 'none',
        marginLeft: '-44px' // Offset the width of traffic lights to keep text perfectly centered
      }}>
        {title || 'WL101 Coordinator Portal'}
      </div>
    </div>
  )
}
