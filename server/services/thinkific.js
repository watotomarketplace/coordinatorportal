import axios from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { calculateRiskScore } from './risk.js'
import { dbGet, dbAll, dbRun, IS_POSTGRES } from '../db/init.js'
import { getThinkificCredentials } from './thinkific-common.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CACHE_FILE = path.join(__dirname, '../db/cache.json')

// Persistent TCP connections reduce handshake overhead on paginated requests
const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 10 })

// Retry with exponential backoff for transient network failures and 5xx errors
async function withRetry(fn, label = 'request', attempts = 3) {
    for (let i = 0; i < attempts; i++) {
        try { return await fn() }
        catch (err) {
            const isRetryable = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'].includes(err.code)
                || (err.response?.status >= 500)
            if (!isRetryable || i === attempts - 1) throw err
            const delay = 1000 * Math.pow(2, i)
            console.warn(`⚠️ [Thinkific] ${label} failed (attempt ${i + 1}/${attempts}), retrying in ${delay / 1000}s: ${err.message}`)
            await new Promise(r => setTimeout(r, delay))
        }
    }
}

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

/**
 * Single place that turns a Thinkific completion value into an integer 0–100.
 * Thinkific v1 returns `percentage_completed` as a 0–1 fraction ("0.88"); some
 * payloads already use 0–100. Accepts numbers and numeric strings.
 *   0.88 → 88 · 88 → 88 · "0.5" → 50 · 1 → 100 · null → 0
 * Returns 0 only when the source is genuinely zero/absent — never lets 0.88
 * silently collapse to 0.
 */
export function normalizeProgress(raw) {
    const n = typeof raw === 'number' ? raw : parseFloat(raw)
    if (!Number.isFinite(n) || n <= 0) return 0
    const pct = n <= 1 ? n * 100 : n   // ≤1 is a fraction (1 === 100%)
    return Math.max(0, Math.min(100, Math.round(pct)))
}

