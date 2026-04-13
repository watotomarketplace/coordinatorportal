import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { calculateRiskScore } from './risk.js'
const CACHE_FILE = path.join(__dirname, '../db/cache.json')

// ═══════════════════════════════════════════════════════
// CACHE — ALWAYS serves data, NEVER returns empty
// ═══════════════════════════════════════════════════════
let cache = {
    data: null, // Enrolled students
    unenrolled: [], // Potential students
    timestamp: 0,
    lastSyncAttempt: 0,
    lastSyncSuccess: 0,
    syncError: null,
    duration: 1 * 60 * 1000 // 1 minute — near-real-time data
}

// ═══════════════════════════════════════════════════════
// THINKIFIC API CLIENT
// ═══════════════════════════════════════════════════════
import { dbGet } from '../db/init.js'

async function getThinkificConfig() {
    try {
        const apiKeyRow = await dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_api_key'")
        const subdomainRow = await dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_subdomain'")
        
        const apiKey = apiKeyRow?.value || process.env.THINKIFIC_API_KEY
        const subdomain = subdomainRow?.value || process.env.THINKIFIC_SUBDOMAIN
        
        return { apiKey, subdomain }
    } catch (err) {
        return { apiKey: process.env.THINKIFIC_API_KEY, subdomain: process.env.THINKIFIC_SUBDOMAIN }
    }
}

async function createClient() {
    const { apiKey, subdomain } = await getThinkificConfig()
    
    return axios.create({
        baseURL: `https://api.thinkific.com/api/public/v1`,
        headers: {
            'X-Auth-API-Key': apiKey,
            'X-Auth-Subdomain': subdomain,
            'Content-Type': 'application/json'
        },
        timeout: 15000
    })
}

// ═══════════════════════════════════════════════════════
// CELEBRATION POINT NORMALIZATION
// ═══════════════════════════════════════════════════════
const CELEBRATION_POINT_MAPPING = {
    'Ntinda': 'Ntinda', 'Bweyogerere': 'Bweyogerere', 'Downtown': 'Downtown',
    'Lubowa': 'Lubowa', 'Kansanga': 'Kansanga', 'Bugolobi': 'Bugolobi',
    'Nakwero': 'Nakwero', 'Mbarara': 'Mbarara', 'Suubi': 'Suubi',
    'Nansana': 'Nansana', 'Jinja': 'Jinja', 'Kyengera': 'Kyengera',
    'Mukono': 'Mukono', 'Juba': 'Juba', 'Online': 'Online',
    'Bbira': 'Bbira', 'Gulu': 'Gulu', 'Laminadera': 'Laminadera',
    'Entebbe': 'Entebbe',
    // Legacy prefixed values
    'Watoto Church Bbira': 'Bbira', 'Watoto Church Bugolobi': 'Bugolobi',
    'Watoto Church Bweyogerere': 'Bweyogerere', 'Watoto Church Downtown': 'Downtown',
    'Watoto Church Entebbe': 'Entebbe', 'Watoto Church Gayaza–Nakwero': 'Nakwero',
    'Gayaza-Nakwero': 'Nakwero', 'Watoto Church Gulu': 'Gulu',
    'Watoto Church Jinja': 'Jinja', 'Watoto Church Juba': 'Juba',
    'Watoto Church Kansanga': 'Kansanga', 'Watoto Church Kyengera': 'Kyengera',
    'Watoto Church Laminadera': 'Laminadera', 'Watoto Church Lubowa': 'Lubowa',
    'Watoto Church Mbarara': 'Mbarara', 'Watoto Church Mukono': 'Mukono',
    'Watoto Church Nansana, Wakiso': 'Nansana', 'Nansana, Wakiso': 'Nansana',
    'Watoto Church Ntinda': 'Ntinda', 'Watoto Church Suubi': 'Suubi',
    // Edge cases
    'Watoto Church': 'Downtown', 'Watoto': 'Downtown',
    'Watoto Church Ministries': 'Downtown', 'Watoto church': 'Downtown',
    'Watoto church Bbira': 'Bbira', 'Online Campus': 'Online',
    'The DAD Base, Ntinda': 'Ntinda', 'Watoto childcare ministries': 'Downtown',
}

const VALID_CELEBRATION_POINTS = [
    'Bbira', 'Bugolobi', 'Bweyogerere', 'Downtown', 'Entebbe',
    'Nakwero', 'Gulu', 'Jinja', 'Juba', 'Kansanga', 'Kyengera',
    'Laminadera', 'Lubowa', 'Mbarara', 'Mukono', 'Nansana',
    'Ntinda', 'Online', 'Suubi'
]

