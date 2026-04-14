/**
 * Notion Sync Service — Syncs weekly reports from a Notion database into SQLite.
 *
 * Improvements over v1:
 * - Exponential backoff retry for transient errors and rate limits
 * - Sync history (last 20 syncs stored in memory for admin visibility)
 * - Better error categorisation (auth errors vs network vs rate limit)
 * - Pastoral concern detection — triggers notification when a report has concerns
 * - Graceful degradation when credentials not configured
 */
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { Client as NotionClient } from '@notionhq/client'

// --- State ---
let syncInterval = null
let isSyncing = false  // Guard against overlapping syncs

let lastSyncStatus = {
    lastSyncTime: null,
    status: 'idle',       // 'idle' | 'syncing' | 'success' | 'error' | 'disabled'
    message: '',
    recordsSynced: 0,
    errorType: null       // 'auth' | 'rate_limit' | 'network' | 'config' | null
}

// Sync history — last 20 syncs for admin dashboard
const syncHistory = []
const MAX_HISTORY = 20

// Retry configuration
const RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    backoffMultiplier: 2
}

// --- Helpers ---

async function getNotionConfig() {
    const apiKey  = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_api_key'")
    const dbId    = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_database_id'")
    const interval = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_sync_interval'")

    const effectiveApiKey = apiKey?.value || process.env.NOTION_API_KEY
    const effectiveDbId   = dbId?.value   || process.env.NOTION_DB_ID

    if (!effectiveApiKey || !effectiveDbId) return null

    return {
        apiKey: effectiveApiKey,
        databaseId: effectiveDbId,
        syncIntervalMinutes: parseInt(interval?.value || process.env.NOTION_SYNC_INTERVAL || '3', 10)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function classifyError(error) {
    if (error.status === 401 || error.code === 'unauthorized') return 'auth'
    if (error.status === 429) return 'rate_limit'
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') return 'network'
    return 'unknown'
}

function recordHistory(entry) {
    syncHistory.unshift({ ...entry, ts: new Date().toISOString() })
    if (syncHistory.length > MAX_HISTORY) syncHistory.pop()
}

// ─── CODE_ALIASES ────────────────────────────────────────────────
// Maps every known typo/non-standard code → its canonical group_code.
// Sourced by cross-referencing 395 Notion submissions against the
// official celebration point prefix list (WBB, WBG, WBW, WDT, WEN,
// WGU, WJB, WJJ, WKY, WLB, WMB, WMK, WNT, WNW, WON, WSU).
//
// The sync resolves codes in this order:
//   1. CODE_ALIASES exact lookup   (handles prefix typos, format noise)
//   2. Exact match in groupByExact (canonical codes)
//   3. Normalized fuzzy match      (handles leading zeros, spacing)
export const CODE_ALIASES = {
    // ── Gulu: WCG → WGU (extra C) ─────────────────────────────
    'WCG03': 'WGU03', 'WCG08': 'WGU08', 'WCG10': 'WGU10',
    // ── Bugolobi: WCG23 → WBG23 (C→B) ────────────────────────
    'WCG23': 'WBG23',
    // ── Juba: WBJ17 → WJB17 (swapped), WJL → WJB (L→B) ──────
    'WBJ17': 'WJB17',
    'WJL2': 'WJB02', 'WJL3': 'WJB03', 'WJL9': 'WJB09',
    'WJB019': 'WJB19', 'WJB1': 'WJB01', 'WJB6': 'WJB06', 'WJB7': 'WJB07',
    // ── Kyengera: WCKY → WKY (extra C), WK → WKY (missing Y) ─
    'WCK02': 'WKY02', 'WCKY 004': 'WKY04', 'WCKY12': 'WKY12',
    'WK06': 'WKY06', 'WK-GROUP C': 'WKY03',
    'KY013': 'WKY13',
    'WKY-12': 'WKY12', 'WKY-015': 'WKY15',
    'WKY009': 'WKY09', 'WKY9': 'WKY09',
    'WKY013': 'WKY13', 'WKY014': 'WKY14', 'WKY015': 'WKY15',
    'WKY02': 'WKY02',  // Wky02 handled by uppercase normalization
    // ── Mukono: WCM → WMK, WC MK → WMK ──────────────────────
    'WCM10': 'WMK10', 'WC MK 01': 'WMK01',
    'WMK014': 'WMK14', 'WMK 15': 'WMK15',
    // ── Ntinda: WCN → WNT, NT## → WNT##, bare numbers ────────
    'WCN58': 'WNT58',
    'NT 07': 'WNT07', 'NT11': 'WNT11', 'NT14': 'WNT14',
    'NT 30': 'WNT30', 'NT25': 'WNT25', 'NT26': 'WNT26',
    'NT33': 'WNT33', 'NT46': 'WNT46', 'NT53': 'WNT53', 'NT 59': 'WNT59',
    'WN GROUP 19': 'WNT19', 'WN37': 'WNT37', 'WN48': 'WNT48',
    'WD 28': 'WNT28',
    'WNL101-GROUP 50': 'WNT50',
    'W101N GROUP 54': 'WNT54',
    '18': 'WNT18', '29': 'WNT29', '59': 'WNT59',
    // ── Ntinda: generic "Group N" codes ───────────────────────
    'GROUP 13': 'WNT13', 'GROUP 31': 'WNT31',
    'GROUP 55': 'WNT55', 'GROUP 57': 'WNT57',
    // ── Bweyogerere: WDW → WBW (D→B), spacing/format fixes ───
    'WDW 11': 'WBW11', 'WDW11': 'WBW11',
    'WBW 11': 'WBW11', 'WBW-18': 'WBW18', 'WBW016': 'WBW16', 'WBw10': 'WBW10',
    'W10115': 'WBW15', 'W101;15': 'WBW15',
    'GROUP 15': 'WBW15',
    // ── Bugolobi: WGB → WBG (swapped) ────────────────────────
    'WGB12': 'WBG12',
    // ── Downtown: WTD/WTGP → WDT (transposed/garbled) ────────
    'WTD06': 'WDT06', 'WTGP6': 'WDT06',
    'WD101-04': 'WDT04',
    'WDT -101-  19': 'WDT19', 'WDT GROUP 19': 'WDT19',
    'DT-W101 7': 'WDT07', 'DT-W101.10': 'WDT10',
    'WL101 GROUP-25': 'WDT25', 'WL14': 'WDT14',
    'GROUP 3': 'WDT03', 'GROUP12': 'WDT12',
    // ── Lubowa: WL101/WL → WLB ────────────────────────────────
    'WL101 GROUP 8': 'WLB08', 'WL101-B11': 'WLB11',
    'WL B04': 'WLB04', 'WLB 13': 'WLB13', 'WLBO8': 'WLB08',
    'GROUP 2 101  (WLB02)': 'WLB02',
    'B14': 'WLB14',
    // ── Online: ON → WON (missing W) ─────────────────────────
    'ON1': 'WON01', 'ON3': 'WON03', 'WONO3': 'WON03',
    // ── Entebbe: WEN013 → WEN13 ──────────────────────────────
    'WEN013': 'WEN13',
    // ── Nansana: spacing/format variants + WN3G2 self-corrected
    'WNW-01': 'WNW01',
    'WNW 02': 'WNW02', 'WNW 05': 'WNW05', 'WNW 08': 'WNW08',
    'WNW 10': 'WNW10', 'WNW 12': 'WNW12', 'WNW 14': 'WNW14',
    'WNW:03(9-11AM)': 'WNW03',
    'WN3G2': 'WNW13',  // Irene Plan self-corrected to WNW13 next week
    // ── Gulu: Group 6 ─────────────────────────────────────────
    'GROUP 6': 'WGU06',
    // ── Mbarara: WMB ─────────────────────────────────────────
    'WMC': 'WMB', 'WMBA': 'WMB', 'WMMB': 'WMB',
    // ── Laminadera: WLM ──────────────────────────────────────
    'WLC': 'WLM', 'WLMI': 'WLM', 'WLLM': 'WLM',
}

// --- Normalize group codes for fuzzy matching ---
// Applied AFTER alias lookup. Handles remaining formatting variations:
// "WDT 02" → "WDT02", "WDT002" → "WDT02", "wdt02" → "WDT02"
export function normalizeGroupCode(code) {
    if (!code) return ''
    let c = code.trim().toUpperCase()
    // Remove spaces, hyphens, dots, semicolons, slashes, colons, parentheses
    c = c.replace(/[\s\-\.;/:()]/g, '')
    // Strip leading zeros from numeric suffix: WDT002 → WDT02, NOT WDT20
    // (only strip a single leading zero from 2+ digit numbers to avoid WDT02→WDT2)
    c = c.replace(/([A-Z]+)0(\d{2,})$/, '$1$2')
    return c
}

// --- Split multi-group codes into individual codes ---
// Some facilitators reported for multiple groups in one submission:
//   "WNT28&27"        → ["WNT28", "WNT27"]
//   "WKY08 AND WKY18" → ["WKY08", "WKY18"]
//   "WCG/03"          → ["WCG03"]  (slash is just formatting, single group)
// The report will be duplicated and inserted for each resulting group.
export function splitGroupCodes(rawCode) {
    if (!rawCode) return []
    const code = rawCode.trim()

    // Pattern: PREFIX+NUM&NUM  e.g. WNT28&27 → WNT28 + WNT27
    const ampersand = code.match(/^([A-Za-z]+)(\d+)[&](\d+)$/)
    if (ampersand) {
        const [, prefix, n1, n2] = ampersand
        return [prefix.toUpperCase() + n1, prefix.toUpperCase() + n2]
    }

    // Pattern: CODE AND CODE  e.g. WKY08 AND WKY18
    if (/\bAND\b/i.test(code)) {
        return code.split(/\s+AND\s+/i).map(s => s.trim()).filter(Boolean)
    }

    // Slash used as formatting within a single code: WCG/03 → WCG03
    // (Only applies when there's a prefix before the slash, not two full codes)
    const slashSingle = code.match(/^([A-Za-z]{2,})\/(\d+)$/)
    if (slashSingle) {
        return [slashSingle[1].toUpperCase() + slashSingle[2]]
    }

    return [code]
}

// --- Extract module number from Tally "Module X — Name" field ---
function extractModuleNumber(moduleStr) {
    if (!moduleStr) return null
    const m = moduleStr.match(/module\s*(\d+)/i)
    return m ? parseInt(m[1], 10) : null
}

// --- Extract highest lesson number mentioned in the lessons field ---
function extractMaxLesson(lessonsStr) {
    if (!lessonsStr) return null
    const matches = lessonsStr.match(/lesson\s*(\d+)/gi) || []
    if (matches.length === 0) return null
    const nums = matches.map(m => parseInt(m.replace(/\D/g, ''), 10))
    return Math.max(...nums)
}

// --- Normalise engagement level text → 'high' | 'medium' | 'low' | null ---
function normalizeEngagement(val) {
    if (!val) return null
    const v = val.toLowerCase().trim()
    if (v.includes('high')) return 'high'
    if (v.includes('medium') || v.includes('moderate')) return 'medium'
    if (v.includes('low')) return 'low'
    return null
}

// --- Map Notion properties to weekly_reports columns ---
// Handles the actual Tally form column names used in the WL101 Notion database.
// Column names are numbered Tally questions, e.g. "5. Your Formation Group Code".
function mapNotionPageToReport(page) {
    const props = page.properties || {}

    // Universal property value extractors
    const getText = (prop) => {
        if (!prop) return null
        if (prop.type === 'rich_text') return prop.rich_text?.map(t => t.plain_text).join('') || null
        if (prop.type === 'title')     return prop.title?.map(t => t.plain_text).join('') || null
        if (prop.type === 'url')       return prop.url || null
        if (prop.type === 'email')     return prop.email || null
        if (prop.type === 'phone_number') return prop.phone_number || null
        return null
    }
    const getNumber = (prop) => {
        if (!prop) return null
        if (prop.type === 'number') return prop.number ?? null
        // Notion sometimes stores numbers as rich_text
        if (prop.type === 'rich_text') {
            const t = prop.rich_text?.map(r => r.plain_text).join('').trim()
            const n = parseFloat(t)
            return isNaN(n) ? null : n
        }
        return null
    }
    const getSelect = (prop) => {
        if (!prop) return null
        if (prop.type === 'select')       return prop.select?.name || null
        if (prop.type === 'multi_select') return prop.multi_select?.map(s => s.name).join(', ') || null
        // Tally often stores selects as rich_text
        if (prop.type === 'rich_text')    return prop.rich_text?.map(t => t.plain_text).join('') || null
        if (prop.type === 'title')        return prop.title?.map(t => t.plain_text).join('') || null
        return null
    }
    const getDate = (prop) => {
        if (!prop) return null
        if (prop.type === 'date')      return prop.date?.start || null
        if (prop.type === 'rich_text') return prop.rich_text?.map(t => t.plain_text).join('') || null
        if (prop.type === 'title')     return prop.title?.map(t => t.plain_text).join('') || null
        return null
    }

    // Helper: try multiple property name variants, return first non-null
    const first = (fn, ...keys) => {
        for (const key of keys) {
            const val = fn(props[key])
            if (val !== null && val !== undefined && val !== '') return val
        }
        return null
    }

    // ─── Group Code ───────────────────────────────────────────────
    // Tally: "5. Your Formation Group Code"
    const group_code = first(getText,
        '5. Your Formation Group Code',
        'Formation Group Code', 'Group Code', 'group_code'
    )

    // ─── Module & Lesson ─────────────────────────────────────────
    // Tally: "6. Module", "7. Lessons Covered"
    const moduleStr  = first(getText, '6. Module', 'Module', 'module')
    const lessonsStr = first(getText, '7. Lessons Covered', 'Lessons Covered', 'Lessons', 'lessons')
    const module_number = extractModuleNumber(moduleStr) ||
                          first(getNumber, 'Module Number', 'module_number')
    const lesson_number = extractMaxLesson(lessonsStr) ||
                          first(getNumber, 'Lesson Number', 'lesson_number')

    // ─── Attendance ───────────────────────────────────────────────
    // Tally: "9. Number of Participants Present"
    const attendanceRaw = first(getText,
        '9. Number of Participants Present',
        'Attendance', 'attendance_count', 'Number of Participants Present'
    )
    const attendance_count = attendanceRaw ? (parseInt(attendanceRaw, 10) || null) :
                             first(getNumber, '9. Number of Participants Present', 'Attendance', 'attendance_count')

    // ─── Engagement ───────────────────────────────────────────────
    // Tally: "11. How would you rate the overall group engagement during this session?"
    const engagementRaw = first(getSelect,
        '11. How would you rate the overall group engagement during this session?',
        'Engagement Level', 'engagement_level', 'Engagement'
    )
    const engagement_level = normalizeEngagement(engagementRaw)

    // ─── Qualitative Fields ───────────────────────────────────────
    // Tally question numbers mapped to weekly_reports columns:
    // 13 → key_themes, 14 → formation_evidence, 16 → pastoral_concerns
    // 17 → questions_to_escalate, 18+19 → session_adjustments
    const key_themes = first(getText,
        '13. What were the 2–3 key themes or tensions that emerged in discussion?',
        'Key Themes', 'key_themes'
    )
    const formation_evidence = first(getText,
        '14. Did you observe any signs of growth or positive formation?',
        'Formation Evidence', 'formation_evidence'
    )
    const pastoral_concerns = first(getText,
        '16. Are there any participants who may need pastoral follow-up?',
        'Pastoral Concerns', 'pastoral_concerns'
    )
    const questions_to_escalate = first(getText,
        '17. Are there any questions that need input from your Lead Facilitator, Coordinator, or Pastor?',
        'Questions to Escalate', 'questions_to_escalate'
    )
    // Combine "what worked well" + "what to adjust" into session_adjustments
    const whatWorked  = first(getText, '18. What worked well in this session?', 'Session Adjustments')
    const whatAdjust  = first(getText, '19. What would you adjust for next time?', 'session_adjustments')
    const session_adjustments = [whatWorked, whatAdjust].filter(Boolean).join('\n\nAdjustments: ') || null

    // ─── Dates ────────────────────────────────────────────────────
    // Tally: "4. Date of Session", "Date of Submission"
    const session_date   = first(getDate, '4. Date of Session', 'Date of Session', 'session_date')
    const submitted_at   = first(getDate, 'Date of Submission', 'Submitted', 'submitted_at') ||
                           session_date || page.created_time

    // ─── Facilitator ──────────────────────────────────────────────
    const _facilitator_name = first(getText, '1. Full Name', 'Facilitator Name', 'facilitator_name')

    // ─── Celebration Point ────────────────────────────────────────
    const _celebration_point = first(getText, '3. Your Celebration Point', 'Celebration Point')

    return {
        notion_page_id: page.id,
        group_code,
        module_number,
        lesson_number,
        // week_number is assigned AFTER syncing all pages for a group (sequential by date)
        week_number: null,
        attendance_count,
        engagement_level,
        key_themes,
        formation_evidence,
        pastoral_concerns,
        questions_to_escalate,
        session_adjustments,
        submitted_at,
        _session_date: session_date,   // used for week_number ordering
        _facilitator_name,
        _celebration_point
    }
}

// --- Retry wrapper ---
async function withRetry(fn, label) {
    let lastError
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            const errType = classifyError(error)

            // Don't retry auth errors — they won't self-resolve
            if (errType === 'auth') {
                console.error(`❌ [NotionSync] Auth error on ${label} — check API key.`)
                throw error
            }

            if (attempt < RETRY_CONFIG.maxAttempts) {
                let delayMs
                if (errType === 'rate_limit') {
                    const retryAfter = parseInt(error.headers?.['retry-after'] || '30', 10)
                    delayMs = Math.min(retryAfter * 1000, RETRY_CONFIG.maxDelayMs)
                    console.warn(`⚠️  [NotionSync] Rate limited on ${label}. Retrying after ${retryAfter}s (attempt ${attempt}/${RETRY_CONFIG.maxAttempts})`)
                } else {
                    delayMs = Math.min(
                        RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
                        RETRY_CONFIG.maxDelayMs
                    )
                    console.warn(`⚠️  [NotionSync] Error on ${label} (${errType}). Retrying in ${delayMs}ms (attempt ${attempt}/${RETRY_CONFIG.maxAttempts})`)
                }
                await sleep(delayMs)
            }
        }
    }
    throw lastError
}

