import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useAppStore } from '../../stores/appStore'
import api from '../../lib/api'
import menuBus from '../../lib/menuBus.js'
import { Server, Activity, Shield, Key, AlertTriangle, CheckCircle, RefreshCw, Layers, Database, Lock, Search, Users } from 'lucide-react'

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
    const [lookupQuery, setLookupQuery] = useState('')
    const [lookupResult, setLookupResult] = useState(null)
    const [lookupLoading, setLookupLoading] = useState(false)
    const [apiTestLoading, setApiTestLoading] = useState(false)
    const [apiTestResult, setApiTestResult] = useState(null)
    const [dryRunLoading, setDryRunLoading] = useState(false)
    const [dryRunResult, setDryRunResult] = useState(null)
    const [userSearchEmail, setUserSearchEmail] = useState('')
    const [userSearchLoading, setUserSearchLoading] = useState(false)
    const [userSearchResult, setUserSearchResult] = useState(null)

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

    const runLookup = async () => {
        const q = lookupQuery.trim()
        if (!q) return
        setLookupLoading(true)
        setLookupResult(null)
        try {
            const param = q.includes('@') ? `email=${encodeURIComponent(q)}` : `name=${encodeURIComponent(q)}`
            const data = await api.get(`/api/diagnostics/student-lookup?${param}`)
            setLookupResult(data)
        } catch (err) {
            setLookupResult({ error: err.message })
        } finally {
            setLookupLoading(false)
        }
    }

    const runApiTest = async (testEmail) => {
        setApiTestLoading(true)
        setApiTestResult(null)
        try {
            const qs = testEmail ? `?email=${encodeURIComponent(testEmail)}` : ''
            const data = await api.get(`/api/diagnostics/thinkific-raw-test${qs}`)
            setApiTestResult(data.results)
        } catch (err) {
            setApiTestResult({ error: err.message })
        } finally {
            setApiTestLoading(false)
        }
    }

    const runDryRun = async () => {
        if (!confirm('This runs a test sync against the live Thinkific API (page 1 only) without saving anything. Continue?')) return
        setDryRunLoading(true)
        setDryRunResult(null)
        try {
            const data = await api.post('/api/diagnostics/sync-dry-run')
            setDryRunResult(data.report)
        } catch (err) {
            setDryRunResult({ error: err.message })
        } finally {
            setDryRunLoading(false)
        }
    }

    const runUserSearch = async () => {
        const q = userSearchEmail.trim()
        if (!q) return
        setUserSearchLoading(true)
        setUserSearchResult(null)
        try {
            const data = await api.get(`/api/diagnostics/thinkific-user-search?email=${encodeURIComponent(q)}`)
            setUserSearchResult(data)
        } catch (err) {
            setUserSearchResult({ error: err.message })
        } finally {
            setUserSearchLoading(false)
        }
    }

    useEffect(() => {
        runDiagnostics()
    }, [])

    const runRef = useRef(runDiagnostics)
    runRef.current = runDiagnostics

    useEffect(() => {
        const unsubs = [
            menuBus.on('diagnostics:run', () => runRef.current()),
            menuBus.on('diagnostics:scroll', ({ section }) =>
                document.getElementById('diag-' + section)?.scrollIntoView({ behavior: 'smooth' })
            ),
        ]
        return () => unsubs.forEach(u => u())
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
                    title="Heartbeat & Sync" icon={<Activity size={18} />} loading={loading}
                    data={{ ...(payload?.backgroundSync || {}), syncReport: payload?.syncReport }}
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
                                    {sync.lastError?.includes('404') && <strong>404 — Wrong API URL: </strong>}
                                    {sync.lastError}
                                </div>
                            )}
                            {sync.syncReport && (
                                <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12 }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last sync</div>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
                                        <span>Fetched: <strong style={{ color: 'var(--text-primary)' }}>{sync.syncReport.rawFetched}</strong></span>
                                        <span>WL101: <strong style={{ color: sync.syncReport.wl101Count === 0 ? '#e57373' : 'var(--text-primary)' }}>{sync.syncReport.wl101Count}</strong></span>
                                        <span>Saved: <strong style={{ color: 'var(--text-primary)' }}>{sync.syncReport.processed}</strong></span>
                                        <span>Dropped: <strong style={{ color: (sync.syncReport.dropped || 0) > 20 ? '#ffb74d' : 'var(--text-primary)' }}>{sync.syncReport.dropped}</strong></span>
                                    </div>
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

                {/* 9. Cache Freshness */}
                <DiagnosticCard
                    title="Cache Freshness" icon={<RefreshCw size={18} />} loading={loading} data={payload?.cacheFreshness}
                    success={payload?.cacheFreshness?.diskCacheAgeMinutes !== null && payload?.cacheFreshness?.diskCacheAgeMinutes < 15}
                    renderDetails={cf => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Disk Cache Age:</span>
                                <strong style={{ color: cf.diskCacheAgeMinutes > 15 ? '#ffb74d' : '#81c784' }}>
                                    {cf.diskCacheAgeMinutes !== null ? `${cf.diskCacheAgeMinutes} min ago` : 'Unknown'}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Last Webhook Event:</span>
                                <span>{cf.webhookLastEvent ? new Date(cf.webhookLastEvent.at).toLocaleTimeString() : 'None recorded'}</span>
                            </div>
                            {cf.webhookLastEvent && (
                                <div style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 4, color: 'var(--text-tertiary)' }}>
                                    {cf.webhookLastEvent.type} — user {cf.webhookLastEvent.userId}
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Cron Last Success:</span>
                                <span>{cf.cronLastSuccess ? new Date(cf.cronLastSuccess).toLocaleTimeString() : 'Never'}</span>
                            </div>
                            {cf.cronLastError && (
                                <div style={{ color: '#e57373', fontSize: 12, marginTop: 4, padding: 8, background: 'rgba(244, 67, 54, 0.1)', borderRadius: 6 }}>
                                    Cron error ({cf.cronLastError.failures}x): {cf.cronLastError.message}
                                </div>
                            )}
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

            {/* Student Data Quality + Lookup */}
            <div style={{
                marginTop: 24,
                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20,
            }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Users size={18} /> Student Data Quality
                </h3>

                {!loading && payload && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: 'Total in Cache', value: payload.cacheContent?.studentCount ?? '—' },
                            { label: 'Unknown Campus', value: payload.backgroundSync?.unknownCampusCount ?? '—', warn: (payload.backgroundSync?.unknownCampusCount || 0) > 0 },
                            { label: 'Unknown Name', value: payload.backgroundSync?.unknownCount ?? '—', warn: (payload.backgroundSync?.unknownCount || 0) > 0 },
                            { label: 'Dropped Records', value: payload.backgroundSync?.droppedCount ?? '—', warn: (payload.backgroundSync?.droppedCount || 0) > 20 },
                        ].map(stat => (
                            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{stat.label}</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: stat.warn ? '#e57373' : 'var(--text-primary)' }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginBottom: lookupResult ? 16 : 0 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            className="form-input"
                            placeholder="Search by email or name (e.g. kasulech@yahoo.com or Kasule Charles)"
                            value={lookupQuery}
                            onChange={e => setLookupQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && runLookup()}
                            style={{ paddingLeft: 32, fontSize: 13 }}
                        />
                    </div>
                    <button className="btn btn-secondary" onClick={runLookup} disabled={lookupLoading || !lookupQuery.trim()}>
                        {lookupLoading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
                        Lookup
                    </button>
                </div>

                {lookupResult && (
                    <div style={{ fontSize: 13 }}>
                        {lookupResult.error ? (
                            <div style={{ color: '#e57373', padding: 10, background: 'rgba(244,67,54,0.1)', borderRadius: 8 }}>
                                Error: {lookupResult.error}
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                                    <span>Processed cache: <strong style={{ color: lookupResult.summary.foundInProcessed > 0 ? '#81c784' : '#e57373' }}>{lookupResult.summary.foundInProcessed}</strong></span>
                                    <span>Raw cache: <strong style={{ color: lookupResult.summary.foundInRaw > 0 ? '#81c784' : '#e57373' }}>{lookupResult.summary.foundInRaw}</strong></span>
                                    <span style={{ color: 'var(--text-tertiary)' }}>of {lookupResult.summary.totalRaw} raw / {lookupResult.summary.totalProcessed} processed</span>
                                </div>

                                {lookupResult.summary.foundInRaw > 0 && lookupResult.summary.foundInProcessed === 0 && (
                                    <div style={{ color: '#ffb74d', padding: '8px 12px', background: 'rgba(255,183,77,0.1)', borderRadius: 8, marginBottom: 10 }}>
                                        Found in raw cache but dropped during processing — likely missing name or email in Thinkific profile.
                                    </div>
                                )}

                                {lookupResult.rawCacheMatches.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Raw Thinkific record(s):</div>
                                        {lookupResult.rawCacheMatches.map((r, i) => (
                                            <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 6, marginBottom: 6, color: 'var(--text-secondary)' }}>
                                                ID:{r.userId} · {r.firstName} {r.lastName} · {r.email || '(no email)'} · campus:{r.company || '(none)'}
                                                {!r.hasName && <span style={{ color: '#e57373' }}> ⚠ NO NAME</span>}
                                                {!r.hasEmail && <span style={{ color: '#ffb74d' }}> ⚠ NO EMAIL</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {lookupResult.summary.foundInRaw === 0 && lookupResult.summary.foundInProcessed === 0 && (
                                    <div style={{ color: 'var(--text-tertiary)', padding: 10 }}>
                                        Not found in cache. Student may not be enrolled in the WL101 course, or was enrolled after the last sync. Try forcing a refresh.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Thinkific Live API Tests */}
            <div style={{ marginTop: 24, background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-primary)' }}>
                    <Activity size={18} /> Thinkific Live API Tests
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Tests hit the Thinkific API directly (not the cache). Page 1 only — safe to run at any time.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => runApiTest()} disabled={apiTestLoading}>
                        {apiTestLoading ? <RefreshCw size={14} className="spin" /> : <Activity size={14} />}
                        {apiTestLoading ? 'Testing…' : 'Test Thinkific API'}
                    </button>
                    <button className="btn btn-secondary" onClick={runDryRun} disabled={dryRunLoading}>
                        {dryRunLoading ? <RefreshCw size={14} className="spin" /> : <Database size={14} />}
                        {dryRunLoading ? 'Running…' : 'Sync Dry Run'}
                    </button>
                </div>

                {apiTestResult && (
                    <div style={{ marginTop: 16, fontSize: 13 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Test Results</div>
                        {apiTestResult.error ? (
                            <div style={{ color: '#e57373', padding: 10, background: 'rgba(244,67,54,0.1)', borderRadius: 8 }}>Error: {apiTestResult.error}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { label: 'Enrollments v1', d: apiTestResult.v1Enrollments },
                                    { label: 'Users v1', d: apiTestResult.v1Users },
                                ].map(({ label, d }) => d && (
                                    <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: 'monospace' }}>
                                        <div style={{ fontWeight: 600, color: d.error ? '#e57373' : '#81c784', marginBottom: 4 }}>
                                            {label}: {d.error ? `ERROR ${d.status || ''}` : `HTTP ${d.status} — ${d.totalFromPagination} total`}
                                        </div>
                                        {d.error ? (
                                            <div style={{ color: '#e57373' }}>{d.error}</div>
                                        ) : (
                                            <div style={{ color: 'var(--text-secondary)' }}>
                                                Keys: {(d.sampleKeys || []).join(', ')}
                                                {d.sampleItem?.has_user_object !== undefined && (
                                                    <span style={{ color: d.sampleItem.has_user_object ? '#81c784' : '#ffb74d', marginLeft: 8 }}>
                                                        {d.sampleItem.has_user_object ? '✓ has user object' : '⚠ no user object (expected for v1)'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {apiTestResult.userSearch && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                                        <span style={{ fontWeight: 600 }}>User search ({apiTestResult.userSearch.searchEmail}): </span>
                                        <span style={{ color: apiTestResult.userSearch.found > 0 ? '#81c784' : '#e57373' }}>
                                            {apiTestResult.userSearch.found > 0
                                                ? `Found — ${apiTestResult.userSearch.user?.first_name} ${apiTestResult.userSearch.user?.last_name} (company: ${apiTestResult.userSearch.user?.company || 'none'})`
                                                : 'Not found'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {dryRunResult && (
                    <div style={{ marginTop: 16, fontSize: 13 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dry Run Results (page 1 only)</div>
                        {dryRunResult.error ? (
                            <div style={{ color: '#e57373', padding: 10, background: 'rgba(244,67,54,0.1)', borderRadius: 8 }}>Error: {dryRunResult.error}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                                {dryRunResult.step1_enrollments && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                                        <strong>Step 1 — Enrollments:</strong> {dryRunResult.step1_enrollments.page1Count} on page 1 of {dryRunResult.step1_enrollments.numPages} pages ({dryRunResult.step1_enrollments.totalReported} total)
                                        {dryRunResult.step1_enrollments.courseNames?.length > 0 && (
                                            <div style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>Courses: {dryRunResult.step1_enrollments.courseNames.join(', ')}</div>
                                        )}
                                    </div>
                                )}
                                {dryRunResult.step2_users && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                                        <strong>Step 2 — Users:</strong> {dryRunResult.step2_users.page1Count} on page 1 ({dryRunResult.step2_users.totalReported} total)
                                        {dryRunResult.step2_users.unmappedCompanies?.length > 0 && (
                                            <div style={{ color: '#ffb74d', marginTop: 2 }}>⚠ Unmapped campus values: {dryRunResult.step2_users.unmappedCompanies.join(', ')}</div>
                                        )}
                                        {dryRunResult.step2_users.companyExamples?.length > 0 && (
                                            <div style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>Company samples: {dryRunResult.step2_users.companyExamples.join(', ')}</div>
                                        )}
                                    </div>
                                )}
                                {dryRunResult.step3_join && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                                        <strong>Step 3 — Join:</strong> {dryRunResult.step3_join.matchedWithUser}/{dryRunResult.step3_join.totalEnrollments} matched
                                        {dryRunResult.step3_join.noUserMatch > 0 && <span style={{ color: '#ffb74d' }}> ({dryRunResult.step3_join.noUserMatch} unmatched)</span>}
                                    </div>
                                )}
                                {dryRunResult.step4_filter && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                                        <strong>Step 4 — WL101 filter:</strong>{' '}
                                        <span style={{ color: dryRunResult.step4_filter.filterMatched ? '#81c784' : '#e57373' }}>
                                            {dryRunResult.step4_filter.afterFilter} matched of {dryRunResult.step4_filter.beforeFilter}
                                            {!dryRunResult.step4_filter.filterMatched && ' — FILTER FAILED, check course names'}
                                        </span>
                                        {dryRunResult.step4_filter.courseNamesFound?.length > 0 && !dryRunResult.step4_filter.filterMatched && (
                                            <div style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>All course names: {dryRunResult.step4_filter.courseNamesFound.join(', ')}</div>
                                        )}
                                        {dryRunResult.step4_filter.wl101CourseNames?.length > 0 && (
                                            <div style={{ color: '#81c784', marginTop: 2 }}>WL101 courses: {dryRunResult.step4_filter.wl101CourseNames.join(', ')}</div>
                                        )}
                                    </div>
                                )}
                                {dryRunResult.step5_process && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                                        <strong>Step 5 — Process:</strong> {dryRunResult.step5_process.succeeded}/{dryRunResult.step5_process.attempted} succeeded
                                        {dryRunResult.sampleStudents?.length > 0 && (
                                            <div style={{ marginTop: 6 }}>
                                                {dryRunResult.sampleStudents.map((s, i) => (
                                                    <div key={i} style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: 2 }}>
                                                        {s.name} · {s.email} · {s.campus || <span style={{ color: '#e57373' }}>Unknown campus</span>} · {s.progress}%
                                                        {s.rawCampus && s.campus === 'Unknown' && <span style={{ color: '#ffb74d' }}> (raw: "{s.rawCampus}")</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {dryRunResult.errors?.length > 0 && (
                                            <div style={{ color: '#e57373', marginTop: 4 }}>Errors: {dryRunResult.errors.join('; ')}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Thinkific Direct User Search */}
            <div style={{ marginTop: 24, marginBottom: 0, background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-primary)' }}>
                    <Search size={18} /> Thinkific Direct User Search
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Search the live Thinkific API by email — bypasses the local cache. Verifies whether a student exists on Thinkific and whether they're enrolled in WL101.
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: userSearchResult ? 16 : 0 }}>
                    <input
                        className="form-input"
                        placeholder="Email address (e.g. kasulech@yahoo.com)"
                        value={userSearchEmail}
                        onChange={e => setUserSearchEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && runUserSearch()}
                        style={{ fontSize: 13, flex: 1 }}
                    />
                    <button className="btn btn-secondary" onClick={runUserSearch} disabled={userSearchLoading || !userSearchEmail.trim()}>
                        {userSearchLoading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
                        {userSearchLoading ? 'Searching…' : 'Search Thinkific'}
                    </button>
                </div>
                {userSearchResult && (
                    <div style={{ fontSize: 13 }}>
                        {userSearchResult.error ? (
                            <div style={{ color: '#e57373', padding: 10, background: 'rgba(244,67,54,0.1)', borderRadius: 8 }}>Error: {userSearchResult.error}</div>
                        ) : userSearchResult.foundInUsers === 0 ? (
                            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                                <div style={{ color: '#ffb74d', fontWeight: 600, marginBottom: 4 }}>Not found in Thinkific users</div>
                                {userSearchResult.message && <div style={{ color: 'var(--text-secondary)' }}>{userSearchResult.message}</div>}
                                {userSearchResult.foundInEnrollments > 0 && (
                                    <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                                        Found {userSearchResult.foundInEnrollments} enrollment(s) by email:
                                        {userSearchResult.enrollments?.map((e, i) => (
                                            <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 4, color: 'var(--text-tertiary)' }}>
                                                {e.course_name || 'Unknown course'} — {e.user_email}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 14px' }}>
                                <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap', fontWeight: 600 }}>
                                    <span style={{ color: '#81c784' }}>Found on Thinkific</span>
                                    <span style={{ color: userSearchResult.inWL101 ? '#81c784' : '#e57373' }}>
                                        {userSearchResult.inWL101 ? '✓ Enrolled in WL101' : '✗ Not enrolled in WL101'}
                                    </span>
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div>ID: {userSearchResult.user?.id} · {userSearchResult.user?.first_name} {userSearchResult.user?.last_name}</div>
                                    <div>Email: {userSearchResult.user?.email}</div>
                                    <div style={{ color: !userSearchResult.user?.company ? '#ffb74d' : 'var(--text-secondary)' }}>
                                        Company (campus): {userSearchResult.user?.company || '(empty — will map to Unknown)'}
                                    </div>
                                    {userSearchResult.enrollments?.length > 0 && (
                                        <div style={{ marginTop: 6 }}>
                                            Enrollments ({userSearchResult.enrollments.length}):
                                            {userSearchResult.enrollments.map((e, i) => (
                                                <div key={i} style={{ marginLeft: 12, color: 'var(--text-tertiary)' }}>· {e.course_name || 'Unknown'} ({e.percentage_completed}%)</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
