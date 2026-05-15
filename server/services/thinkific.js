import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { calculateRiskScore } from './risk.js'
import { dbGet, dbAll, dbRun, IS_POSTGRES } from '../db/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CACHE_FILE = path.join(__dirname, '../db/cache.json')

// In-memory layer on top of the DB for fast lookups
let cache = {
    data: null,      // full student array (loaded from DB on boot)
    timestamp: 0,
    lastSyncAttempt: 0,
    lastSyncSuccess: 0,
    syncError: null,
    isSyncing: false,
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
    // Strip "Watoto Church" prefix (with optional comma/space after it)
    let clean = raw
        .replace(/watoto\s+church\s*,?\s*/gi, '')
        .replace(/,/g, '')
        .trim()
    if (!clean) return 'Unknown'
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

export function getStats(students) {
    const total = students.length
    const healthy = students.filter(s => s.risk_category === 'Healthy').length
    const attention = students.filter(s => s.risk_category === 'Attention').length
    const critical = students.filter(s => s.risk_category === 'Critical').length
    const avgProgress = students.length > 0 ? Math.round(students.reduce((acc, s) => acc + (s.progress || 0), 0) / students.length) : 0
    // Use daysSinceActivity from risk breakdown (enrollment.updated_at proxy).
    // Thinkific API never returns last_sign_in_at for this account, so
    // lastActivity is always undefined. The risk engine stores daysSinceActivity
    // from enrollment.updated_at which IS reliable.
    const active = students.filter(s => {
        const dsa = s.risk?.breakdown?.daysSinceActivity
        if (dsa !== undefined && dsa < 999) return dsa <= 30
        if (s.lastActivity) {
            return (new Date() - new Date(s.lastActivity)) < (30 * 24 * 60 * 60 * 1000)
        }
        return false
    }).length

    return {
        totalStudents: total,
        healthyStudents: healthy,
        attentionStudents: attention,
        criticalStudents: critical,
        atRiskStudents: attention + critical,
        averageProgress: avgProgress,
        activeStudents: active
    }
}

export function getChartData(students) {
    const progressDist = [0, 0, 0, 0, 0]
    students.forEach(s => {
        const p = s.progress || 0
        const idx = Math.min(Math.floor(p / 20), 4)
        progressDist[idx]++
    })

    const healthy = students.filter(s => s.risk_category === 'Healthy').length
    const attention = students.filter(s => s.risk_category === 'Attention').length
    const critical = students.filter(s => s.risk_category === 'Critical').length

    const riskDist = { healthy, attention, critical }

    // Match Dashboard.jsx progress bar buckets: On Track (≥75%), In Progress (30-74%), Needs Help (<30%)
    const onTrack = students.filter(s => (s.progress || 0) >= 75).length
    const inProgress = students.filter(s => (s.progress || 0) >= 30 && (s.progress || 0) < 75).length
    const needsHelp = students.filter(s => (s.progress || 0) < 30).length

    // Array so Chart.js datasets don't trigger object-data path
    const completionStatus = [onTrack, inProgress, needsHelp]

    const courseProgressMap = {}
    students.forEach(s => {
        const c = s.course || 'Leadership 101'
        if (!courseProgressMap[c]) courseProgressMap[c] = { sum: 0, count: 0 }
        courseProgressMap[c].sum += (s.progress || 0)
        courseProgressMap[c].count++
    })

    const courseProgressEntries = Object.entries(courseProgressMap)
    const courseProgress = {
        labels: courseProgressEntries.map(([name]) => name),
        values: courseProgressEntries.map(([, d]) => Math.round(d.sum / d.count))
    }

    return {
        progressDistribution: progressDist,
        riskDistribution: riskDist,
        completionStatus,
        courseProgress
    }
}

export async function getPaginatedUsers({ page = 1, limit = 50, search = '', celebrationPoint = '', risk = '', sort = 'name', order = 'asc' }) {
    // Try DB-backed server-side query first (supports large datasets without loading all into memory)
    try {
        let conditions = []
        let params = []
        if (celebrationPoint) { conditions.push('celebration_point = ?'); params.push(celebrationPoint) }
        if (risk) { conditions.push('risk_category = ?'); params.push(risk) }
        if (search) {
            conditions.push('(name LIKE ? OR email LIKE ?)')
            params.push(`%${search}%`, `%${search}%`)
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
        const safeSortFields = { name: 'name', progress: 'progress', risk_score: 'risk_score', email: 'email' }
        const sortCol = safeSortFields[sort] || 'name'
        const sortDir = order === 'desc' ? 'DESC' : 'ASC'
        const offset = (page - 1) * limit

        const countRow = await dbGet(`SELECT COUNT(*) as n FROM thinkific_students ${where}`, params)
        const total = parseInt(countRow?.n || 0, 10)
        const rows = await dbAll(`SELECT * FROM thinkific_students ${where} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`, [...params, limit, offset])

        if (total > 0) {
            const users = rows.map(row => {
                const risk2 = calculateRiskScore(
                    { last_sign_in_at: row.last_sign_in_at },
                    { percentage_completed: (row.progress || 0) / 100, updated_at: row.enrollment_updated_at }
                )
                return {
                    id: row.student_id, userId: row.thinkific_user_id,
                    name: row.name, email: row.email,
                    celebration_point: row.celebration_point,
                    progress: row.progress || 0,
                    status: row.enrollment_status,
                    risk: risk2, risk_category: row.risk_category
                }
            })
            return { success: true, users, meta: { total, totalPages: Math.ceil(total / limit), currentPage: Number(page), limit: Number(limit) }, lastUpdated: cache.timestamp }
        }
    } catch (e) {
        console.warn('[thinkific] DB pagination failed, falling back to memory:', e.message)
    }

    // Fall back to in-memory
    if (!cache.data) loadCacheFromFile()
    let data = [...(cache.data || [])]
    if (celebrationPoint) data = data.filter(u => u.celebration_point === celebrationPoint)
    if (search) {
        const q = search.toLowerCase()
        data = data.filter(u => (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)))
    }
    if (risk) data = data.filter(u => u.risk_category === risk)
    const total = data.length
    const offset = (page - 1) * limit
    const users = data.slice(offset, offset + limit)
    return { success: true, users, meta: { total, totalPages: Math.ceil(total / limit), currentPage: Number(page), limit: Number(limit) }, lastUpdated: cache.timestamp }
}

export function getStudentById(id) {
    if (!cache.data) loadCache()
    return (cache.data || []).find(s => String(s.id) === String(id) || String(s.userId) === String(id))
}

async function loadCacheFromDB() {
    try {
        const rows = await dbAll('SELECT * FROM thinkific_students')
        if (rows && rows.length > 0) {
            cache.data = rows.map(row => {
                let raw = {}
                try { raw = JSON.parse(row.raw_data || '{}') } catch (_) {}
                const risk = calculateRiskScore(
                    { last_sign_in_at: row.last_sign_in_at, ...raw.user },
                    { percentage_completed: (row.progress || 0) / 100, updated_at: row.enrollment_updated_at, ...raw.enrollment }
                )
                return {
                    id: row.student_id,
                    userId: row.thinkific_user_id,
                    name: row.name,
                    email: row.email,
                    celebration_point: row.celebration_point,
                    progress: row.progress || 0,
                    status: row.enrollment_status,
                    lastActivity: row.last_sign_in_at,
                    joinedAt: row.enrollment_updated_at,
                    risk,
                    risk_category: row.risk_category || risk.category
                }
            })
            cache.timestamp = Date.now()
            console.log(`✅ Loaded ${cache.data.length} students from DB`)
            return true
        }
    } catch (e) { console.error('DB cache load failed:', e.message) }
    return false
}

function loadCacheFromFile() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
            if (saved.data) {
                cache = { ...cache, ...saved, duration: cache.duration }
                return true
            }
        }
    } catch (e) { console.error('File cache load failed:', e.message) }
    return false
}

