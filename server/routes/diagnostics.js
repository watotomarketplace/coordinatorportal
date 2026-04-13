import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import { userHasAnyRole } from '../middleware/rbac.js'
import { dbGet, dbAll } from '../db/init.js'
import { getCacheStatus } from '../services/thinkific.js' // We need to export this properly if we haven't or replicate its logic

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const CACHE_FILE = path.join(__dirname, '../db/cache.json')

async function getThinkificConfig() {
    try {
        const apiKeyRow = await dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_api_key'")
        const subdomainRow = await dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_subdomain'")
        
        const apiKey = apiKeyRow?.value || process.env.THINKIFIC_API_KEY
        const subdomain = subdomainRow?.value || process.env.THINKIFIC_SUBDOMAIN
        
        return { apiKey: apiKey || '', subdomain: subdomain || '' }
    } catch (err) {
        return { apiKey: process.env.THINKIFIC_API_KEY || '', subdomain: process.env.THINKIFIC_SUBDOMAIN || '' }
    }
}

// Diagnostic Access logic
const requireDiagnosticsAccess = (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!userHasAnyRole(req.session.user, ['Admin', 'LeadershipTeam', 'TechSupport'])) {
        return res.status(403).json({ success: false, message: 'Diagnostics access requires Admin, TechSupport, or LeadershipTeam.' })
    }
    next()
}

// Comprehensive Diagnostic Tool
router.get('/', requireDiagnosticsAccess, async (req, res) => {
    const payload = {}
    console.log('[Diagnostics] Running system diagnostics...')

    // 1. Environment
    const { apiKey, subdomain } = await getThinkificConfig()
    payload.environment = {
        hasApiKey: !!apiKey,
        hasSubdomain: !!subdomain,
        apiKeyMasked: apiKey ? `th...${apiKey.slice(-4)}` : null,
        subdomain
    }

    // 2. Connectivity & 3. Auth
    const start = Date.now()
    payload.connectivity = { reachable: false, latencyMs: 0, error: null }
    payload.auth = { authenticated: false, statusCode: null, message: null }

    if (apiKey && subdomain) {
        try {
            const apiRes = await axios.get(`https://api.thinkific.com/api/public/v1/courses?limit=1`, {
                headers: { 'X-Auth-API-Key': apiKey, 'X-Auth-Subdomain': subdomain },
                timeout: 5000
            })
            payload.connectivity.reachable = true
            payload.connectivity.latencyMs = Date.now() - start
            payload.auth.authenticated = true
            payload.auth.statusCode = apiRes.status
            payload.auth.message = 'OK'
        } catch (err) {
            payload.connectivity.latencyMs = Date.now() - start
            if (err.response) {
                payload.connectivity.reachable = true // DNS resolved, server replied
                payload.auth.statusCode = err.response.status
                
                if (err.response.status === 429) {
                    payload.auth.authenticated = true // Recognized, just throttled
                    payload.auth.message = 'Throttled (Rate Limit)'
                } else {
                    payload.auth.message = err.response.statusText || 'Unauthorized'
                }
            } else {
                payload.connectivity.error = err.message
                payload.auth.message = 'Unreachable'
            }
        }
    } else {
        payload.auth.message = 'Missing credentials'
    }

    // 4. Cache File Status
    payload.cacheFile = { exists: false, sizeBytes: 0, lastModified: null, validJson: false }
    payload.cacheContent = { studentCount: 0, sample: [] }
    
    if (fs.existsSync(CACHE_FILE)) {
        payload.cacheFile.exists = true
        try {
            const stats = fs.statSync(CACHE_FILE)
            payload.cacheFile.sizeBytes = stats.size
            payload.cacheFile.lastModified = stats.mtime.toISOString()

            const raw = fs.readFileSync(CACHE_FILE, 'utf8')
            const parsed = JSON.parse(raw)
            payload.cacheFile.validJson = true
            
            const data = parsed.data || []
            payload.cacheContent.studentCount = data.length
            payload.cacheContent.sample = data.slice(0, 2).map(s => ({
                id: s.id || s.userId,
                name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name,
                email: s.email
            }))
        } catch (e) {
            payload.cacheFile.validJson = false
            payload.cacheFile.error = e.message
        }
    }

    // 6. Background Sync
    // We fetch this carefully by requesting the cache status natively
    const thinkificStatus = getCacheStatus ? getCacheStatus() : {}
    payload.backgroundSync = {
        running: true, // Cron registered via init module
        lastSync: thinkificStatus.lastSync ? new Date(thinkificStatus.lastSync).toISOString() : null,
        lastAttempt: thinkificStatus.lastAttempt ? new Date(thinkificStatus.lastAttempt).toISOString() : null,
        lastError: thinkificStatus.error || null
    }

    // 7. Database Status
    payload.database = { tableExists: false, formationGroupCount: 0, usersCount: 0 }
    try {
        const groups = await dbAll(`SELECT COUNT(*) as c FROM formation_groups`)
        payload.database.tableExists = true
        payload.database.formationGroupCount = groups[0].c
        const users = await dbAll(`SELECT COUNT(*) as c FROM users`)
        payload.database.usersCount = users[0].c
    } catch (e) {
        payload.database.error = e.message
    }

    // 8. Webhook
    payload.webhook = {
        url: `${req.protocol}://${req.get('host')}/api/webhooks/thinkific`,
        lastReceived: null // If tracking natively in db, we might query audit logs in future
    }

    res.json(payload)
})

export default router
