import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { calculateRiskScore } from './risk.js'
import { dbGet } from '../db/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CACHE_FILE = path.join(__dirname, '../db/cache.json')

let cache = {
    data: null,
    unenrolled: [],
    timestamp: 0,
    lastSyncAttempt: 0,
    lastSyncSuccess: 0,
    syncError: null,
    duration: 5 * 60 * 1000 // 5 minutes
}

const VALID_CELEBRATION_POINTS = [
    'Bbira', 'Bugolobi', 'Bweyogerere', 'Downtown', 'Entebbe',
    'Nakwero', 'Gulu', 'Jinja', 'Juba', 'Kansanga', 'Kyengera',
    'Laminadera', 'Lubowa', 'Mbarara', 'Mukono', 'Nansana',
    'Ntinda', 'Online', 'Suubi'
]

function normalizeCelebrationPoint(raw) {
    if (!raw) return 'Unknown'
    const clean = raw.replace(/watoto\s+church\s*/gi, '').trim()
    const found = VALID_CELEBRATION_POINTS.find(p => p.toLowerCase() === clean.toLowerCase())
    return found || 'Unknown'
}

async function createClient() {
    const apiKeyRow = await dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_api_key'")
    const subdomainRow = await dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_subdomain'")
    return axios.create({
        baseURL: `https://api.thinkific.com/api/public/v1`,
        headers: {
            'X-Auth-API-Key': apiKeyRow?.value || process.env.THINKIFIC_API_KEY,
            'X-Auth-Subdomain': subdomainRow?.value || process.env.THINKIFIC_SUBDOMAIN,
            'Content-Type': 'application/json'
        },
        timeout: 20000
    })
}

export async function getStudentData(filterCP = null) {
    if (!cache.data) loadCache()
    if (cache.data && cache.data.length > 0) {
        if (Date.now() - cache.timestamp > cache.duration) triggerRefresh()
        return { students: filterCP ? cache.data.filter(s => s.celebration_point === filterCP) : cache.data, lastUpdated: cache.timestamp }
    }
    await doRefresh()
    return { students: filterCP ? cache.data.filter(s => s.celebration_point === filterCP) : cache.data, lastUpdated: cache.timestamp }
}

export function getStudentById(id) {
    if (!cache.data) loadCache()
    return (cache.data || []).find(s => String(s.id) === String(id) || String(s.userId) === String(id))
}

function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
            if (saved.data) {
                cache = { ...saved, duration: cache.duration }
                return true
            }
        }
    } catch (e) { console.error('Cache load failed:', e.message) }
    return false
}

function saveCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8')
    } catch (e) { console.error('Cache save failed:', e.message) }
}

let refreshPromise = null
function triggerRefresh() {
    if (refreshPromise) return
    doRefresh().catch(() => {})
}

async function doRefresh() {
    if (refreshPromise) return refreshPromise
    refreshPromise = (async () => {
        try {
            const client = await createClient()
            console.log('🔄 Syncing Thinkific students...')
            
            // 1. Fetch Users
            let users = []
            let page = 1
            while (page <= 100) { // Safety limit
                const res = await client.get('/users', { params: { page, limit: 50 } })
                users.push(...(res.data.items || []))
                if (page >= res.data.meta.pagination.total_pages) break
                page++
                await new Promise(r => setTimeout(r, 1000)) // Throttle
            }

            // 2. Fetch Enrollments for WL101 (ID: 3300782)
            let enrollments = []
            page = 1
            while (page <= 100) {
                const res = await client.get('/enrollments', { params: { page, limit: 50, 'query[product_id]': 3300782 } })
                enrollments.push(...(res.data.items || []))
                if (page >= res.data.meta.pagination.total_pages) break
                page++
                await new Promise(r => setTimeout(r, 1000))
            }

            // 3. Process
            const userMap = new Map(users.map(u => [u.id, u]))
            const processed = enrollments.map(e => {
                const u = userMap.get(e.user_id) || {}
                const student = {
                    id: e.id,
                    userId: e.user_id,
                    name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                    email: u.email,
                    celebration_point: normalizeCelebrationPoint(u.company),
                    progress: Math.round((e.percentage_completed || 0) * 100),
                    status: e.status,
                    lastActivity: e.last_engagement_at || u.last_sign_in_at,
                    joinedAt: e.created_at
                }
                student.risk = calculateRiskScore(student)
                student.risk_category = student.risk.category
                return student
            })

            cache.data = processed
            cache.timestamp = Date.now()
            cache.lastSyncSuccess = Date.now()
            saveCache()
            console.log(`✅ Sync complete: ${processed.length} students.`)
        } catch (error) {
            console.error('❌ Sync failed:', error.message)
            cache.syncError = error.message
        } finally {
            refreshPromise = null
        }
    })()
    return refreshPromise
}

export function getStudentProgress(id) {
    const s = getStudentById(id)
    return s ? { progress: s.progress, status: s.status } : null
}

export function forceRefresh() {
    return doRefresh()
}