function loadCache() {
    return loadCacheFromFile()
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

async function upsertStudent(student) {
    const upsertSql = IS_POSTGRES
        ? `INSERT INTO thinkific_students (student_id, thinkific_user_id, name, email, celebration_point, progress, risk_score, risk_category, last_sign_in_at, enrollment_updated_at, enrollment_status, raw_data, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
           ON CONFLICT(student_id) DO UPDATE SET
             thinkific_user_id=EXCLUDED.thinkific_user_id, name=EXCLUDED.name, email=EXCLUDED.email,
             celebration_point=EXCLUDED.celebration_point, progress=EXCLUDED.progress,
             risk_score=EXCLUDED.risk_score, risk_category=EXCLUDED.risk_category,
             last_sign_in_at=EXCLUDED.last_sign_in_at, enrollment_updated_at=EXCLUDED.enrollment_updated_at,
             enrollment_status=EXCLUDED.enrollment_status, raw_data=EXCLUDED.raw_data, updated_at=NOW()`
        : `INSERT OR REPLACE INTO thinkific_students (student_id, thinkific_user_id, name, email, celebration_point, progress, risk_score, risk_category, last_sign_in_at, enrollment_updated_at, enrollment_status, raw_data, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`

    await dbRun(upsertSql, [
        String(student.id), String(student.userId), student.name, student.email,
        student.celebration_point, student.progress, student.risk.score, student.risk.category,
        student.lastActivity || null, student.joinedAt || null, student.status || null,
        JSON.stringify({ user: student._rawUser, enrollment: student._rawEnrollment })
    ])
}

export async function doRefresh() {
    if (refreshPromise) return refreshPromise
    refreshPromise = (async () => {
        cache.isSyncing = true
        try {
            const client = await createClient()
            console.log('🔄 Syncing Thinkific students...')
            cache.lastSyncAttempt = Date.now()

            let users = []
            let page = 1
            while (page <= 100) {
                const res = await client.get('/users', { params: { page, limit: 50 } })
                users.push(...(res.data.items || []))
                if (page >= res.data.meta.pagination.total_pages) break
                page++
                await new Promise(r => setTimeout(r, 500))
            }

            let enrollments = []
            page = 1
            while (page <= 100) {
                const res = await client.get('/enrollments', { params: { page, limit: 50, 'query[product_id]': 3300782 } })
                enrollments.push(...(res.data.items || []))
                if (page >= res.data.meta.pagination.total_pages) break
                page++
                await new Promise(r => setTimeout(r, 500))
            }

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
                    joinedAt: e.created_at,
                    _rawUser: u,
                    _rawEnrollment: e
                }
                student.risk = calculateRiskScore(u, e)
                student.risk_category = student.risk.category
                return student
            })

            // Persist to DB
            for (const student of processed) {
                try { await upsertStudent(student) } catch (e) { console.warn('Upsert error:', e.message) }
            }

            // Strip internal raw fields for in-memory
            cache.data = processed.map(({ _rawUser, _rawEnrollment, ...s }) => s)
            cache.timestamp = Date.now()
            cache.lastSyncSuccess = Date.now()
            saveCache()
            const unknownCount = processed.filter(s => s.celebration_point === 'Unknown').length
            console.log(`✅ Sync complete: ${processed.length} students total. ${unknownCount} with unrecognized campus ('Unknown').`)
        } catch (error) {
            console.error('❌ Sync failed:', error.message, error.response?.data || '')
            cache.syncError = error.message
        } finally {
            cache.isSyncing = false
            refreshPromise = null
        }
    })()
    return refreshPromise
}

