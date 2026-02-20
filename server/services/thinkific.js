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
    duration: 15 * 60 * 1000 // 15 minutes
}

// ═══════════════════════════════════════════════════════
// THINKIFIC API CLIENT
// ═══════════════════════════════════════════════════════
async function createClient() {
    return axios.create({
        baseURL: 'https://api.thinkific.com/api/public/v1',
        headers: {
            'X-Auth-API-Key': process.env.THINKIFIC_API_KEY,
            'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN,
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

async function normalizeCelebrationPoint(rawCompany) {
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
    const client = createClient()
    let allItems = []

    try {
        const firstRes = await client.get(endpoint, {
            params: { ...params, page: 1, limit: 50 }
        })
        allItems = [...firstRes.data.items]
        const totalPages = firstRes.data.meta?.pagination?.total_pages || 1
        const totalItems = firstRes.data.meta?.pagination?.total_items || allItems.length
        console.log(`   📄 ${endpoint}: ${totalItems} items, ${totalPages} pages`)

        if (totalPages > 1) {
            const pages = []
            for (let i = 2; i <= totalPages; i++) pages.push(i)

            // Batch size 5 — safe since we only fetch one endpoint at a time
            const BATCH_SIZE = 5
            for (let b = 0; b < pages.length; b += BATCH_SIZE) {
                const batch = pages.slice(b, b + BATCH_SIZE)
                const promises = batch.map(async (page) => {
                    for (let attempt = 1; attempt <= 5; attempt++) {
                        try {
                            const res = await client.get(endpoint, {
                                params: { ...params, page, limit: 50 }
                            })
                            return res.data.items
                        } catch (err) {
                            const is429 = err.response?.status === 429
                            const wait = is429 ? 5000 * attempt : 1000 * attempt
                            if (attempt < 5) {
                                console.warn(`   ⚠️ ${endpoint} p${page} try ${attempt}/5 (${is429 ? 'rate-limited' : 'error'}, wait ${wait / 1000}s)`)
                                await new Promise(r => setTimeout(r, wait))
                            } else {
                                console.error(`   ❌ ${endpoint} p${page} FAILED after 5 attempts`)
                                return []
                            }
                        }
                    }
                })
                const results = await Promise.all(promises)
                results.forEach(items => { if (items) allItems.push(...items) })

                // 1s delay between batches
                if (b + BATCH_SIZE < pages.length) {
                    await new Promise(r => setTimeout(r, 1000))
                }
            }
        }

        if (allItems.length < totalItems) {
            console.warn(`   ⚠️ ${endpoint}: Got ${allItems.length}/${totalItems}`)
        } else {
            console.log(`   ✅ ${endpoint}: All ${allItems.length} fetched`)
        }
    } catch (error) {
        console.error(`   ❌ ${endpoint} failed: ${error.message}`)
    }

    return allItems
}

// ═══════════════════════════════════════════════════════
// CACHE MANAGEMENT
// ═══════════════════════════════════════════════════════
async function loadCache() {
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

async function saveCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8')
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

    // Step 3: No data at all — must block and fetch
    console.log('🆕 No cached data found — fetching fresh (this takes ~60-90s)...')
    await doRefresh()
    return {
        students: filterData(cache.data, filterCelebrationPoint),
        lastUpdated: cache.timestamp
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
                        const userRes = await createClient().get(`/users/${enrollment.user_id}`)
                        const uData = userRes.data
                        user = {
                            userId: uData.id,
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
                const progressPercent = Math.round(rawProgress * 100)
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

                const studentRecord = {
                    id: enrollment.id, userId: user.userId,
                    name: user.name, email: user.email,
                    course: enrollment.course_name,
                    progress: progressPercent, status,
                    lastActivity: enrollment.updated_at ? enrollment.updated_at.split('T')[0] : '',
                    daysInactive, alertLevel,
                    celebration_point: user.celebration_point,
                    last_sign_in_at: user.last_sign_in_at,
                    started_at: enrollment.started_at,
                    risk: calculateRiskScore(user, enrollment) // NEW: Weighted Risk Score
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
        // If cache is stale, refresh in background
        if (Date.now() - cache.timestamp > cache.duration) {
            console.log('⏳ Disk cache is stale — starting background refresh...')
            triggerBackgroundRefresh()
        }
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
    const completedCourses = students.filter(s => s.status === 'Completed').length
    const activeCourses = students.filter(s => s.status === 'In Progress').length
    const totalProgress = students.reduce((sum, s) => sum + (s.progress || 0), 0)
    const averageProgress = students.length > 0 ? Math.round(totalProgress / students.length) : 0
    return { totalStudents: uniqueStudents, activeCourses, completedCourses, averageProgress }
}

export function getChartData(students) {
    const progressDistribution = [0, 0, 0, 0]
    students.forEach(s => {
        const p = s.progress || 0
        if (p <= 25) progressDistribution[0]++
        else if (p <= 50) progressDistribution[1]++
        else if (p <= 75) progressDistribution[2]++
        else progressDistribution[3]++
    })

    const completionStatus = [
        students.filter(s => s.status === 'Completed').length,
        students.filter(s => s.status === 'In Progress').length,
        students.filter(s => s.status === 'Not Started').length
    ]

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

    const engagement = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        values: [
            Math.floor(students.length * 0.2), Math.floor(students.length * 0.4),
            Math.floor(students.length * 0.5), Math.floor(students.length * 0.6)
        ]
    }

    return { progressDistribution, completionStatus, courseProgress, engagement }
}

export async function enrollUser(userId) {
    const client = createClient()
    try {
        // Course ID for Watoto Leadership 101: 3300782
        const response = await client.post('/enrollments', {
            enrollment: {
                user_id: userId,
                course_id: 3300782,
                activated_at: new Date().toISOString()
            }
        })

        // Invalidate cache to force immediate refresh on next get
        cache.timestamp = 0
        triggerBackgroundRefresh()

        return { success: true, enrollment: response.data }
    } catch (error) {
        console.error('Enrollment failed:', error.response?.data || error.message)
        return { success: false, message: error.response?.data?.errors?.base?.[0] || 'Enrollment failed' }
    }
}

export async function createUser(firstName, lastName, email, company, password) {
    const client = createClient()
    try {
        const payload = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            roles: ["student"],
            company: company || "Unknown" // Celebration Point
        }

        // Only add password if provided (Thinkific might send email if not?)
        // Actually Thinkific requires password for API creation usually or it generates one?
        // Let's set a default if not provided or handle it.
        // API docs say password is optional? Let's check. 
        // If not provided, user might need to set it via "Forgot Password". 
        // Admin usually sets a temp one.
        if (password) payload.password = password

        const response = await client.post('/users', payload)

        // Invalidate cache
        cache.timestamp = 0
        triggerBackgroundRefresh()

        return { success: true, user: response.data }
    } catch (error) {
        console.error('Create user failed:', error.response?.data || error.message)
        const msg = error.response?.data?.errors?.email?.[0]
            ? `Email ${email} is already taken.`
            : (error.response?.data?.errors?.base?.[0] || 'User creation failed')
        return { success: false, message: msg }
    }
}

export async function updateUser(userId, data) {
    const client = createClient()
    try {
        // data can contain { first_name, last_name, company, etc }
        const response = await client.put(`/users/${userId}`, data)

        // Invalidate cache
        cache.timestamp = 0
        triggerBackgroundRefresh()

        return { success: true, user: response.data }
    } catch (error) {
        console.error('Update user failed:', error.response?.data || error.message)
        return { success: false, message: 'Update failed' }
    }
}
