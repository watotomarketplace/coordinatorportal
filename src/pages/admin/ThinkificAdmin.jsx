import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useAppStore } from '../../stores/appStore'
import api from '../../lib/api'
import { Save, RefreshCw, Key, Globe, CheckCircle, AlertTriangle, Link as LinkIcon, Server } from 'lucide-react'

export default function ThinkificAdmin() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [apiKey, setApiKey] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [status, setStatus] = useState(null)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    setPageTitle('Thinkific Integration')
    if (user && user.role !== 'Admin') {
      navigate('/dashboard')
    }
  }, [setPageTitle, user, navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      const [settingsRes, statusRes] = await Promise.all([
        api.get('/api/settings'),
        api.get('/api/thinkific/status')
      ])
      
      if (settingsRes.success) {
        setApiKey(settingsRes.settings.thinkific_api_key || '')
        setSubdomain(settingsRes.settings.thinkific_subdomain || '')
      }
      
      if (statusRes.success) {
        setStatus(statusRes)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Poll status every 10 seconds
    const intv = setInterval(loadData, 10000)
    return () => clearInterval(intv)
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { thinkific_api_key: apiKey, thinkific_subdomain: subdomain }
      // Don't send masked keys back
      if (apiKey.includes('••••')) delete payload.thinkific_api_key
      
      const res = await api.put('/api/settings', payload)
      if (res.success) {
        setTestResult({ success: true, message: 'Settings saved! Attempting background refresh...' })
        await api.post('/api/thinkific/refresh')
        loadData()
      } else {
        setTestResult({ success: false, message: res.message })
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const payload = { apiKey, subdomain }
      if (apiKey.includes('••••')) delete payload.apiKey
      
      const res = await api.post('/api/thinkific/test', payload)
      setTestResult(res)
    } catch (err) {
      setTestResult({ success: false, message: err.message })
    } finally {
      setTesting(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await api.post('/api/thinkific/refresh')
      setTestResult({ success: true, message: 'Background refresh triggered. Check back in a minute.' })
      loadData()
    } catch (err) {
      setTestResult({ success: false, message: err.message })
    } finally {
      setRefreshing(false)
    }
  }

  if (loading && !status) return <div className="spinner" style={{ margin: '40px auto' }} />

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 800, margin: '0 auto' }}>
      
      <div style={{
        background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)', borderRadius: 16, padding: 24, marginBottom: 24
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Server size={20} /> Integration Settings
        </h2>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gap: 16 }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={14}/> Subdomain</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. watoto" 
              value={subdomain} 
              onChange={e => setSubdomain(e.target.value)} 
            />
            <small style={{ color: 'var(--text-tertiary)' }}>Just the prefix before .thinkific.com</small>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Key size={14}/> API Key</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder={apiKey.includes('••••') ? "••••••••" : "Paste API key here"} 
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 14, height: 14, borderLeftColor: 'white' }}/> : <Save size={16} />}
              Save Configuration
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleTest} disabled={testing}>
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </form>

        {testResult && (
          <div style={{ 
            marginTop: 16, padding: 12, borderRadius: 8, fontSize: 13,
            background: testResult.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            color: testResult.success ? '#81c784' : '#e57373',
            border: `1px solid ${testResult.success ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`
          }}>
            {testResult.message}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Status Panel */}
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)', borderRadius: 16, padding: 24
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Cache Status</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Students Tracking:</span>
              <span style={{ fontWeight: 600 }}>{status?.cacheSize || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Last Success:</span>
              <span>{status?.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ color: 'var(--text-tertiary)' }}>Last Attempt:</span>
               <span>{status?.lastAttempt ? new Date(status.lastAttempt).toLocaleString() : 'Never'}</span>
            </div>
            {status?.error && (
              <div style={{ color: '#e57373', fontSize: 13, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginBottom: -2, marginRight: 4 }}/>
                {status.error}
              </div>
            )}
          </div>

          <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing} style={{ width: '100%' }}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Cache Now'}
          </button>
        </div>

        {/* Webhooks Panel */}
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)', borderRadius: 16, padding: 24
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <LinkIcon size={16} /> Webhooks
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12, lineHeight: 1.5 }}>
            To keep progress data real-time, register this URL in your Thinkific Admin dashboard under <strong>Settings {'>'} Webhooks</strong>.
          </p>
          
          <div style={{ 
            background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, 
            fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all',
            border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16
          }}>
            {status?.webhookUrl || 'Loading URL...'}
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>Required Topics:</strong>
          </p>
          <ul style={{ fontSize: 13, color: 'var(--text-tertiary)', paddingLeft: 16, marginTop: 4, lineHeight: 1.6 }}>
            <li><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>enrollment.created</code></li>
            <li><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>user.signup</code></li>
            <li><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>course.progress.updated</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