function normalizeCelebrationPoint(rawCompany) {
    if (!rawCompany || rawCompany.trim() === '') return 'Unknown'
    const trimmed = rawCompany.trim()
    if (CELEBRATION_POINT_MAPPING[trimmed]) return CELEBRATION_POINT_MAPPING[trimmed]
    let cleaned = trimmed.replace(/watoto\s+church\s*/gi, '').trim()
    if (cleaned.length === 0) return 'Downtown'
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
    const match = VALID_CELEBRATION_POINTS.find(p => p.toLowerCase() === cleaned.toLowerCase())
    if (match) return match
    return 'Unknown'
}

// ═══════════════════════════════════════════════════════
// DATA FETCHING — Rate-limit aware
// ═══════════════════════════════════════════════════════
async function fetchAllPages(endpoint, params = {}) {
    const client = await createClient()
    let allItems = []

    try {
        const firstRes = await client.get(endpoint, {
            params: { ...params, page: 1, limit: 50 }
        })
        const dataPayload = firstRes.data;
        allItems = [...(dataPayload.items || [])]
        
        // Safely extract total pages from Thinkific's raw payload
        const rawMeta = dataPayload.meta;
        const totalPages = rawMeta?.pagination?.total_pages || rawMeta?.total_pages || 1;
        const totalItems = rawMeta?.pagination?.total_items || rawMeta?.total_items || allItems.length;
        console.log(`   📄 ${endpoint}: ${totalItems} items, ${totalPages} pages found.`);

        if (totalPages > 1) {
            const pages = []
            for (let i = 2; i <= totalPages; i++) pages.push(i)

            // Sequential fetch — BATCH_SIZE 1 — respect rate limits conservatively
            const BATCH_SIZE = 1
            for (let b = 0; b < pages.length; b += BATCH_SIZE) {
                const batch = pages.slice(b, b + BATCH_SIZE)
                const promises = batch.map(async (page) => {
                    for (let attempt = 1; attempt <= 7; attempt++) {
                        try {
                            const res = await client.get(endpoint, {
                                params: { ...params, page, limit: 50 }
                            })
                            return res.data.items || []
                        } catch (err) {
                            const is429 = err.response?.status === 429
                            const retryAfter = err.response?.headers['retry-after']
                            // Wait exponentially: 15s, 30s, 60s... or use Retry-After header
                            let wait = is429 ? (retryAfter ? parseInt(retryAfter) * 1000 : 15000 * Math.pow(2, attempt - 1)) : 2000 * attempt
                            // Cap at 2 minutes
                            wait = Math.min(wait, 120000)

                            if (attempt < 7) {
                                console.warn(`   ⚠️ ${endpoint} p${page} try ${attempt}/7 (${is429 ? 'rate-limited' : 'error'}, wait ${Math.round(wait / 1000)}s)`)
                                await new Promise(r => setTimeout(r, wait))
                            } else {
                                console.error(`   ❌ ${endpoint} p${page} FAILED after 7 attempts`)
                                return []
                            }
                        }
                    }
                })
                const results = await Promise.all(promises)
                results.forEach(items => { if (items) allItems.push(...items) })

                // 4s delay between individual requests to stay under burst limits
                if (b + BATCH_SIZE < pages.length) {
                    await new Promise(r => setTimeout(r, 4000))
                }
            }
        }

        if (allItems.length < totalItems) {
            console.warn(`   ⚠️ ${endpoint}: Got ${allItems.length}/${totalItems}`)
        } else {
            console.log(`   ✅ ${endpoint}: All ${allItems.length} fetched`)
        }
    } catch (error) {
        if (error.response?.status === 401) {
            console.error(`   ❌ ${endpoint} 401 Unauthorized. Disabling sync until credentials updated.`)
            cache.syncError = '401 Unauthorized - Check API Keys'
            throw error // Hard fail
        }
        console.error(`   ❌ ${endpoint} failed: ${error.message}`)
    }

    return allItems
}

// ═══════════════════════════════════════════════════════
// CACHE MANAGEMENT
// ═══════════════════════════════════════════════════════
function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const raw = fs.readFileSync(CACHE_FILE, 'utf8')
            const saved = JSON.parse(raw)
            if (saved.data && saved.data.length > 0 && saved.timestamp) {
                cache = { ...saved, duration: cache.duration }
                console.log(`✅ Loaded ${saved.data.length} records from disk cache (age: ${Math.round((Date.now() - saved.timestamp) / 1000)}s)`)
                return true
            }
        }
    } catch (error) {
        console.error('Failed to load disk cache:', error.message)
    }
    return false
}

