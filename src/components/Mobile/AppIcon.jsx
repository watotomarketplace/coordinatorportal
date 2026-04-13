import React from 'react'

export default function AppIcon({ icon: Icon, label, color, onClick }) {
  const handleTouch = () => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10) // Subtle haptic feedback
    }
  }

  return (
    <div className="ios-app-icon-container" onClick={onClick} onTouchStart={handleTouch}>
      <div className="ios-app-icon" style={{ background: color }}>
        <Icon size={32} strokeWidth={2} />
      </div>
      <div className="ios-app-label">{label}</div>
    </div>
  )
}
