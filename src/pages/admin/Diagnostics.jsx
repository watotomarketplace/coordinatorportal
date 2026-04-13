import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useAppStore } from '../../stores/appStore'
import api from '../../lib/api'
import { Server, Activity, Shield, Key, AlertTriangle, CheckCircle, RefreshCw, Layers, Database, Lock } from 'lucide-react'

// Sub-component for individual diagnostic cards
function DiagnosticCard({ title, icon, loading, data, renderDetails, success }) {
    return (
        <div style={{
            background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
            border: `1px solid ${success === false ? 'rgba(244, 67, 54, 0.3)' : 'var(--glass-border)'}`, 
            borderRadius: 16, padding: 20
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                    {icon} {title}
                </h3>
                <div>
                    {loading ? <RefreshCw size={16} className="spin" style={{ color: 'var(--text-tertiary)' }} />
                    : success === null ? null
                    : success ? <CheckCircle size={18} style={{ color: '#81c784' }} />
                    : <AlertTriangle size={18} style={{ color: '#e57373' }} />}
                </div>
            </div>
            
            {loading ? (
                <div className="skeleton skeleton-row" style={{ height: 60 }} />
            ) : data ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {renderDetails(data)}
                </div>
            ) : (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No data available</div>
            )}
        </div>
    )
}

export default function Diagnostics() {
    const setPageTitle = useAppStore(s => s.setPageTitle)
    const user = useAuthStore(s => s.user)
    const hasRole = useAuthStore(s => s.hasRole)
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [triggeringPull, setTriggeringPull] = useState(false)
    const [payload, setPayload] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        setPageTitle('System Diagnostics')
    }, [setPageTitle])

    useEffect(() => {
        if (user && !hasRole('Admin') && !hasRole('LeadershipTeam') && !hasRole('TechSupport')) {
            navigate('/dashboard')
        }
    }, [user, navigate, hasRole])

    const runDiagnostics = async () => {
        setRunning(true)
        setError(null)
        try {
            const data = await api.get('/api/diagnostics')
            setPayload(data)
        } catch (err) {
            setError(err.message || 'Failed to fetch diagnostics.')
        } finally {
            setLoading(false)
            setRunning(false)
        }
    }

    const forceCacheRefresh = async () => {
        if (!confirm('This will trigger a full background re-sync spanning all Thinkific pages. It may take ~90 seconds. Continue?')) return
        setTriggeringPull(true)
        try {
            await api.post('/api/thinkific/force-refresh')
            alert('Refresh triggered in background. Check Dashboard KPI cards in 60-90 seconds.')
            setTimeout(runDiagnostics, 2000)
        } catch (err) {
            alert(`Failed: ${err.message}`)
        } finally {
            setTriggeringPull(false)
        }
    }

    useEffect(() => {
        runDiagnostics()
    }, [])

    return (
        <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 600 }}>
                    This matrix identifies connectivity layers spanning Network, Caching, and Core Database schemas.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={runDiagnostics} disabled={running}>
                        <RefreshCw size={14} className={running ? 'spin' : ''} /> {running ? 'Testing...' : 'Run All Tests'}
                    </button>
                    <button className="btn btn-primary" onClick={forceCacheRefresh} disabled={triggeringPull}>
                        <Database size={14} /> Reset Thinkific Cache and Force Full Sync
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)', color: '#e57373', padding: 16, borderRadius: 12, marginBottom: 24 }}>
                    <strong>System Verification Error:</strong> {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: 20 }}>
                
                {/* 1. Environment */}
                <DiagnosticCard 
                    title="API Environment" icon={<Key size={18} />} loading={loading} data={payload?.environment}
                    success={payload?.environment?.hasApiKey && payload?.environment?.hasSubdomain}
                    renderDetails={env => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>API Key Configured:</span>
                                <strong>{env.hasApiKey ? <span style={{color: '#81c784'}}>True</span> : <span style={{color: '#e57373'}}>False</span>}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Masked Pattern:</span>
                                <span style={{ fontFamily: 'monospace' }}>{env.apiKeyMasked || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Subdomain:</span>
                                <strong>{env.subdomain || 'N/A'}</strong>
                            </div>
                        </div>
                    )}
                />

                {/* 2 & 3. Authentication & Connectivity */}
                <DiagnosticCard 
                    title="Thinkific Auth" icon={<Lock size={18} />} loading={loading} data={payload}
                    success={payload?.auth?.authenticated}
                    renderDetails={data => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Endpoint Reachable:</span>
                                <strong>{data.connectivity.reachable ? 'Yes' : 'No'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>API Authorized:</span>
                                <strong>{data.auth.authenticated ? 'Yes' : 'No'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>HTTP Status:</span>
                                <strong>{data.auth.statusCode || 'N/A'} - {data.auth.message}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Latency:</span>
                                <strong>{data.connectivity.latencyMs} ms</strong>
                            </div>
                        </div>
                    )}
                />

                {/* 4 & 5. Cache File Status */}
                <DiagnosticCard 
                    title="Cache Integrity" icon={<Layers size={18} />} loading={loading} data={payload}
                    success={payload?.cacheFile?.exists && payload?.cacheFile?.validJson && payload?.cacheContent?.studentCount > 0}
                    renderDetails={data => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Disk Cache Resides:</span>
                                <strong>{data.cacheFile.exists ? 'Yes (/db/cache.json)' : 'No'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>JSON Valid:</span>
                                <strong>{data.cacheFile.validJson ? 'Yes' : 'No'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Total Students Stored:</span>
                                <strong>{data.cacheContent.studentCount} users</strong>
                            </div>
                            {data.cacheFile.lastModified && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Last Modified:</span>
                                    <span style={{ fontSize: 11 }}>{new Date(data.cacheFile.lastModified).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}
                />

                {/* 6. Background Sync */}
                <DiagnosticCard 
                    title="Heartbeat & Sync" icon={<Activity size={18} />} loading={loading} data={payload?.backgroundSync}
                    success={payload?.backgroundSync?.lastError === null && payload?.backgroundSync?.lastSync !== null}
                    renderDetails={sync => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Scheduler Running:</span>
                                <strong>{sync.running ? 'Yes (BullMQ/Cron)' : 'Warning'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Last Sync Success:</span>
                                <span>{sync.lastSync ? new Date(sync.lastSync).toLocaleTimeString() : 'Never'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Last Connection Attempt:</span>
                                <span>{sync.lastAttempt ? new Date(sync.lastAttempt).toLocaleTimeString() : 'Never'}</span>
                            </div>
                            {sync.lastError && (
                                <div style={{ color: '#e57373', fontSize: 12, marginTop: 4, padding: 8, background: 'rgba(244, 67, 54, 0.1)', borderRadius: 6 }}>
                                    {sync.lastError}
                                </div>
                            )}
                        </div>
                    )}
                />

                {/* 7. Database Status */}
                <DiagnosticCard 
                    title="Database Engine" icon={<Server size={18} />} loading={loading} data={payload?.database}
                    success={payload?.database?.tableExists}
                    renderDetails={db => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>SQLite Active:</span>
                                <strong>{db.tableExists ? 'Yes' : 'No'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Registered Portal Users:</span>
                                <strong>{db.usersCount} users</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Formation Groups:</span>
                                <strong>{db.formationGroupCount} mapped</strong>
                            </div>
                        </div>
                    )}
                />

                {/* 8. Webhook Info */}
                <DiagnosticCard 
                    title="Ingress Webhooks" icon={<Shield size={18} />} loading={loading} data={payload?.webhook}
                    success={!!payload?.webhook?.url}
                    renderDetails={webhook => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ fontSize: 12, wordBreak: 'break-all', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                                {webhook.url}
                            </div>
                            <p style={{ fontSize: 11, fontStyle: 'italic', margin: '4px 0 0 0', color: 'var(--text-tertiary)' }}>
                                Ensure this URL is correctly configured precisely in your Thinkific developer panel!
                            </p>
                        </div>
                    )}
                />
            </div>
            
            {!loading && payload && payload.cacheContent?.studentCount === 0 && (
                <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                    <h4 style={{ color: '#e57373', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px 0', fontSize: 15 }}>
                        <AlertTriangle size={16} /> Resolution Plan: Cache Missing
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        The Dashboard charts will read exactly 0 if this list remains empty. We've detected no users synced from the LMS! 
                        <br/><br/>
                        1. Verify API Key and Subdomain in the top panel are <strong style={{color:'#81c784'}}>True</strong>.<br/>
                        2. Verify API Authorization returned a <strong style={{color:'#81c784'}}>200</strong> status code.<br/>
                        3. Press <strong>Clear Cache & Retry</strong> to rebuild the `thinkific_students` tree manually.
                    </p>
                </div>
            )}
        </div>
    )
}