export function getStudentProgress(id) {
    const s = getStudentById(id)
    return s ? { progress: s.progress, status: s.status } : null
}

export async function preWarmCache() {
    // Priority: DB → file cache → background refresh
    const fromDB = await loadCacheFromDB()
    if (!fromDB) {
        // Load file cache and use file modification time as the sync timestamp
        try {
            if (fs.existsSync(CACHE_FILE)) {
                const stats = fs.statSync(CACHE_FILE)
                const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
                if (saved.data && Array.isArray(saved.data) && saved.data.length > 0) {
                    cache = { ...cache, ...saved, duration: cache.duration }
                    // Always use file mtime so status pill shows a real age instead of "Not synced"
                    if (!cache.timestamp || cache.timestamp === 0) {
                        cache.timestamp = stats.mtimeMs
                        cache.lastSyncSuccess = stats.mtimeMs
                    }
                    const ageMin = Math.round((Date.now() - stats.mtimeMs) / 60000)
                    console.log(`✅ Cache loaded from disk: ${saved.data.length} students, age: ${ageMin}min`)
                }
            }
        } catch (e) {
            console.warn('⚠️ preWarmCache file load error:', e.message)
        }
    }
    if (!cache.data || cache.data.length === 0 || (Date.now() - cache.timestamp > cache.duration)) {
        triggerRefresh()
    }
}

