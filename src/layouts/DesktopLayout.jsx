import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import WindowControls from '../components/WindowControls'
import MenuBar from '../components/MenuBar'
import Dock from '../components/Dock'
import { useDraggableWindow } from '../hooks/useDraggableWindow.js'

export default function DesktopLayout({ children }) {
  const user = useAuthStore(s => s.user)
  const pageTitle = useAppStore(s => s.pageTitle)
  const platform = useAppStore(s => s.platform)

  const [windowVisible, setWindowVisible] = useState(true)
  const { windowRef, onTitleMouseDown, onTitleDoubleClick } = useDraggableWindow()

  return (
    <div className="desktop-wrapper">
      {/* macOS-style menu bar — fixed at top of viewport, outside window */}
      {platform !== 'mobile' && <MenuBar />}

      {windowVisible && (
        <div ref={windowRef} className="desktop-window">
          {/* Traffic Lights and Title Bar */}
          <WindowControls
            title={`${pageTitle} — WL101 Portal`}
            onTitleMouseDown={onTitleMouseDown}
            onTitleDoubleClick={onTitleDoubleClick}
          />
          
          {/* Main scrollable body */}
          <div className="desktop-window-content">
            {/* Header info (Optional inside window) */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{pageTitle}</h1>
              
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '4px 12px 4px 4px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '20px',
              }}>
                <div className="avatar avatar-sm">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} />
                  ) : (
                    (user?.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  {user?.name || user?.username}
                </span>
              </div>
            </div>

            {/* Dynamic Routed Content */}
            {children}
          </div>
        </div>
      )}

      {/* Floating App Dock */}
      <Dock />
    </div>
  )
}