function saveCache() {
    try {
        const tmpPath = CACHE_FILE + '.tmp'
        fs.writeFileSync(tmpPath, JSON.stringify(cache), 'utf8')
        fs.renameSync(tmpPath, CACHE_FILE) // Atomic write
        console.log(`💾 Saved ${cache.data.length} records to disk cache`)
    } catch (error) {
        console.error('Failed to save disk cache:', error.message)
    }
}

// ═══════════════════════════════════════════════════════
// MAIN DATA FUNCTION — NEVER returns empty if data exists
// ═══════════════════════════════════════════════════════
export async function getStudentData(filterCelebrationPoint = null) {
    // Step 1: Load from disk if memory is empty
    if (!cache.data) {
        loadCache()
    }

    // Step 2: If we have data (fresh or stale), ALWAYS return it
    if (cache.data && cache.data.length > 0) {
        // Trigger background refresh if stale
        if (Date.now() - cache.timestamp > cache.duration) {
            triggerBackgroundRefresh()
        }
        return {
            students: filterData(cache.data, filterCelebrationPoint),
            lastUpdated: cache.timestamp
        }
    }

    // Step 3: No data at all — trigger refresh but DON'T block for minutes
    if (!refreshPromise) {
        console.log('🆕 No cached data found — starting background fetch...')
        doRefresh().catch(err => console.error('❌ First-run sync failed:', err.message))
    }

    return {
        students: [],
        lastUpdated: 0,
        syncing: true // Signal to frontend that data is coming
    }
}

export async function getUnenrolledUsers(filterCelebrationPoint = null) {
    // Ensure cache is loaded
    if (!cache.data) loadCache()

    // Trigger refresh if stale or empty
    if (!cache.data || (Date.now() - cache.timestamp > cache.duration)) {
        // If critical (no data), await refresh, otherwise background
        if (!cache.data) await doRefresh()
        else triggerBackgroundRefresh()
    }

    return {
        users: filterData(cache.unenrolled || [], filterCelebrationPoint),
        lastUpdated: cache.timestamp
    }
}

// ═══════════════════════════════════════════════════════
// PAGINATED DATA ACCESS (Server-Side Filtering)
// ═══════════════════════════════════════════════════════
export async function getPaginatedUsers({ page = 1, limit = 50, type = 'enrolled', search = '', celebrationPoint = '', date = '', noCompany = false, source = 'all', risk = '' }) {
    // Ensure cache is loaded
    if (!cache.data) loadCache()

    // Trigger refresh if empty
    if (!cache.data) await doRefresh()
    else if (Date.now() - cache.timestamp > cache.duration) triggerBackgroundRefresh()

    let data = []

    // 1. Select Source Data
    if (type === 'enrolled') {
        data = cache.data || []
    } else if (type === 'unenrolled') {
        data = cache.unenrolled || []
    } else if (type === 'all') {
        // Merge and tag
        const enrolled = (cache.data || []).map(s => ({ ...s, type: 'enrolled' }))
        const unenrolled = (cache.unenrolled || []).map(u => ({ ...u, type: 'unenrolled' }))
        data = [...enrolled, ...unenrolled]
    }

    // 2. Apply Filters
    // Celebration Point
    if (celebrationPoint) {
        data = data.filter(u => u.celebration_point === celebrationPoint)
    }

    // Search
    if (search) {
        const q = search.toLowerCase()
        data = data.filter(u =>
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.first_name && u.first_name.toLowerCase().includes(q)) ||
            (u.last_name && u.last_name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.course && u.course.toLowerCase().includes(q))
        )
    }

    // Date (Created Before)
    if (date) {
        data = data.filter(u => u.created_at && u.created_at.split('T')[0] <= date)
    }

    // No Company
    if (noCompany) {
        data = data.filter(u => u.celebration_point === 'Unknown')
    }

    // Source
    if (source !== 'all') {
        data = data.filter(u => {
            if (source === 'import') return !!u.external_source
            if (source === 'thinkific') return !u.external_source
            return true
        })
    }

    // Risk
    if (risk) {
        data = data.filter(u => u.risk && u.risk.category === risk)
    }

    // 3. Sort (Default: most recent activity or creation)
    // For 'all', might be mixed. Let's sort by name for consistency or ID?
    // Let's sort created_at desc if available, else name
    data.sort((a, b) => {
        const dateA = a.created_at || ''
        const dateB = b.created_at || ''
        return dateB.localeCompare(dateA) || a.name.localeCompare(b.name)
    })

    // 4. Paginate
    const total = data.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedData = data.slice(offset, offset + limit)

    return {
        success: true,
        users: paginatedData,
        meta: {
            total,
            totalPages,
            currentPage: Number(page),
            limit: Number(limit)
        },
        lastUpdated: cache.timestamp
    }
}

