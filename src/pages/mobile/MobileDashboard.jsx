import React, { useState } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { Users, TrendingUp, CheckCircle, Activity } from 'lucide-react'

// iOS styled pull-to-refresh
function PullToRefresh({ onRefresh, children }) {
  const [{ y }, api] = useSpring(() => ({ y: 0 }))
  const [refreshing, setRefreshing] = useState(false)

  const bind = useDrag(({ down, movement: [_, my], cancel }) => {
    if (my < 0) cancel()
    
    // Check if we are at the top of the scroll container
    // A more robust implementation would check the actual scroll element,
    // but this suffices for the page-level demonstration.
    if (window.scrollY > 0) cancel()

    if (down) {
      api.start({ y: my > 120 ? 120 : my, immediate: true })
    } else {
      if (my > 80 && !refreshing) {
        setRefreshing(true)
        api.start({ y: 60 })
        onRefresh().then(() => {
          setRefreshing(false)
          api.start({ y: 0 })
        })
      } else {
        api.start({ y: 0 })
      }
    }
  }, { axis: 'y' })

  return (
    <animated.div {...bind()} style={{ y, touchAction: 'pan-y' }}>
      <div style={{
        position: 'absolute', top: -40, left: 0, right: 0,
        height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {refreshing ? <div className="spinner" /> : <span style={{ opacity: y.to(v => v/80) }}>Pull to refresh...</span>}
      </div>
      {children}
    </animated.div>
  )
}

function MobileCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(20px)',
      borderRadius: 24,
      padding: 20,
      minWidth: 140,
      scrollSnapAlign: 'start'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ color: color || 'white' }}><Icon size={24} /></div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{label}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

export default function MobileDashboard() {
  const [loading, setLoading] = useState(false)

  // Demo refresh handler
  const handleRefresh = async () => {
    return new Promise(resolve => setTimeout(resolve, 1500))
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="mobile-page-header">Overview</div>
      
      {/* Horizontal Scroll Area for KPIs */}
      <div style={{
        display: 'flex', gap: 16, overflowX: 'auto', 
        paddingBottom: 24, scrollSnapType: 'x mandatory',
        margin: '0 -24px', padding: '0 24px 24px'
      }}>
        <MobileCard label="Students" value="2,940" icon={Users} color="#0A84FF" />
        <MobileCard label="Active" value="2,800" icon={Activity} color="#30D158" />
        <MobileCard label="On Track" value="2,650" icon={CheckCircle} color="#FFD60A" />
        <MobileCard label="At Risk" value="150" icon={TrendingUp} color="#FF453A" />
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Recent Activity</h2>
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 24,
        padding: '8px 16px'
      }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            padding: '16px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Group WDT0{i} reported</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>2 hours ago</div>
            </div>
          </div>
        ))}
      </div>
    </PullToRefresh>
  )
}