export function getCacheStatus() {
    const ts = cache.lastSyncSuccess || cache.timestamp || null
    return {
        isLoaded: !!cache.data,
        studentCount: cache.data?.length || 0,
        cacheSize: cache.data?.length || 0,
        // Fields the frontend SyncPill reads:
        lastSync: ts,
        syncing: cache.isSyncing || false,
        error: cache.syncError || null,
        isStale: ts ? (Date.now() - ts) > cache.duration : true,
        ageMinutes: ts ? Math.floor((Date.now() - ts) / 60000) : null,
        // Legacy fields kept for diagnostics page:
        lastSyncSuccess: cache.lastSyncSuccess,
        lastSyncAttempt: cache.lastSyncAttempt,
        syncError: cache.syncError,
    }
}

export function searchStudents(query, celebrationPoint = null) {
    if (!cache.data) loadCache()
    if (!cache.data) return []
    
    let results = cache.data
    if (celebrationPoint) {
        results = results.filter(s => s.celebration_point === celebrationPoint)
    }
    
    if (query) {
        const q = query.toLowerCase()
        results = results.filter(s => 
            (s.name && s.name.toLowerCase().includes(q)) || 
            (s.email && s.email.toLowerCase().includes(q))
        )
    }
    
    return results
}

export async function testConnection(apiKey, subdomain) {
    try {
        const client = axios.create({
            baseURL: `https://api.thinkific.com/api/public/v1`,
            headers: {
                'X-Auth-API-Key': apiKey,
                'X-Auth-Subdomain': subdomain,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        })
        const res = await client.get('/users', { params: { page: 1, limit: 1 } })
        return { success: true, message: 'Connection successful', userCount: res.data.meta.pagination.total_items }
    } catch (e) {
        return { success: false, message: e.response?.data?.error || e.message }
    }
}

export async function rawTestConnection() {
    try {
        const client = await createClient()
        const res = await client.get('/users', { params: { page: 1, limit: 1 } })
        return { success: true, ...res.data.meta.pagination }
    } catch (e) {
        return { success: false, message: e.message, status: e.response?.status }
    }
}

export async function getUnenrolledUsers(celebrationPoint = null) {
    try {
        const client = await createClient()
        let unenrolled = []
        let page = 1
        
        // This is a heavy operation, so we limit it to 5 pages for this check
        while (page <= 5) {
            const res = await client.get('/users', { params: { page, limit: 50 } })
            const users = res.data.items || []
            
            // Users who have a company (campus) set but might not be in our cache
            const candidates = users.filter(u => u.company)
            
            // Check enrollment status for each (optional, or just return them as candidates)
            unenrolled.push(...candidates.map(u => ({
                id: u.id,
                name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                email: u.email,
                celebration_point: normalizeCelebrationPoint(u.company)
            })))
            
            if (page >= res.data.meta.pagination.total_pages) break
            page++
        }

        if (celebrationPoint) {
            unenrolled = unenrolled.filter(u => u.celebration_point === celebrationPoint)
        }

        return { success: true, users: unenrolled }
    } catch (e) {
        console.error('Error fetching unenrolled users:', e.message)
        return { success: false, message: e.message }
    }
}

export async function enrollUser(userId) {
    try {
        const client = await createClient()
        const courseId = 3300782 // Leadership 101 Course ID
        
        const res = await client.post('/enrollments', {
            user_id: userId,
            course_id: courseId,
            activated_at: new Date().toISOString()
        })
        
        // Trigger a background refresh to pick up the new enrollment
        triggerRefresh()
        
        return { success: true, enrollment: res.data }
    } catch (e) {
        return { success: false, message: e.response?.data?.error || e.message }
    }
}

export async function createUser(firstName, lastName, email, celebrationPoint, password = null, sendWelcomeEmail = true) {
    try {
        const client = await createClient()
        const payload = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            company: celebrationPoint,
            send_welcome_email: sendWelcomeEmail
        }
        if (password) payload.password = password
        
        const res = await client.post('/users', payload)
        return { success: true, user: res.data }
    } catch (e) {
        return { success: false, message: e.response?.data?.error || e.message }
    }
}

export async function updateUser(userId, data) {
    try {
        const client = await createClient()
        const res = await client.put(`/users/${userId}`, data)
        return { success: true, user: res.data }
    } catch (e) {
        return { success: false, message: e.response?.data?.error || e.message }
    }
}

export function forceRefresh() {
    return doRefresh()
}

export async function processWebhookPayload(topic, payload) {
    console.log(`[Thinkific Webhook] Processing topic: ${topic}`)
    // Invalidate the in-memory cache so the next request fetches fresh data
    cache.timestamp = 0
    if (topic === 'enrollment.created' || topic === 'user.signup' || topic === 'course.progress.updated') {
        await doRefresh()
    }
}
