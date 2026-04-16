import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import api from '../lib/api'
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react'
import {
  Chart as ChartJS,
  ArcElement, CategoryScale, LinearScale, BarElement,
  Tooltip, Legend, PointElement, LineElement, Filler,
  BarController, LineController, DoughnutController,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement, Filler, BarController, LineController, DoughnutController)

export default function Analytics() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { setPageTitle('Analytics') }, [setPageTitle])

  useEffect(() => {
    async function load() {
      try {
        const dashData = await api.get('/api/formation-dashboard')
        setData(dashData)
      } catch { /* ok */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: 24 }}>{[0,1,2].map(i => <div key={i} className="skeleton skeleton-row" style={{ height: 200 }} />)}</div>

  const summary = data?.summary || {}
  const groups = data?.groups || []

  // Campus distribution
  const campusCounts = {}
  groups.forEach(g => {
    const cp = g.celebration_point || 'Unknown'
    campusCounts[cp] = (campusCounts[cp] || 0) + 1
  })

  const campusData = {
    labels: Object.keys(campusCounts).slice(0, 10),
    datasets: [{
      label: 'Groups',
      data: Object.values(campusCounts).slice(0, 10),
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 4,
    }],
  }

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(20,20,32,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)' } },
    },
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📊 Analytics</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Program-wide insights and reports</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Groups', value: summary.totalGroups || groups.length, icon: Users },
          { label: 'Active Students', value: summary.activeStudents || 0, icon: TrendingUp },
          { label: 'Sessions Recorded', value: summary.totalSessions || 0, icon: Calendar },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} style={{
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{(stat.value || 0).toLocaleString()}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Groups by Campus</h3>
          <div style={{ height: 300 }}>
            <Bar data={campusData} options={chartOpts} />
          </div>
        </div>
      </div>
    </div>
  )
}
