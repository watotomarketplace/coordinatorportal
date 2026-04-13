import React from 'react'

export default function AttendanceRing({ percentage, size = 40 }) {
  const pct = Math.min(100, Math.max(0, percentage))
  const color = pct >= 80 ? '#34C759' : pct >= 60 ? '#FF9F0A' : '#FF453A'
  
  // Adjusted radius and dash for a slightly thicker look than the one in GroupDetail
  const r = 16
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
        {/* Background track */}
        <circle 
          cx="20" cy="20" r={r} 
          fill="none" 
          stroke="rgba(255,255,255,0.06)" 
          strokeWidth="3.5" 
        />
        {/* Progress ring */}
        <circle
          cx="20" cy="20" r={r} 
          fill="none"
          stroke={color} 
          strokeWidth="3.5" 
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.26, fontWeight: 700, color,
      }}>{pct}%</div>
    </div>
  )
}