// --- Core Sync Function ---
export async function syncWeeklyReports() {
    // Guard against overlapping syncs
    if (isSyncing) {
        console.log('ℹ️  [NotionSync] Sync already in progress, skipping.')
        return lastSyncStatus
    }

    const config = await getNotionConfig()
    if (!config) {
        lastSyncStatus = {
            lastSyncTime: null,
            status: 'disabled',
            message: 'Notion credentials not configured. Set API Key and Database ID in Admin → Settings.',
            recordsSynced: 0,
            errorType: 'config'
        }
        return lastSyncStatus
    }

    isSyncing = true
    lastSyncStatus.status = 'syncing'
    lastSyncStatus.message = 'Sync in progress…'

    const syncStart = Date.now()

    try {
        const notion = new NotionClient({ auth: config.apiKey })

        // Build incremental filter if we have a last sync time
        const filter = {}
        if (lastSyncStatus.lastSyncTime) {
            filter.filter = {
                timestamp: 'last_edited_time',
                last_edited_time: { after: lastSyncStatus.lastSyncTime }
            }
        }

        // Paginated query with retry
        let allPages = []
        let hasMore = true
        let startCursor = undefined

        while (hasMore) {
            const response = await withRetry(
                () => notion.databases.query({
                    database_id: config.databaseId,
                    start_cursor: startCursor,
                    page_size: 100,
                    ...filter
                }),
                'database query'
            )
            allPages.push(...response.results)
            hasMore = response.has_more
            startCursor = response.next_cursor
        }

        console.log(`📥 [NotionSync] Fetched ${allPages.length} page(s) from Notion.`)

        // ✅ PERF FIX: Load ALL groups once, build exact + normalized lookup maps
        const allGroups = await dbAll('SELECT id, group_code, facilitator_user_id, celebration_point FROM formation_groups WHERE active = 1')
        const groupByExact = {}       // "WDT001" → group
        const groupByNormalized = {}  // "WDT1"   → group  (fuzzy)
        for (const g of allGroups) {
            if (g.group_code) {
                groupByExact[g.group_code.trim().toUpperCase()] = g
                groupByNormalized[normalizeGroupCode(g.group_code)] = g
            }
        }
        console.log(`📋 [NotionSync] Loaded ${allGroups.length} active group(s) for matching.`)

        // Pre-load all existing notion_page_ids — avoids per-row existence check
        const existingRows = await dbAll('SELECT notion_page_id, id FROM weekly_reports WHERE notion_page_id IS NOT NULL')
        const existingByNotionId = {}
        for (const row of existingRows) existingByNotionId[row.notion_page_id] = row.id

        // ─── Map all pages first, splitting multi-group codes ────────
        // e.g. "WNT28&27" becomes two separate report objects — one for WNT28, one for WNT27.
        // Each split copy gets a unique synthetic notion_page_id so they can be tracked separately.
        const mappedReports = []
        for (const page of allPages) {
            try {
                const r = mapNotionPageToReport(page)
                if (!r.group_code) continue

                // Apply alias BEFORE splitting so "WCG03" → "WGU03" before any further processing
                const rawCodeUpper = r.group_code?.trim().toUpperCase() || ''
                const resolvedCode = CODE_ALIASES[rawCodeUpper] || CODE_ALIASES[r.group_code?.trim()] || r.group_code
                const codes = splitGroupCodes(resolvedCode)

                if (codes.length === 1) {
                    r.group_code = codes[0]
                    mappedReports.push(r)
                } else {
                    // Multi-group: duplicate report for each group code
                    for (let i = 0; i < codes.length; i++) {
                        const copy = { ...r }
                        copy.group_code = codes[i]
                        // Suffix notion_page_id so each copy has a distinct tracking ID
                        copy.notion_page_id = `${r.notion_page_id}_split${i}`
                        mappedReports.push(copy)
                    }
                    console.log(`📎 [NotionSync] Multi-group "${r.group_code}" → split into: ${codes.join(', ')}`)
                }
            } catch (e) {
                console.warn(`⚠️  [NotionSync] Failed to map page ${page.id}:`, e.message)
            }
        }

        // ─── Assign week_number by chronological order per group ──
        // Sorts each group's submissions by session date and numbers them 1, 2, 3...
        // This is the most accurate week number derivable from Tally form data.
        const reportsByNormCode = {}
        for (const r of mappedReports) {
            const key = normalizeGroupCode(r.group_code)
            if (!reportsByNormCode[key]) reportsByNormCode[key] = []
            reportsByNormCode[key].push(r)
        }
        for (const reports of Object.values(reportsByNormCode)) {
            reports.sort((a, b) => {
                const da = new Date(a._session_date || a.submitted_at || 0)
                const db = new Date(b._session_date || b.submitted_at || 0)
                return da - db
            })
            reports.forEach((r, i) => { r.week_number = i + 1 })
        }

        let synced = 0
        let skipped = 0
        let errors = 0
        const unmatchedCodes = new Set()
        const newPastoralConcerns = []

        for (const report of mappedReports) {
            try {
                // Resolve group:
                //   1. CODE_ALIASES lookup (handles prefix typos, garbled codes)
                //   2. Exact match against canonical group_code
                //   3. Normalized fuzzy match (spacing, leading zeros)
                const rawKey      = report.group_code?.trim().toUpperCase() || ''
                const aliasTarget = CODE_ALIASES[rawKey] || CODE_ALIASES[report.group_code?.trim()] || report.group_code
                const exactKey    = aliasTarget?.trim().toUpperCase()
                const group = groupByExact[exactKey] || groupByNormalized[normalizeGroupCode(aliasTarget)]

                if (!group) {
                    if (rawKey && !unmatchedCodes.has(rawKey)) {
                        unmatchedCodes.add(rawKey)
                        const aliasNote = aliasTarget !== report.group_code ? ` (alias→${aliasTarget})` : ''
                        console.warn(`⚠️  [NotionSync] No group match for "${rawKey}"${aliasNote}`)
                    }
                    skipped++
                    continue
                }

                const groupId = group.id

                const validEngagement = ['high', 'medium', 'low'].includes(report.engagement_level)
                    ? report.engagement_level
                    : null

                // Use pre-loaded map instead of a per-row dbGet (no DB call)
                const existingId = existingByNotionId[report.notion_page_id]

                if (existingId) {
                    await dbRun(`
                        UPDATE weekly_reports SET
                            formation_group_id = ?, facilitator_user_id = ?, week_number = ?,
                            module_number = ?, lesson_number = ?, attendance_count = ?,
                            engagement_level = ?, key_themes = ?, formation_evidence = ?,
                            pastoral_concerns = ?, questions_to_escalate = ?, session_adjustments = ?,
                            submitted_at = ?, synced_at = CURRENT_TIMESTAMP
                        WHERE notion_page_id = ?
                    `, [
                        groupId, group?.facilitator_user_id, report.week_number,
                        report.module_number, report.lesson_number, report.attendance_count,
                        validEngagement, report.key_themes, report.formation_evidence,
                        report.pastoral_concerns, report.questions_to_escalate, report.session_adjustments,
                        report.submitted_at, report.notion_page_id
                    ])
                } else {
                    await dbRun(`
                        INSERT INTO weekly_reports (
                            formation_group_id, facilitator_user_id, week_number,
                            module_number, lesson_number, attendance_count,
                            engagement_level, key_themes, formation_evidence,
                            pastoral_concerns, questions_to_escalate, session_adjustments,
                            notion_page_id, submitted_at, synced_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `, [
                        groupId, group?.facilitator_user_id, report.week_number,
                        report.module_number, report.lesson_number, report.attendance_count,
                        validEngagement, report.key_themes, report.formation_evidence,
                        report.pastoral_concerns, report.questions_to_escalate, report.session_adjustments,
                        report.notion_page_id, report.submitted_at
                    ])

                    // Track new reports with pastoral concerns for downstream notification
                    if (report.pastoral_concerns && report.pastoral_concerns.trim().length > 0) {
                        newPastoralConcerns.push({ groupId, week: report.week_number, concern: report.pastoral_concerns })
                    }
                }

                synced++
            } catch (pageErr) {
                errors++
                console.error(`❌ [NotionSync] Error processing page ${page.id}:`, pageErr.message)
            }
        }

        const duration = ((Date.now() - syncStart) / 1000).toFixed(1)

        const unmatchedMsg = unmatchedCodes.size > 0
            ? ` | ⚠️ ${unmatchedCodes.size} unmatched group code(s): ${[...unmatchedCodes].join(', ')}`
            : ''

        lastSyncStatus = {
            lastSyncTime: new Date().toISOString(),
            status: unmatchedCodes.size > 0 && synced === 0 ? 'error' : 'success',
            message: `Synced ${synced} report(s) from ${allPages.length} page(s) in ${duration}s${skipped > 0 ? ` (${skipped} skipped)` : ''}${errors > 0 ? ` (${errors} errors)` : ''}${unmatchedMsg}`,
            recordsSynced: synced,
            unmatchedGroupCodes: [...unmatchedCodes],
            errorType: null
        }

        recordHistory({ status: 'success', synced, skipped, errors, pages: allPages.length, duration })
        console.log(`✅ [NotionSync] ${lastSyncStatus.message}`)

        // Notify coordinators about new pastoral concerns (async, non-blocking)
        if (newPastoralConcerns.length > 0) {
            notifyPastoralConcerns(newPastoralConcerns).catch(err =>
                console.error('❌ [NotionSync] Failed to send pastoral concern notifications:', err.message)
            )
        }

    } catch (error) {
        const errType = classifyError(error)
        const duration = ((Date.now() - syncStart) / 1000).toFixed(1)
        let message = error.message || 'Unknown error during sync'

        if (errType === 'auth') {
            message = 'Authentication failed — check your Notion API key in Settings.'
        } else if (errType === 'rate_limit') {
            message = 'Notion rate limit hit. Sync will resume on next scheduled interval.'
        } else if (errType === 'network') {
            message = 'Network error connecting to Notion. Check server connectivity.'
        }

        lastSyncStatus = {
            lastSyncTime: lastSyncStatus.lastSyncTime, // preserve last successful time
            status: 'error',
            message,
            recordsSynced: 0,
            errorType: errType
        }

        recordHistory({ status: 'error', error: message, errorType: errType, duration })
        console.error(`❌ [NotionSync] Sync failed (${errType}): ${message}`)
    } finally {
        isSyncing = false
    }

    return lastSyncStatus
}