function filterData(data, point) {
    if (!data) return []
    if (point) return data.filter(s => s.celebration_point === point)
    return [...data] // Return copy to prevent mutation
}

// ═══════════════════════════════════════════════════════
// DATA REFRESH — Promise-based locking (Deduplication)
// ═══════════════════════════════════════════════════════
let refreshPromise = null

async function triggerBackgroundRefresh(fullSync = false) {
    // If a refresh is already in progress, we don't need to start another one
    // unless we want to queue it? For now, joining the current one is enough.
    if (refreshPromise) return
    console.log(`⏳ Stale cache — background refresh starting (${fullSync ? 'FULL' : 'INCREMENTAL'})...`)
    doRefresh(fullSync).catch(err => console.error('❌ Background refresh failed:', err.message))
}

async function doRefresh(fullSync = false) {
    // If a refresh is already running, return the existing promise
    if (refreshPromise) {
        console.log('⏳ Refresh already running, joining existing request...')
        return refreshPromise
    }

    // Create a new promise for this refresh cycle
    // If fullSync is requested, or if we have no data, do a full refresh
    // Otherwise, try incremental
    const lastSync = cache.timestamp
    const isIncremental = !fullSync && lastSync > 0
    const since = isIncremental ? new Date(lastSync).toISOString() : null

    refreshPromise = (async () => {
        console.log(`\n🔄 ═══ ${isIncremental ? 'INCREMENTAL' : 'FULL'} REFRESH STARTING ═══`)
        if (isIncremental) console.log(`   📅 Fetching changes since: ${since}`)

        const startTime = Date.now()

        try {
            // Prepare params
            const params = {}
            if (isIncremental) {
                params['query[updated_after]'] = since
            }

            cache.lastSyncAttempt = Date.now()
            
            // If we are hard-blocked by 401, reject entirely
            if (cache.syncError && cache.syncError.includes('401')) {
                console.error('Sync aborted due to existing 401 errors. Fix credentials to resume.')
                return
            }

            // Sequential fetch — one endpoint at a time to respect rate limits
            console.log('   📡 Fetching users...')
            const users = await fetchAllPages('/users', params)

            console.log('   📡 Fetching enrollments for Watoto Leadership 101...')
            // Filter by product_id for "Watoto Leadership 101" (ID: 3300782)
            const enrollmentParams = { ...params, 'query[product_id]': 3300782 }
            const enrollments = await fetchAllPages('/enrollments', enrollmentParams)

            console.log(`\n📊 Fetched: ${users.length} users, ${enrollments.length} enrollments`)

            // If incremental and no changes, we are done
            if (isIncremental && users.length === 0 && enrollments.length === 0) {
                console.log('   ✅ No changes detected from Thinkific')
                cache.timestamp = Date.now()
                refreshPromise = null
                return
            }

            // ═══════════════════════════════════════════════════════
            // DATA PROCESSING & MERGING
            // ═══════════════════════════════════════════════════════

            // 1. Convert NEW inputs to Lookups
            // Note: For incremental sync, 'users' only contains CHANGED users
            // But we might need user info for CHANGED enrollments even if user didn't change
            // So this is tricky. 
            // STRATEGY: 
            // - If full refresh: Build everything from scratch
            // - If incremental: 
            //     - Update changed users in our master list? We don't have a master list of raw users.
            //     - We only cache processed 'enrolledStudents' and 'unenrolledUsers'.
            //     - This makes incremental sync harder because we lack the source of truth for "User X".

            // ALTERNATIVE INCREMENTAL STRATEGY (Hybrid):
            // Since we don't store raw users, we might miss user updates if we don't fetch them.
            // However, most important data is in Enrollments (progress).
            // Let's rely on the fact that we have the previous cache.

            // If it's incremental, we need to merge with existing cache.
            const mergedStudents = isIncremental ? [...(cache.data || [])] : []
            const mergedUnenrolled = isIncremental ? [...(cache.unenrolled || [])] : []

            // Index existing data for fast updates
            const studentIndex = new Map(mergedStudents.map(s => [s.id, s])) // Map by Enrollment ID
            const userIndex = new Map(mergedStudents.map(s => [s.userId, s])) // Map by User ID (for students)

            // Helper to find a user's details (Check fetched users -> Check existing students -> Check existing unenrolled)
            // If we only fetched changed users, we might not find the user for a changed enrollment here
            // This is a risk. IF an enrollment changes but user doesn't, we need user name/email.
            // We can check if we have it in cache.

            // Build map of NEWLY fetched users
            const fetchedUserMap = {}
            let orphaned = 0

            users.forEach(user => {
                fetchedUserMap[user.id] = {
                    userId: user.id,
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    email: user.email,
                    celebration_point: normalizeCelebrationPoint(user.company || ''),
                    created_at: user.created_at,
                    external_source: user.external_source,
                    last_sign_in_at: user.last_sign_in_at // Capture login time for Risk Score
                }
            })

            // PROCESS ENROLLMENTS (Updates & Inserts)
            for (const enrollment of enrollments) {
                // Try to resolve user: New fetch -> Existing Student Cache -> Existing Unenrolled Cache
                let user = fetchedUserMap[enrollment.user_id]

                if (!user) {
                    // Fallback: Check existing cache (and keep existing extra fields if capable)
                    const existingS = mergedStudents.find(s => s.userId == enrollment.user_id)
                    if (existingS) {
                        user = {
                            userId: existingS.userId,
                            first_name: existingS.first_name || '',
                            last_name: existingS.last_name || '',
                            name: existingS.name,
                            email: existingS.email,
                            celebration_point: existingS.celebration_point,
                            last_sign_in_at: existingS.last_sign_in_at // Preserve from cache
                        }
                    }

                    if (!user) {
                        const existingU = mergedUnenrolled.find(u => u.userId == enrollment.user_id)
                        if (existingU) user = {
                            userId: existingU.userId,
                            first_name: existingU.first_name || '',
                            last_name: existingU.last_name || '',
                            name: existingU.name,
                            email: existingU.email,
                            celebration_point: existingU.celebration_point
                        }
                    }
                }

                if (!user) {
                    // CRITICAL: If we have an enrollment update but NO user info, we can't display it properly.
                    // In incremental mode, this happens if enrollment changes but user profile didn't.
                    // We should probably fetch this specific user? Or just ignore/log?
                    // Fetching 1 user is fast.
                    try {
                        console.log(`   🔎 Fetching missing user info for ID: ${enrollment.user_id}`)
                        // Add 200ms delay to avoid rate limit hammering
                        await new Promise(r => setTimeout(r, 200))
                        const userRes = await createClient().get(`/users/${enrollment.user_id}`)
                        const uData = userRes.data
                        user = {
                            userId: uData.id,
                            first_name: uData.first_name || '',
                            last_name: uData.last_name || '',
                            name: `${uData.first_name || ''} ${uData.last_name || ''}`.trim(),
                            email: uData.email,
                            celebration_point: normalizeCelebrationPoint(uData.company || ''),
                            created_at: uData.created_at,
                            external_source: uData.external_source,
                            last_sign_in_at: uData.last_sign_in_at
                        }
                        // Add to our map so we don't re-fetch
                        fetchedUserMap[enrollment.user_id] = user
                    } catch (e) {
                        orphaned++
                        continue
                    }
                }

                // Process Enrollment Data
                const rawProgress = parseFloat(enrollment.percentage_completed) || 0
                // Thinkific sends 0.0–1.0 decimals. Safely handle if already 0–100.
                const progressPercent = rawProgress <= 1.0
                    ? Math.round(rawProgress * 100)
                    : Math.round(rawProgress)
                let status = 'Not Started'
                if (enrollment.completed_at || enrollment.completed === true || rawProgress >= 1.0) status = 'Completed'
                else if (rawProgress > 0) status = 'In Progress'

                let daysInactive = 0
                let alertLevel = 'none'
                if (enrollment.updated_at) {
                    daysInactive = Math.ceil(Math.abs(new Date() - new Date(enrollment.updated_at)) / (1000 * 60 * 60 * 24))
                }
                if (daysInactive >= 30) alertLevel = 'red'
                else if (daysInactive >= 14) alertLevel = 'yellow'

                const risk = calculateRiskScore(user, enrollment)
                const studentRecord = {
                    id: enrollment.id, userId: user.userId,
                    first_name: user.first_name, last_name: user.last_name,
                    name: user.name, email: user.email,
                    course: enrollment.course_name,
                    progress: progressPercent, status,
                    lastActivity: enrollment.updated_at ? enrollment.updated_at.split('T')[0] : '',
                    daysInactive, alertLevel,
                    celebration_point: user.celebration_point,
                    last_sign_in_at: user.last_sign_in_at,
                    started_at: enrollment.started_at,
                    risk, // Weighted Risk Score object
                    // Flat aliases for export compatibility
                    risk_score: risk.score,
                    risk_category: risk.category,
                    days_since_last_sign_in: daysInactive,
                    percentage_completed: progressPercent,
                    enrolled_at: enrollment.started_at || enrollment.created_at
                }

                // Update or Add to Merged List
                if (studentIndex.has(enrollment.id)) {
                    // Update existing in-place
                    const idx = mergedStudents.findIndex(s => s.id === enrollment.id)
                    if (idx !== -1) mergedStudents[idx] = studentRecord
                } else {
                    // Add new
                    mergedStudents.push(studentRecord)
                }

                // Update Index
                studentIndex.set(enrollment.id, studentRecord)
                userIndex.set(user.userId, studentRecord)
            }

            // PROCESS USERS (Potential Students - Unenrolled)
            // If a user changed, we need to check if they are enrolled or not
            // We iterate through fetched users (who have changed)
            const enrolledUserIds = new Set(mergedStudents.map(s => String(s.userId)))

            users.forEach(rawUser => {
                // If they are enrolled, they are already handled above (or we didn't fetch their enrollment because it didn't change)
                // If they are enrolled, we might need to update their name/company in the enrolled list? 
                // Yes, if user profile changed.

                const user = fetchedUserMap[rawUser.id]

                if (enrolledUserIds.has(String(user.userId))) {
                    // User is enrolled. Update their profile details in the student list
                    const studentIdx = mergedStudents.findIndex(s => s.userId == user.userId)
                    if (studentIdx !== -1) {
                        mergedStudents[studentIdx] = {
                            ...mergedStudents[studentIdx],
                            first_name: user.first_name,
                            last_name: user.last_name,
                            name: user.name,
                            email: user.email,
                            celebration_point: user.celebration_point
                        }
                    }
                } else {
                    // User is NOT enrolled (Potential Student)
                    // Check if they are already in unenrolled list
                    const unenrolledIdx = mergedUnenrolled.findIndex(u => u.userId == user.userId)

                    const record = {
                        userId: user.userId,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        name: user.name,
                        email: user.email,
                        celebration_point: user.celebration_point,
                        company_raw: rawUser.company,
                        created_at: user.created_at,
                        external_source: user.external_source
                    }

                    // ALLOW ALL USERS (Removed 'Unknown' filter)
                    if (unenrolledIdx !== -1) {
                        mergedUnenrolled[unenrolledIdx] = record
                    } else {
                        mergedUnenrolled.push(record)
                    }
                }
            })

            // Clean up: Ensure unenrolled list doesn't contain enrolled students (in case they just enrolled)
            // This is important: if a user just enrolled, we added them to enrolledStudents. 
            // We must remove them from unenrolledUsers.
            const finalUnenrolled = mergedUnenrolled.filter(u => !enrolledUserIds.has(u.userId))
            const finalStudents = mergedStudents

            // Update Cache
            if (finalStudents.length > 0) {
                cache.data = finalStudents
                cache.unenrolled = finalUnenrolled
                cache.timestamp = Date.now()
                cache.lastSyncSuccess = Date.now()
                cache.syncError = null
                saveCache()

                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
                console.log(`\n✅ ${isIncremental ? 'INCREMENTAL' : 'FULL'} REFRESH DONE in ${elapsed}s`)
                console.log(`   Totals: ${finalStudents.length} enrolled, ${finalUnenrolled.length} potential students`)
            } else {
                console.warn('⚠️ Refresh result empty — keeping old cache')
            }

            if (orphaned > 0) console.warn(`   ⚠️ ${orphaned} enrollments skipped (orphaned)`)

        } catch (error) {
            console.error('❌ Refresh error:', error.message)
            if (error.response?.status !== 401) {
                cache.syncError = error.message
            }
            // DON'T throw — keep old cache intact
        }
    })()

    try {
        await refreshPromise
    } finally {
        refreshPromise = null
    }
}

