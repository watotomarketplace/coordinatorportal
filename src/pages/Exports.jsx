import React, { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../stores/appStore'
import menuBus from '../lib/menuBus.js'
import { Download, FileText, Users, Calendar, Loader2, AlertCircle, X } from 'lucide-react'

const EXPORT_OPTIONS = [
  { id: 'students', label: 'Student Roster', desc: 'All enrolled students with progress data', icon: Users, color: '#56CCF2', endpoint: '/api/exports/campus/roster' },
  { id: 'groups', label: 'Formation Groups', desc: 'All groups with facilitators and membership', icon: Users, color: '#667eea', endpoint: '/api/exports/campus/groups' },
  { id: 'attendance', label: 'Attendance Records', desc: 'Session attendance across all groups', icon: Calendar, color: '#f6d365', endpoint: '/api/exports/attendance' },
  { id: 'reports', label: 'Weekly Reports', desc: 'All submitted weekly reports', icon: FileText, color: '#00b09b', endpoint: '/api/exports/campus/weekly-reports' },
]

export default function Exports() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const [downloading, setDownloading] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => { setPageTitle('Exports') }, [setPageTitle])

  const handleDownloadRef = useRef(handleDownload)
  handleDownloadRef.current = handleDownload

  useEffect(() => {
    const unsubs = [
      menuBus.on('exports:roster',      () => handleDownloadRef.current(EXPORT_OPTIONS[0])),
      menuBus.on('exports:risk',        () => handleDownloadRef.current(EXPORT_OPTIONS[0])),
      menuBus.on('exports:weekly',      () => handleDownloadRef.current(EXPORT_OPTIONS[3])),
      menuBus.on('exports:formation',   () => handleDownloadRef.current(EXPORT_OPTIONS[1])),
      menuBus.on('exports:checkpoints', () => handleDownloadRef.current(EXPORT_OPTIONS[1])),
      menuBus.on('exports:attendance',  () => handleDownloadRef.current(EXPORT_OPTIONS[2])),
      menuBus.on('exports:all',         () => EXPORT_OPTIONS.forEach(exp => handleDownloadRef.current(exp))),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  async function handleDownload(exp) {
    setDownloading(exp.id)
    setErrors(prev => ({ ...prev, [exp.id]: null }))
    try {
      const res = await fetch(exp.endpoint, { credentials: 'include' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Download failed' }))
        const msg = res.status === 503
          ? 'Student data not yet loaded — please wait a moment and try again'
          : (data.message || `Export failed (${res.status})`)
        setErrors(prev => ({ ...prev, [exp.id]: msg }))
        return
      }
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
      setErrors(prev => ({ ...prev, [exp.id]: `Export failed: ${err.message}` }))
    } finally {
      setDownloading(null)
    }
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
          const isDownloading = downloading === exp.id
          const error = errors[exp.id]
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

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12,
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.3)',
                }}>
                  <AlertCircle size={14} style={{ color: '#FF453A', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: '#FF453A', flex: 1, lineHeight: 1.4 }}>{error}</span>
                  <button onClick={() => setErrors(prev => ({ ...prev, [exp.id]: null }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#FF453A' }}>
                    <X size={12} />
                  </button>
                </div>
              )}

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownload(exp)}
                disabled={isDownloading}
                style={{ width: '100%' }}
              >
                {isDownloading
                  ? <><Loader2 size={14} className="spin" /> Downloading…</>
                  : <><Download size={14} /> Download CSV</>
                }
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