// --- Notify coordinators about new pastoral concerns ---
async function notifyPastoralConcerns(concerns) {
    const { createNotification } = await import('./notifications.js')

    for (const { groupId, week, concern } of concerns) {
        try {
            const group = await dbGet(`
                SELECT fg.*, u.celebration_point
                FROM formation_groups fg
                LEFT JOIN users u ON fg.facilitator_user_id = u.id
                WHERE fg.id = ?
            `, [groupId])

            if (!group) continue

            // Notify coordinators and pastors for this campus
            const recipients = await dbAll(`
                SELECT id FROM users
                WHERE role IN ('Coordinator', 'Pastor', 'Admin', 'LeadershipTeam')
                AND (celebration_point = ? OR role IN ('Admin', 'LeadershipTeam'))
                AND active = 1
            `, [group.celebration_point])

            for (const recipient of recipients) {
                await createNotification(
                    recipient.id,
                    '⚠️ Pastoral Concern Flagged',
                    `Week ${week} report for ${group.name} (${group.group_code}) includes a pastoral concern. Please review.`,
                    'alert'
                )
            }
        } catch (err) {
            console.error(`❌ [NotionSync] Failed to notify for pastoral concern in group ${groupId}:`, err.message)
        }
    }
}

// --- Auto-sync management ---
export async function startAutoSync() {
    const config = await getNotionConfig()
    if (!config) {
        console.log('ℹ️  [NotionSync] Auto-sync disabled — credentials not configured in Settings.')
        lastSyncStatus = {
            lastSyncTime: null,
            status: 'disabled',
            message: 'Notion credentials not configured',
            recordsSynced: 0,
            errorType: 'config'
        }
        return
    }

    stopAutoSync()
    const intervalMs = config.syncIntervalMinutes * 60 * 1000
    console.log(`🔄 [NotionSync] Auto-sync started (every ${config.syncIntervalMinutes} minutes)`)

    // Run initial sync immediately (non-blocking)
    syncWeeklyReports().catch(err => console.error('❌ [NotionSync] Initial sync error:', err.message))

    syncInterval = setInterval(() => {
        syncWeeklyReports().catch(err => console.error('❌ [NotionSync] Scheduled sync error:', err.message))
    }, intervalMs)
}

export function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval)
        syncInterval = null
    }
}

export async function restartAutoSync() {
    stopAutoSync()
    await startAutoSync()
}

export async function getSyncStatus() {
    const config = await getNotionConfig()
    return {
        ...lastSyncStatus,
        configured: !!config,
        syncIntervalMinutes: config?.syncIntervalMinutes || 15,
        history: syncHistory.slice(0, 10)  // Last 10 syncs for admin display
    }
}