// ═══════════════════════════════════════════════════════
// PRE-WARM: Call on server startup to load data immediately
// ═══════════════════════════════════════════════════════
export async function preWarmCache() {
    // Load disk cache first for instant API responses
    if (loadCache()) {
        console.log('🚀 Disk cache loaded — API will serve data immediately')
        // Always trigger a background refresh on startup to get fresh risk scores
        console.log('⏳ Starting background refresh for fresh data...')
        triggerBackgroundRefresh()
    } else {
        console.log('🆕 No disk cache — starting initial data fetch in background...')
        doRefresh().catch(err => console.error('❌ Initial fetch failed:', err.message))
    }
}

// ═══════════════════════════════════════════════════════
// FORCE REFRESH (for manual "Refresh Data" button)
// ═══════════════════════════════════════════════════════
export async function forceRefresh() {
    triggerBackgroundRefresh(true) // Force FULL refresh
}

// ═══════════════════════════════════════════════════════
// STATISTICS & CHARTS
// ═══════════════════════════════════════════════════════
export function getStats(students) {
    const uniqueStudents = new Set(students.map(s => s.userId || s.name)).size

    // WL101-specific stats using progress thresholds
    const healthy = students.filter(s => (s.progress || 0) >= 75).length
    const atRisk = students.filter(s => (s.progress || 0) < 30).length
    const inProgress = students.filter(s => {
        const p = s.progress || 0
        return p >= 30 && p < 75
    }).length

    // Active = logged in or made progress in last 14 days
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000)
    const activeStudents = students.filter(s => {
        if (s.last_sign_in_at && new Date(s.last_sign_in_at).getTime() > twoWeeksAgo) return true
        if (s.lastActivity && new Date(s.lastActivity).getTime() > twoWeeksAgo) return true
        return false
    }).length

    const totalProgress = students.reduce((sum, s) => sum + (s.progress || 0), 0)
    const averageProgress = students.length > 0 ? Math.round(totalProgress / students.length) : 0

    return {
        totalStudents: uniqueStudents,
        activeStudents,
        healthyStudents: healthy,
        atRiskStudents: atRisk,
        inProgressStudents: inProgress,
        averageProgress,
        // Legacy keys so existing frontend doesn't break
        activeCourses: activeStudents,
        completedCourses: healthy,
    }
}

