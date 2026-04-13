import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import api from '../lib/api'
import { Download, FileSpreadsheet, FileText, Users, Calendar } from 'lucide-react'

const EXPORT_OPTIONS = [
  { id: 'students', label: 'Student Roster', desc: 'All enrolled students with progress data', icon: Users, color: '#56CCF2', endpoint: '/api/exports/campus/roster' },
  { id: 'groups', label: 'Formation Groups', desc: 'All groups with facilitators and membership', icon: Users, color: '#667eea', endpoint: '/api/exports/campus/groups' },
  { id: 'attendance', label: 'Attendance Records', desc: 'Session attendance across all groups', icon: Calendar, color: '#f6d365', endpoint: '/api/exports/attendance' },
  { id: 'reports', label: 'Weekly Reports', desc: 'All submitted weekly reports', icon: FileText, color: '#00b09b', endpoint: '/api/exports/campus/weekly-reports' },
]

export default function Exports() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => { setPageTitle('Exports') }, [setPageTitle])

  const handleDownload = async (exp) => {
    setDownloading(exp.id)
    try {
      const res = await fetch(exp.endpoint, { credentials: 'include' })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exp.id}-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed: ' + err.message)
    } finally { setDownloading(null) }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📥 Data Exports</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Download program data as CSV files</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {EXPORT_OPTIONS.map(exp => {
          const Icon = exp.icon
          return (
            <div key={exp.id} style={{
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)', borderRadius: 16,
              padding: 24, transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${exp.color}, ${exp.color}cc)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Icon size={22} style={{ color: 'white' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{exp.label}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16, lineHeight: 1.4 }}>{exp.desc}</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownload(exp)}
                disabled={downloading === exp.id}
                style={{ width: '100%' }}
              >
                <Download size={14} />
                {downloading === exp.id ? 'Downloading…' : 'Download CSV'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
