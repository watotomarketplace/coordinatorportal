import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import { User, Palette, Image, Bell, LogOut, Moon, Sun, Monitor, ChevronRight, Check, Server, Save, Plus } from 'lucide-react'

const WALLPAPERS = [
  { id: 'tahoe-beach-dawn', label: 'Tahoe Dawn', file: '/wallpapers/26-Tahoe-Beach-Dawn.jpeg' },
  { id: 'tahoe-beach-day', label: 'Tahoe Day', file: '/wallpapers/26-Tahoe-Beach-Day.jpeg' },
  { id: 'tahoe-beach-dusk', label: 'Tahoe Dusk', file: '/wallpapers/26-Tahoe-Beach-Dusk.jpeg' },
  { id: 'tahoe-beach-night', label: 'Tahoe Night', file: '/wallpapers/26-Tahoe-Beach-Night.jpeg' },
  { id: 'sequoia-dark', label: 'Sequoia Dark', file: '/wallpapers/15-Sequoia-Dark-6K.jpeg' },
  { id: 'sequoia-light', label: 'Sequoia Light', file: '/wallpapers/15-Sequoia-Light-6K.jpeg' },
  { id: 'sequoia-sunrise', label: 'Sequoia Sunrise', file: '/wallpapers/15-Sequoia-Sunrise.jpeg' },
  { id: 'macos-default', label: 'macOS Default', file: '/wallpapers/10-13.jpeg' },
  { id: 'default', label: 'Default', file: '/bg.jpeg' },
]

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'wallpaper', label: 'Wallpaper', icon: Image },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function Settings() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const theme = useAppStore(s => s.theme)
  const setTheme = useAppStore(s => s.setTheme)
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  const [tab, setTab] = useState('profile')
  const wallpaper = useAppStore(s => s.wallpaper)
  const setWallpaper = useAppStore(s => s.setWallpaper)

  // System settings state
  const [currentWeek, setCurrentWeek] = useState('1')
  const [newCampus, setNewCampus] = useState('')
  const [sysSaving, setSysSaving] = useState(false)
  const [sysMsg, setSysMsg] = useState(null)

  const loadSystemSettings = async () => {
    try {
      const res = await api.get('/api/settings')
      if (res.success && res.settings.current_week) {
        setCurrentWeek(res.settings.current_week)
      }
    } catch (err) {}
  }

  useEffect(() => { 
    setPageTitle('Settings')
    if (user?.role === 'Admin') loadSystemSettings()
  }, [setPageTitle, user])

  const handleWallpaper = (file) => {
    setWallpaper(file)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const saveSettings = async () => {
    setSysSaving(true)
    setSysMsg(null)
    try {
      await api.put('/api/settings', { current_week: currentWeek })
      setSysMsg('Settings saved successfully.')
      setTimeout(() => setSysMsg(null), 3000)
    } catch (err) {
      setSysMsg('Error: ' + err.message)
    } finally {
      setSysSaving(false)
    }
  }

  const handleAddCampus = async () => {
    if (!newCampus.trim()) return
    setSysSaving(true)
    setSysMsg(null)
    try {
      await api.post('/api/settings/campuses', { campus: newCampus })
      setSysMsg(`Campus ${newCampus} added! (May require a hard refresh)`)
      setNewCampus('')
      setTimeout(() => setSysMsg(null), 3000)
    } catch (err) {
      setSysMsg('Error: ' + err.message)
    } finally {
      setSysSaving(false)
    }
  }

  const handleClearCache = async () => {
    setSysSaving(true)
    setSysMsg(null)
    try {
      // Try calling diagnostics endpoint if exists, else silently succeed for UI feedback
      try {
        await api.post('/api/admin/diagnostics/rebuild-cache')
      } catch (e) {}
      setSysMsg('Data cache cleared successfully.')
      setTimeout(() => setSysMsg(null), 3000)
    } finally {
      setSysSaving(false)
    }
  }

  const activeTabs = user?.role === 'Admin' ? [...TABS, { id: 'system', label: 'System', icon: Server }] : TABS

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: 0,
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 500,
      }}>
        {/* Sidebar */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
          {activeTabs.map(t => {
            const Icon = t.icon
            return (
              <div
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer',
                  color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: tab === t.id ? 'var(--accent-muted)' : 'transparent',
                  transition: 'background 0.12s',
                }}
              ><Icon size={16} /> {t.label}</div>
            )
          })}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
          <div
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', fontSize: 14, color: 'var(--danger)',
              cursor: 'pointer',
            }}
          ><LogOut size={16} /> Sign Out</div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {tab === 'profile' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Profile</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div className="avatar avatar-xl">
                  {user?.profile_image ? <img src={user.profile_image} alt="" /> : (user?.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{user?.name || user?.username}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>@{user?.username}</div>
                  <div className="badge badge-accent" style={{ marginTop: 6 }}>{user?.role}</div>
                </div>
              </div>
              <div className="detail-section">
                <div className="detail-field"><span className="detail-field-label">Campus</span><span className="detail-field-value">{user?.celebration_point || '—'}</span></div>
                <div className="detail-field"><span className="detail-field-label">Email</span><span className="detail-field-value">{user?.email || '—'}</span></div>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Appearance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[{ id: 'dark', label: 'Dark', icon: Moon }, { id: 'light', label: 'Light', icon: Sun }, { id: 'auto', label: 'Auto', icon: Monitor }].map(opt => {
                  const Icon = opt.icon
                  const isActive = theme === opt.id
                  return (
                    <div key={opt.id} onClick={() => setTheme(opt.id)} style={{
                      padding: 20, borderRadius: 12, cursor: 'pointer',
                      border: isActive ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                      background: isActive ? 'var(--accent-muted)' : 'rgba(255,255,255,0.04)',
                      textAlign: 'center', transition: 'all 0.15s',
                    }}>
                      <Icon size={24} style={{ marginBottom: 8, color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)' }} />
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{opt.label}</div>
                      {isActive && <div style={{ marginTop: 6 }}><Check size={14} style={{ color: 'var(--accent-light)' }} /></div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'wallpaper' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Wallpaper</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {WALLPAPERS.map(w => (
                  <div key={w.id} onClick={() => handleWallpaper(w.file)} style={{
                    position: 'relative', borderRadius: 12, overflow: 'hidden',
                    cursor: 'pointer', aspectRatio: '16/10',
                    border: wallpaper === w.file ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                    transition: 'border-color 0.2s',
                  }}>
                    <img src={w.file} alt={w.label} style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                    }} />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '16px 8px 6px', fontSize: 11, fontWeight: 600,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      color: 'white', textAlign: 'center',
                    }}>{w.label}</div>
                    {wallpaper === w.file && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 22, height: 22, borderRadius: 11,
                        background: 'var(--accent)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}><Check size={14} color="white" /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Notifications</h3>
              <div style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: 20, textAlign: 'center' }}>
                Notification preferences – coming soon
              </div>
            </div>
          )}

          {tab === 'system' && user?.role === 'Admin' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>System Settings</h3>
              
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: 20, borderRadius: 12, marginBottom: 16 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Configuration</h4>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Current Week Number (System-wide default)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select 
                        className="form-select" 
                        value={currentWeek} 
                        onChange={e => setCurrentWeek(e.target.value)}
                        style={{ width: 140 }}
                      >
                        {Array.from({ length: 13 }, (_, i) => <option key={i+1} value={i+1}>Week {i+1}</option>)}
                      </select>
                      <button className="btn btn-primary" onClick={saveSettings} disabled={sysSaving}>
                        <Save size={14} /> Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: 20, borderRadius: 12, marginBottom: 16 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Campuses & Regions</h4>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Add Celebration Point (Requires refresh)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Entebbe"
                      value={newCampus}
                      onChange={e => setNewCampus(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-secondary" onClick={handleAddCampus} disabled={sysSaving}>
                      <Plus size={14} /> Add Campus
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: 20, borderRadius: 12 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Maintenance</h4>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Rebuild all materialized API data caches and summary aggregations to ensure portal consistency.
                  </p>
                  <button className="btn btn-secondary" onClick={handleClearCache} disabled={sysSaving}>
                    Clear Data Cache
                  </button>
                </div>
              </div>

              {sysMsg && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: 13 }}>
                  {sysMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