export function getChartData(students) {
    // Progress distribution — 4 buckets with meaningful labels
    const progressDistribution = [0, 0, 0, 0]
    students.forEach(s => {
        const p = s.progress || 0
        if (p < 25) progressDistribution[0]++
        else if (p < 50) progressDistribution[1]++
        else if (p < 75) progressDistribution[2]++
        else progressDistribution[3]++
    })

    // Completion status using WL101 progress thresholds
    const completionStatus = [
        students.filter(s => (s.progress || 0) >= 75).length,     // On Track (75%+)
        students.filter(s => {
            const p = s.progress || 0; return p >= 30 && p < 75
        }).length,                                                  // In Progress (30–74%)
        students.filter(s => (s.progress || 0) < 30).length,       // Needs Help (<30%)
    ]

    // Course progress — average per course name
    const courseMap = {}
    students.forEach(s => {
        if (!courseMap[s.course]) courseMap[s.course] = { total: 0, count: 0 }
        courseMap[s.course].total += s.progress || 0
        courseMap[s.course].count++
    })
    const sortedCourses = Object.keys(courseMap).sort((a, b) =>
        (courseMap[b].total / courseMap[b].count) - (courseMap[a].total / courseMap[a].count)
    ).slice(0, 5)

    const courseProgress = {
        labels: sortedCourses,
        values: sortedCourses.map(c => Math.round(courseMap[c].total / courseMap[c].count))
    }

    // Risk distribution — real data from calculated risk categories
    const riskDistribution = {
        healthy: students.filter(s => s.risk_category === 'Healthy').length,
        attention: students.filter(s => s.risk_category === 'Attention').length,
        critical: students.filter(s => s.risk_category === 'Critical').length,
    }

    return { progressDistribution, completionStatus, courseProgress, riskDistribution, engagement: null }
}

