import React from 'react'

export default function GlassCard({ children, className = '', onClick, style = {} }) {
  // Combine standard glass-card class with any custom classes
  return (
    <div 
      className={`glass-card ${className}`} 
      onClick={onClick} 
      style={{
        padding: '20px', // default padding, can be overridden via style prop
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </div>
  )
}