export function normalizeCelebrationPoint(raw) {
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
    const { apiKey, subdomain } = await getThinkificCredentials()
    return axios.create({
        baseURL: 'https://api.thinkific.com/api/public/v1',
        headers: {
            'X-Auth-API-Key': apiKey,
            'X-Auth-Subdomain': subdomain,
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
    const data = cache.data || []
    return { students: filterCP ? data.filter(s => s.celebration_point === filterCP) : data, lastUpdated: cache.timestamp }
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

// ─── Single shared student resolver ────────────────────────────────────────
// The one place that turns a member id (formation_group_members.student_id /
// group_members.student_thinkific_id) into a student record. Tries, in order:
//   1. in-memory cache (always fresh)      2. thinkific_students.thinkific_user_id
//   3. thinkific_students.student_id
// All comparisons are trimmed strings so integer-vs-TEXT and whitespace
// mismatches stop failing silently. Returns null (and logs once) if unresolved.
const _unresolvedLogged = new Set()

function toStudentShape(s) {
    if (!s) return null
    // Cache objects and thinkific_students rows use different field names.
    const progress = Number(s.progress) || 0
    return {
        id: String(s.id ?? s.student_id ?? '').trim(),
        userId: String(s.userId ?? s.thinkific_user_id ?? s.student_id ?? '').trim(),
        name: s.name || '',
        email: s.email || '',
        celebration_point: s.celebration_point || 'Unknown',
        progress,
        risk_score: s.risk_score ?? s.risk?.score ?? 0,
        risk_category: s.risk_category || s.risk?.category || 'Healthy',
    }
}

export async function resolveStudent(idLike, context = '') {
    const sid = String(idLike ?? '').trim()
    if (!sid) return null

    if (!cache.data) loadCache()
    const hit = (cache.data || []).find(s =>
        String(s.id ?? '').trim() === sid || String(s.userId ?? '').trim() === sid)
    if (hit) return toStudentShape(hit)

    try {
        let row = await dbGet('SELECT * FROM thinkific_students WHERE TRIM(thinkific_user_id) = ?', [sid])
        if (!row) row = await dbGet('SELECT * FROM thinkific_students WHERE TRIM(student_id) = ?', [sid])
        if (row) return toStudentShape(row)
    } catch (e) {
        console.warn('[resolveStudent] DB lookup failed:', e.message)
    }

    if (!_unresolvedLogged.has(sid)) {
        _unresolvedLogged.add(sid)
        console.warn(`[resolveStudent] no match for ${sid}${context ? ` (${context})` : ''}`)
    }
    return null
}

// Resolve many ids at once, dropping unresolved ones.
export async function resolveStudents(ids, context = '') {
    const out = []
    for (const id of (ids || [])) {
        const s = await resolveStudent(id, context)
        if (s) out.push(s)
    }
    return out
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

function saveCacheSync() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8')
    } catch (e) { console.warn('⚠️ Sync cache write failed:', e.message) }
}

let rawUserCache = []          // full /users array — used by diagnostics endpoints for lookups
let rawEnrollmentCount = 0    // total enrollments fetched — used to compute dropped count
export function getRawCache() { return rawUserCache }
export function getRawEnrollmentCount() { return rawEnrollmentCount }

let refreshPromise = null
function triggerRefresh() {
    if (refreshPromise) return
    doRefresh().catch(() => {})
}

async function upsertStudent(student) {
    const riskScore = student.risk?.score ?? student.risk_score ?? 0
    const riskCat   = student.risk?.category ?? student.risk_category ?? 'Healthy'
    const rawUser   = student._rawEnrollment?.user || null
    const params = [
        String(student.userId), String(student.userId), student.name, student.email,
        student.celebration_point, student.progress, riskScore, riskCat,
        student.last_sign_in_at || student.lastActivity || null,
        student.joinedAt || student.lastActivity || null,
        student.status || null,
        JSON.stringify({ user: rawUser, enrollment: student._rawEnrollment })
    ]

    if (IS_POSTGRES) {
        const upsertSql = `INSERT INTO thinkific_students (student_id, thinkific_user_id, name, email, celebration_point, progress, risk_score, risk_category, last_sign_in_at, enrollment_updated_at, enrollment_status, raw_data, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
           ON CONFLICT(student_id) DO UPDATE SET
             thinkific_user_id=EXCLUDED.thinkific_user_id, name=EXCLUDED.name, email=EXCLUDED.email,
             celebration_point=EXCLUDED.celebration_point, progress=EXCLUDED.progress,
             risk_score=EXCLUDED.risk_score, risk_category=EXCLUDED.risk_category,
             last_sign_in_at=EXCLUDED.last_sign_in_at, enrollment_updated_at=EXCLUDED.enrollment_updated_at,
             enrollment_status=EXCLUDED.enrollment_status, raw_data=EXCLUDED.raw_data, updated_at=NOW()`
        try {
            await dbRun(upsertSql, params)
        } catch (pgErr) {
            // ON CONFLICT may fail if prod schema predates student_id primary key — fall back to SELECT/INSERT/UPDATE
            const existing = await dbGet('SELECT student_id FROM thinkific_students WHERE student_id = $1', [String(student.userId)])
            if (!existing) {
                await dbRun(`INSERT INTO thinkific_students (student_id, thinkific_user_id, name, email, celebration_point, progress, risk_score, risk_category, last_sign_in_at, enrollment_updated_at, enrollment_status, raw_data, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`, params)
            } else {
                await dbRun(`UPDATE thinkific_students SET thinkific_user_id=$2, name=$3, email=$4, celebration_point=$5, progress=$6, risk_score=$7, risk_category=$8, last_sign_in_at=$9, enrollment_updated_at=$10, enrollment_status=$11, raw_data=$12, updated_at=NOW() WHERE student_id=$1`, params)
            }
        }
    } else {
        await dbRun(`INSERT OR REPLACE INTO thinkific_students (student_id, thinkific_user_id, name, email, celebration_point, progress, risk_score, risk_category, last_sign_in_at, enrollment_updated_at, enrollment_status, raw_data, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`, params)
    }
}

// processEnrollment — parse a v2 enrollment object (embedded user) into a portal student record
export function processEnrollment(enrollment) {
    if (!enrollment || typeof enrollment !== 'object') return null

    const user = enrollment.user
    if (!user || typeof user !== 'object') return null

    const firstName = (user.first_name || '').trim()
    const lastName  = (user.last_name  || '').trim()
    // v1 enrollment carries user_name as "First Last" — use as fallback if user object has no name
    const fallbackName = (enrollment.user_name || '').trim()
    const fullName  = [firstName, lastName].filter(Boolean).join(' ') || fallbackName

    if (!fullName) return null

    // v1 enrollment also carries user_email as fallback
    const email  = (user.email || enrollment.user_email || '').trim().toLowerCase()
    const userId = String(user.id || enrollment.user_id || '')
    if (!userId) return null

    const progress = normalizeProgress(enrollment.percentage_completed)

    const rawCampus      = (user.company || '').trim()
    const celebrationPoint = normalizeCelebrationPoint(rawCampus)
    const risk           = calculateRiskScore(user, enrollment)
    const lastActivity   = enrollment.updated_at || enrollment.created_at || null

    return {
        userId, id: userId,
        name: fullName, firstName, lastName,
        email: email || `no-email-${userId}@unknown`,
        campus: celebrationPoint,
        celebration_point: celebrationPoint,
        rawCampus,
        progress, percentage_completed: progress,
        enrollmentId: enrollment.id,
        courseId: enrollment.course_id,
        status: enrollment.activated_at ? 'active' : 'inactive',
        enrollmentStatus: enrollment.activated_at ? 'active' : 'inactive',
        risk_score: risk.score, risk_category: risk.category,
        risk,
        last_sign_in_at: user.last_sign_in_at || null,
        lastActivity,
        joinedAt: enrollment.created_at || null,
        daysInactive: lastActivity
            ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
            : 999,
        profileImage: user.avatar_url || null,
        thinkificId: userId,
        _rawEnrollment: enrollment,
    }
}

async function saveSyncReport(report) {
    try {
        const sql = IS_POSTGRES
            ? "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value"
            : "INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)"
        await dbRun(sql, ['last_thinkific_sync_report', JSON.stringify(report)])
    } catch (e) {
        console.warn('Could not save sync report:', e.message)
    }
}

export async function doRefresh() {
    if (refreshPromise) return refreshPromise
    refreshPromise = (async () => {
        cache.isSyncing = true
        cache.lastSyncAttempt = Date.now()
        console.log('🔄 Thinkific sync starting...')
        try {
            const { apiKey, subdomain } = await getThinkificCredentials()

            // Fix 1: Check for last full sync to enable incremental mode
            const lastSyncRow = await dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_last_full_sync'")
            const lastSyncMs = lastSyncRow?.value ? parseInt(lastSyncRow.value, 10) : 0
            const ageMs = Date.now() - lastSyncMs
            const isIncremental = lastSyncMs > 0 && ageMs < 30 * 60 * 1000 // incremental if last sync < 30 min ago
            const updatedAfterISO = isIncremental
                ? new Date(lastSyncMs - 2 * 60 * 1000).toISOString() // 2-min buffer to avoid gaps
                : null
            if (isIncremental) {
                console.log(`🔄 Incremental sync: fetching enrollments updated since ${updatedAfterISO}`)
            }

            const allEnrollments = []
            let page = 1
            let hasMore = true
            let totalFromApi = null

            while (hasMore) {
                const response = await withRetry(() => axios.get(
                    'https://api.thinkific.com/api/public/v1/enrollments',
                    {
                        headers: {
                            'X-Auth-API-Key': apiKey,
                            'X-Auth-Subdomain': subdomain,
                            'Content-Type': 'application/json',
                        },
                        params: updatedAfterISO
                            ? { page, limit: 250, 'query[updated_at_gte]': updatedAfterISO }
                            : { page, limit: 250 },
                        timeout: 120000,
                        httpsAgent: keepAliveAgent,
                    }
                ), `enrollments page ${page}`)

                const items = response.data?.items || response.data?.data || []
                allEnrollments.push(...items)

                const pagination = response.data?.meta?.pagination || response.data?.pagination || null

                if (page === 1) {
                    console.log('📋 Enrollment pagination shape:', JSON.stringify({
                        pagination, keys: pagination ? Object.keys(pagination) : 'none'
                    }))
                    if (pagination) {
                        // Thinkific v1 uses total_entries (not total) and total_pages (not num_pages)
                        totalFromApi = pagination.total_entries || pagination.total || null
                        const totalPages = pagination.total_pages || pagination.num_pages || null
                        if (totalFromApi) console.log(`📊 Thinkific reports ${totalFromApi} total enrollments across ${totalPages ?? '?'} pages`)
                        else if (totalPages) console.log(`📊 Thinkific reports ${totalPages} enrollment pages`)
                    }
                    if (items.length > 0) {
                        const s = items[0]
                        console.log('📋 Enrollment record shape:', JSON.stringify({
                            keys: Object.keys(s), course_id: s.course_id,
                            course_name: s.course_name, has_user: !!s.user,
                        }))
                    }
                }

                const enrollTotalPages = pagination?.total_pages || pagination?.num_pages || null
                const reachedTotalPages = enrollTotalPages !== null && page >= enrollTotalPages
                const isLastPage = items.length === 0 || items.length < 250 || reachedTotalPages
                hasMore = !isLastPage
                page++

                if (page > 100) {
                    console.warn('⚠️ Hit 100-page safety limit — stopping')
                    hasMore = false
                }

                if (hasMore) await new Promise(r => setTimeout(r, 150))
            }

            console.log(`📥 Fetched ${allEnrollments.length} total enrollments`)
            rawEnrollmentCount = allEnrollments.length

            // Fetch all users separately — v1 enrollments are flat (no embedded user object)
            console.log('👥 Fetching all users from Thinkific...')
            const allUsers = []
            let userPage = 1
            let userTotalPages = null

            while (true) {
                const userRes = await withRetry(() => axios.get(
                    'https://api.thinkific.com/api/public/v1/users',
                    {
                        headers: { 'X-Auth-API-Key': apiKey, 'X-Auth-Subdomain': subdomain },
                        params: { page: userPage, limit: 250 },
                        timeout: 120000,
                        httpsAgent: keepAliveAgent,
                    }
                ), `users page ${userPage}`)
                const users = userRes.data?.items || userRes.data?.data || []
                allUsers.push(...users)

                if (userPage === 1) {
                    const up = userRes.data?.meta?.pagination || userRes.data?.pagination || null
                    console.log('👥 User pagination shape:', JSON.stringify({
                        pagination: up, keys: up ? Object.keys(up) : 'none', itemsOnPage1: users.length
                    }))
                    if (up) {
                        // Thinkific v1 uses total_pages (not num_pages)
                        userTotalPages = up.total_pages || up.num_pages || up.pages || null
                        if (userTotalPages === null && up.total_entries && users.length > 0) {
                            userTotalPages = Math.ceil(up.total_entries / users.length)
                        } else if (userTotalPages === null && up.total && users.length > 0) {
                            userTotalPages = Math.ceil(up.total / users.length)
                        }
                    }
                    console.log(`👥 User pages to fetch: ${userTotalPages ?? 'unknown (using item-count stop)'}`)
                }

                console.log(`👥 Fetched page ${userPage}: ${users.length} users (total so far: ${allUsers.length})`)

                // Three independent stop conditions — any one is sufficient
                const reachedTotalPages = userTotalPages !== null && userPage >= userTotalPages
                const pageNotFull = users.length < 250
                const noItems = users.length === 0

                if (reachedTotalPages || pageNotFull || noItems) {
                    console.log(`👥 User fetch complete. Reason: ${
                        noItems ? 'empty page' :
                        pageNotFull ? `partial page (${users.length}/250)` :
                        `reached total pages (${userTotalPages})`
                    }`)
                    break
                }

                userPage++
                if (userPage > 100) { console.warn('⚠️ Safety limit: stopping user fetch at 100 pages'); break }
                await new Promise(r => setTimeout(r, 150))
            }

            console.log(`👥 Total users fetched: ${allUsers.length} across ${userPage} page(s) (of ${userTotalPages ?? '?'} total)`)
            rawUserCache = allUsers

            // Build lookup map and attach user to each enrollment
            const userMap = new Map(allUsers.map(u => [String(u.id), u]))
            let noUserCount = 0
            allEnrollments.forEach(e => {
                const u = userMap.get(String(e.user_id))
                if (u) { e.user = u } else { noUserCount++ }
            })
            if (noUserCount > 0) {
                console.warn(`⚠️ ${noUserCount} enrollments had no matching user (deleted/deactivated Thinkific accounts)`)
            }

            // Filter to WL101 by course name — catches bundle enrollments that course_id filter misses
            const wl101Enrollments = allEnrollments.filter(e => {
                const name = (e.course_name || e.product_name || '').toLowerCase()
                return (
                    name.includes('leadership 101') ||
                    name.includes('wl101') ||
                    name.includes('watoto leadership')
                )
            })

            // Safety: if name filter yields 0, fall back to all enrollments and warn
            const toProcess = wl101Enrollments.length > 0 ? wl101Enrollments : allEnrollments
            if (wl101Enrollments.length === 0) {
                console.warn(`⚠️ Course name filter returned 0 — using all ${allEnrollments.length} enrollments`)
                console.warn('⚠️ Check that enrollment records include a course_name field matching "Leadership 101"')
            }

            const processed = toProcess.map(processEnrollment).filter(Boolean)

            // Deduplicate by userId keeping highest progress — re-enrollments can reset to 0%
            const byUserId = new Map()
            for (const s of processed) {
                const cur = byUserId.get(String(s.userId))
                if (!cur || s.progress > cur.progress) byUserId.set(String(s.userId), s)
            }
            const deduped = [...byUserId.values()]
            if (deduped.length < processed.length) {
                console.log(`♻️  Deduped ${processed.length - deduped.length} duplicate enrollment(s) — kept highest progress per student`)
            }

            // Persist to DB
            for (const student of deduped) {
                try { await upsertStudent(student) } catch (e) { console.warn('Upsert error:', e.message) }
            }

            // Strip internal raw fields for in-memory storage
            const cleaned = deduped.map(({ _rawEnrollment, ...s }) => s)
            if (isIncremental && cache.data && cache.data.length > 0) {
                // Merge: update changed students, preserve others
                const existing = new Map(cache.data.map(s => [String(s.userId), s]))
                for (const s of cleaned) existing.set(String(s.userId), s)
                cache.data = [...existing.values()]
            } else {
                cache.data = cleaned
            }

            // Re-apply manual campus overrides so assignments survive full syncs
            const overrides = await getCampusOverrides()
            if (Object.keys(overrides).length > 0) {
                cache.data = cache.data.map(s =>
                    overrides[String(s.userId)]
                        ? { ...s, celebration_point: overrides[String(s.userId)], campusOverridden: true }
                        : s
                )
            }

            cache.timestamp     = Date.now()
            cache.lastSyncSuccess = Date.now()
            cache.syncError     = null
            saveCache()

            // Fix 1: Persist sync timestamp for incremental mode on next run
            if (!isIncremental) {
                const upsertTs = IS_POSTGRES
                    ? "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value"
                    : "INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)"
                await dbRun(upsertTs, ['thinkific_last_full_sync', String(cache.timestamp)]).catch(() => {})
            }

            const dropped       = toProcess.length - deduped.length
            const unknownCampus = deduped.filter(s => s.celebration_point === 'Unknown').length

            console.log(`✅ Thinkific sync complete:
  Total fetched:      ${allEnrollments.length}
  WL101 filtered:     ${wl101Enrollments.length}
  Processed:          ${deduped.length}
  Dropped (invalid):  ${dropped}
  Unknown campus:     ${unknownCampus}`)

            await saveSyncReport({
                timestamp: cache.timestamp,
                rawFetched: allEnrollments.length,
                wl101Count: wl101Enrollments.length,
                processed: deduped.length,
                dropped,
                unknownCampus,
            })

        } catch (error) {
            console.error('❌ Sync failed:', error.message, error.response?.data || '')
            cache.syncError = error.message
            // Never clear cache.data on failure — keep serving last known good data
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
    console.log('🔥 Pre-warming Thinkific cache...')
    let fileAgeMs = Infinity
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const stats = fs.statSync(CACHE_FILE)
            fileAgeMs = Date.now() - stats.mtimeMs
            const raw    = fs.readFileSync(CACHE_FILE, 'utf8')
            const parsed = JSON.parse(raw)

            // Support both {data:[]} and raw array formats
            const data = Array.isArray(parsed) ? parsed : (parsed.data || [])
            if (data.length > 0) {
                cache.data = data
                cache.timestamp       = stats.mtimeMs // use file mtime — fixes "Not synced" display
                cache.lastSyncSuccess = stats.mtimeMs

                // Apply campus overrides immediately so boot state is correct
                const overrides = await getCampusOverrides()
                if (Object.keys(overrides).length > 0) {
                    cache.data = cache.data.map(s =>
                        overrides[String(s.userId)]
                            ? { ...s, celebration_point: overrides[String(s.userId)], campusOverridden: true }
                            : s
                    )
                }

                console.log(`✅ Cache loaded from disk: ${data.length} students (${Math.floor(fileAgeMs / 60000)}min old)`)

                if (fileAgeMs < 10 * 60_000) {
                    // Fresh enough — sync in background after 30s to avoid hammering API on boot
                    setTimeout(() => doRefresh().catch(console.error), 30_000)
                    return
                }
            }
        }
    } catch (e) {
        console.warn('⚠️ preWarmCache error:', e.message)
    }

    // Try DB as fallback if file was missing/stale/empty
    if (!cache.data || cache.data.length === 0) {
        const fromDB = await loadCacheFromDB()
        if (fromDB) {
            const overrides = await getCampusOverrides()
            if (Object.keys(overrides).length > 0) {
                cache.data = cache.data.map(s =>
                    overrides[String(s.userId)]
                        ? { ...s, celebration_point: overrides[String(s.userId)], campusOverridden: true }
                        : s
                )
            }
        }
    }

    // Stale or missing — sync immediately but non-blocking
    doRefresh().catch(err => console.error('❌ Boot sync failed:', err.message))
}

export function getCacheStatus() {
    const ts = cache.lastSyncSuccess || cache.timestamp || null
    const students = cache.data || []
    return {
        isLoaded: !!cache.data,
        studentCount: students.length,
        cacheSize: students.length,
        // Fields the frontend SyncPill reads:
        lastSync: ts,
        syncing: cache.isSyncing || false,
        error: cache.syncError || null,
        isStale: ts ? (Date.now() - ts) > cache.duration : true,
        ageMinutes: ts ? Math.floor((Date.now() - ts) / 60000) : null,
        // Data quality metrics (populated after first sync):
        unknownCount: students.filter(s => !s.name || s.name === 'Unknown').length,
        unknownCampusCount: students.filter(s => s.celebration_point === 'Unknown').length,
        droppedCount: rawEnrollmentCount > 0 ? rawEnrollmentCount - students.length : null,
        // Legacy fields for diagnostics page:
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
            (s.firstName && s.firstName.toLowerCase().includes(q)) ||
            (s.lastName && s.lastName.toLowerCase().includes(q)) ||
            (s.email && s.email.toLowerCase().includes(q)) ||
            (s.email && s.email.split('@')[0].toLowerCase().includes(q)) ||
            (s.userId && String(s.userId).includes(q))
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

export async function getCampusOverrides() {
    try {
        const rows = await dbAll('SELECT thinkific_user_id, campus FROM student_campus_overrides')
        return Object.fromEntries(rows.map(r => [r.thinkific_user_id, r.campus]))
    } catch (_) {
        return {}
    }
}

export async function updateStudentCampus(thinkificUserId, campus) {
    const id = String(thinkificUserId)
    if (cache.data) {
        const student = cache.data.find(s => String(s.userId) === id)
        if (student) {
            student.campus = campus
            student.celebration_point = campus
            student.campusOverridden = true
        }
    }
    try {
        const sql = IS_POSTGRES
            ? 'UPDATE thinkific_students SET celebration_point=$1 WHERE thinkific_user_id=$2'
            : 'UPDATE thinkific_students SET celebration_point=? WHERE thinkific_user_id=?'
        await dbRun(sql, [campus, id])
    } catch (e) {
        console.warn('[thinkific] updateStudentCampus DB error:', e.message)
    }
}

function persistCacheAsync() {
    setImmediate(() => {
        try {
            fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8')
        } catch (e) {
            console.warn('⚠️ Async cache persist failed:', e.message)
        }
    })
}

// processFullUser — fetch user + enrollments from Thinkific API and insert into cache + DB.
// Used by updateSingleStudent when allowInsert=true and the user is not already in cache.
async function processFullUser(userId) {
    try {
        const client = await createClient()
        const [userRes, enrollRes] = await Promise.all([
            client.get(`/users/${userId}`),
            client.get('/enrollments', { params: { 'query[user_id]': userId, limit: 10 }, timeout: 20000 })
        ])
        const user = userRes.data
        const enrollments = enrollRes.data?.items || []

        const wl101 = enrollments.find(e => {
            const name = (e.course_name || e.product_name || '').toLowerCase()
            return name.includes('leadership 101') || name.includes('wl101') || name.includes('watoto leadership')
        })
        if (!wl101) {
            console.log(`📡 processFullUser: user ${userId} has no WL101 enrollment — skipping`)
            return null
        }

        wl101.user = user
        const student = processEnrollment(wl101)
        if (!student) return null

        const { _rawEnrollment, ...clean } = student
        cache.data = cache.data || []
        const idx = cache.data.findIndex(s => String(s.userId) === String(userId))
        if (idx === -1) {
            cache.data.push(clean)
        } else {
            cache.data[idx] = clean
        }
        cache.timestamp = Date.now()
        persistCacheAsync()

        try { await upsertStudent(student) } catch (e) { console.warn('[thinkific] processFullUser upsert error:', e.message) }
        console.log(`✅ processFullUser: inserted student ${clean.name} (userId=${userId})`)
        return clean
    } catch (e) {
        console.warn(`⚠️ processFullUser(${userId}) failed:`, e.message)
        return null
    }
}

// updateSingleStudent — update one student in-memory from a webhook payload without full refresh.
// enrollmentData: the enrollment resource object from the webhook (progress, status, etc.)
// userData: the user resource object from the webhook (name, email, company, etc.)
// options.fromWebhook: use synchronous cache write (prevents data loss if process restarts)
// options.allowInsert: if user not in cache, fetch from API and insert (for user.created events)
export async function updateSingleStudent(userId, enrollmentData = null, userData = null, options = {}) {
    if (!cache.data) return
    const userIdStr = String(userId)
    const idx = cache.data.findIndex(s => String(s.userId) === userIdStr)
    if (idx === -1) {
        if (options.allowInsert) {
            console.log(`📡 updateSingleStudent: user ${userId} not in cache — inserting via processFullUser`)
            await processFullUser(userId)
            return
        }
        console.log(`📡 updateSingleStudent: user ${userId} not in cache — scheduling refresh`)
        scheduleDebounceRefresh()
        return
    }

    const existing = { ...cache.data[idx] }

    if (enrollmentData) {
        const progress = normalizeProgress(enrollmentData.percentage_completed)
        existing.progress = progress
        existing.percentage_completed = progress
        existing.lastActivity = enrollmentData.updated_at || existing.lastActivity
        const risk = calculateRiskScore({ last_sign_in_at: existing.last_sign_in_at }, enrollmentData)
        existing.risk_score = risk.score
        existing.risk_category = risk.category
        existing.risk = risk
    }

    if (userData) {
        const firstName = (userData.first_name || '').trim()
        const lastName  = (userData.last_name  || '').trim()
        const fullName  = [firstName, lastName].filter(Boolean).join(' ')
        if (fullName) { existing.name = fullName; existing.firstName = firstName; existing.lastName = lastName }
        if (userData.email) existing.email = userData.email.toLowerCase().trim()
        if (userData.company && !existing.campusOverridden) {
            const newCampus = normalizeCelebrationPoint(userData.company)
            existing.campus = newCampus
            existing.celebration_point = newCampus
        }
        if (userData.last_sign_in_at) existing.last_sign_in_at = userData.last_sign_in_at
    }

    cache.data = [...cache.data]
    cache.data[idx] = existing
    cache.timestamp = Date.now()
    if (options.fromWebhook) {
        saveCacheSync()
    } else {
        persistCacheAsync()
    }

    try {
        const sql = IS_POSTGRES
            ? 'UPDATE thinkific_students SET progress=$1, celebration_point=$2, enrollment_status=$3, risk_score=$4, risk_category=$5, updated_at=NOW() WHERE thinkific_user_id=$6'
            : 'UPDATE thinkific_students SET progress=?, celebration_point=?, enrollment_status=?, risk_score=?, risk_category=?, updated_at=CURRENT_TIMESTAMP WHERE thinkific_user_id=?'
        await dbRun(sql, [existing.progress, existing.celebration_point, existing.status, existing.risk_score, existing.risk_category, userIdStr])
    } catch (e) {
        console.warn('[thinkific] updateSingleStudent DB error:', e.message)
    }
}

let debounceTimer = null
export function scheduleDebounceRefresh(delayMs = 30000) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        debounceTimer = null
        doRefresh().catch(() => {})
    }, delayMs)
}

export async function processWebhookPayload(topic, payload) {
    console.log(`[Thinkific Webhook] Processing topic: ${topic}`)
    // Invalidate the in-memory cache so the next request fetches fresh data
    cache.timestamp = 0
    if (topic === 'enrollment.created' || topic === 'user.signup' || topic === 'course.progress.updated') {
        await doRefresh()
    }
}