// Helper methods from PRD
export function getAllStudents() {
    return cache.data || []
}

export function getStudentById(id) {
    const students = cache.data || []
    return students.find(s => String(s.id) === String(id) || String(s.userId) === String(id)) || null
}

export function getStudentProgress(studentId) {
    const student = getStudentById(studentId)
    return student ? {
        progress: student.progress || 0,
        percentage_completed: student.percentage_completed || 0,
        last_sign_in: student.last_sign_in_at,
        course: student.course
    } : null
}

export async function enrollUser(userId, courseId = 3300782) {
    const client = await createClient()
    try {
        // Default Course ID for Watoto Leadership 101: 3300782
        // Sanitize incoming courseId (might be a string from CSV. If invalid/empty, fallback to default)
        const safeCourseId = parseInt(courseId, 10)
        const finalCourseId = isNaN(safeCourseId) ? 3300782 : safeCourseId

        // The Thinkific API expects a flat payload for enrollments
        const response = await client.post('/enrollments', {
            user_id: userId,
            course_id: finalCourseId,
            activated_at: new Date().toISOString()
        })

        // Invalidate cache to force immediate refresh on next get
        cache.timestamp = 0
        triggerBackgroundRefresh()

        return { success: true, enrollment: response.data }
    } catch (error) {
        console.error('Enrollment failed:', error.response?.data || error.message)
        const thinkificError = error.response?.data
        let errorMsg = 'Enrollment failed'
        if (thinkificError) {
            if (thinkificError.errors?.base?.[0]) errorMsg = thinkificError.errors.base[0]
            else if (typeof thinkificError === 'object') errorMsg = JSON.stringify(thinkificError)
            else errorMsg = String(thinkificError)
        } else if (error.message) {
            errorMsg = error.message
        }
        return { success: false, message: errorMsg }
    }
}

export async function createUser(firstName, lastName, email, company, password, sendWelcomeEmail = false) {
    const client = await createClient()
    try {
        const payload = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            roles: ["student"],
            company: company || "Unknown" // Celebration Point
        }

        if (password) payload.password = password
        if (sendWelcomeEmail) payload.send_welcome_email = true

        const response = await client.post('/users', payload)

        // Invalidate cache
        cache.timestamp = 0
        triggerBackgroundRefresh()

        return { success: true, user: response.data }
    } catch (error) {
        console.error('Create user failed:', error.response?.data || error.message)
        const thinkificError = error.response?.data
        let errorMsg = 'User creation failed'

        if (thinkificError?.errors?.email?.[0]) {
            errorMsg = `Email ${email} is already taken.`
        } else if (thinkificError) {
            if (thinkificError.errors?.base?.[0]) errorMsg = thinkificError.errors.base[0]
            else if (typeof thinkificError === 'object') errorMsg = JSON.stringify(thinkificError)
            else errorMsg = String(thinkificError)
        } else if (error.message) {
            errorMsg = error.message
        }

        return { success: false, message: errorMsg }
    }
}

export async function updateUser(userId, data) {
    const client = await createClient()
    try {
        // data can contain { first_name, last_name, company, etc }
        const response = await client.put(`/users/${userId}`, data)

        // Invalidate cache
        cache.timestamp = 0
        triggerBackgroundRefresh()

        return { success: true, user: response.data }
    } catch (error) {
        console.error('Update user failed:', error.response?.data || error.message)
        const thinkificError = error.response?.data
        let errorMsg = 'Update failed'
        if (thinkificError) {
            if (thinkificError.errors?.base?.[0]) errorMsg = thinkificError.errors.base[0]
            else if (typeof thinkificError === 'object') errorMsg = JSON.stringify(thinkificError)
            else errorMsg = String(thinkificError)
        } else if (error.message) {
            errorMsg = error.message
        }
        return { success: false, message: errorMsg }
    }
}

// ═══════════════════════════════════════════════════════
// ADMIN HELPERS & WEBHOOKS
// ═══════════════════════════════════════════════════════
export function getCacheStatus() {
    return {
        cacheSize: cache.data ? cache.data.length : 0,
        lastSync: cache.lastSyncSuccess,
        lastAttempt: cache.lastSyncAttempt,
        error: cache.syncError
    }
}

export async function testConnection(apiKey, subdomain) {
    try {
        const client = axios.create({
            baseURL: 'https://api.thinkific.com/api/public/v1',
            headers: {
                'X-Auth-API-Key': apiKey,
                'X-Auth-Subdomain': subdomain,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        })
        const res = await client.get('/courses?limit=1')
        return { success: true, message: "Connected successfully", meta: res.data.meta }
    } catch (e) {
        if (e.response?.status === 401) throw new Error("401 Unauthorized - Invalid API Key or Subdomain")
        throw new Error(e.message || "Failed to connect to Thinkific")
    }
}

export async function processWebhookPayload(topic, payload) {
    console.log(`[Thinkific Webhook] Processing ${topic}...`)
    // Force minor increment window back-dated 5 minutes
    cache.timestamp = Math.max(0, Date.now() - (5 * 60 * 1000))
    triggerBackgroundRefresh()
}

export async function rawTestConnection() {
    console.log('[Diagnostic] Running GET /users?limit=1')
    try {
        const { apiKey, subdomain } = await getThinkificConfig()
        const client = axios.create({
            baseURL: `https://api.thinkific.com/api/public/v1`,
            headers: {
                'X-Auth-API-Key': apiKey,
                'X-Auth-Subdomain': subdomain,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        })
        const res = await client.get('/users?limit=1')
        return { 
            success: true, 
            status: res.status, 
            headers: res.headers, 
            data: res.data 
        }
    } catch (e) {
        return {
            success: false,
            status: e.response?.status,
            headers: e.response?.headers,
            data: e.response?.data,
            message: e.message
        }
    }
}


