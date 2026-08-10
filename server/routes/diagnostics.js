import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import { userHasAnyRole, requireAdmin } from '../middleware/rbac.js'
import { dbGet, dbAll, IS_POSTGRES } from '../db/init.js'
import { getCacheStatus, getStudentData, getRawCache, getRawEnrollmentCount, normalizeCelebrationPoint, processEnrollment, getStudentById, resolveStudent, resolveStudentMap, upsertAliases } from '../services/thinkific.js'
import { thinkificRest, getThinkificAuthMode } from '../services/thinkific-auth.js'
import { logAudit } from '../services/audit.js'
import { getLogs } from '../lib/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const CACHE_FILE = path.join(__dirname, '../db/cache.json')

// Simple memory cache for API health check to avoid hitting rate limits
let apiHealthCache = {
    data: null,
    timestamp: 0,
    TTL: 60000 // 1 minute
}

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
/**
 * GET /api/diagnostics/schema-check  (Admin only, READ-ONLY — performs no writes)
 *
 * Reports the REAL schema of the write-path tables so the prod constraint state
 * can be confirmed rather than assumed. Exists because a blanket "RETURNING id"
 * on Postgres INSERTs silently failed (42703) for every table without an `id`
 * column, leaving thinkific_students stale/empty while the sync reported success.
 *
 * Reports schema + counts only. Never reports credentials.
 */
const SCHEMA_CHECK_TABLES = [
    'thinkific_students',
    'group_members',
    'formation_group_members',
    'thinkific_submissions',
]

async function describeTable(table) {
    const out = { table, columns: [], has_id_column: false, indexes: [], row_count: null, error: null }
    try {
        if (IS_POSTGRES) {
            const cols = await dbAll(
                'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position',
                [table]
            )
            out.columns = cols.map(c => `${c.column_name}:${c.data_type}`)
            out.has_id_column = cols.some(c => String(c.column_name).toLowerCase() === 'id')
            const idx = await dbAll('SELECT indexname, indexdef FROM pg_indexes WHERE tablename = ?', [table])
            out.indexes = idx.map(i => i.indexdef)
        } else {
            const cols = await dbAll(`PRAGMA table_info(${table})`)
            out.columns = cols.map(c => `${c.name}:${c.type}${c.pk ? ' PK' : ''}`)
            out.has_id_column = cols.some(c => String(c.name).toLowerCase() === 'id')
            const idx = await dbAll(`PRAGMA index_list(${table})`)
            out.indexes = idx.map(i => `${i.name}${i.unique ? ' UNIQUE' : ''}`)
        }
        const cnt = await dbGet(`SELECT COUNT(*) AS n FROM ${table}`)
        out.row_count = parseInt(cnt?.n ?? 0, 10)
    } catch (e) {
        out.error = e.message
    }
    return out
}

router.get('/schema-check', requireAdmin, async (req, res) => {
    try {
        const dialect = IS_POSTGRES ? 'postgres' : 'sqlite'
        const tables = []
        for (const t of SCHEMA_CHECK_TABLES) tables.push(await describeTable(t))

        // thinkific_students health — the table the broken write path targets.
        const students = { count: null, with_progress: null, max_updated_at: null, duplicates: [] }
        try {
            students.count = parseInt((await dbGet('SELECT COUNT(*) AS n FROM thinkific_students'))?.n ?? 0, 10)
            students.with_progress = parseInt((await dbGet('SELECT COUNT(*) AS n FROM thinkific_students WHERE progress > 0'))?.n ?? 0, 10)
            students.max_updated_at = (await dbGet('SELECT MAX(updated_at) AS m FROM thinkific_students'))?.m ?? null
            students.duplicates = await dbAll(
                'SELECT student_id, COUNT(*) AS n FROM thinkific_students GROUP BY student_id HAVING COUNT(*) > 1 LIMIT 20'
            )
        } catch (e) { students.error = e.message }

        // Phase 5 (report only): verifications frozen at 0% that may be wrong.
        const graduation = { zero_progress_rows: null, sample: [] }
        try {
            graduation.zero_progress_rows = parseInt((await dbGet(
                "SELECT COUNT(*) AS n FROM graduation_verifications WHERE online_progress = 0 OR online_progress IS NULL"
            ))?.n ?? 0, 10)
            graduation.sample = await dbAll(
                `SELECT gv.id, gv.student_thinkific_id, gv.student_name, gv.online_progress, gv.status, gv.submitted_at,
                        ts.progress AS table_progress
                 FROM graduation_verifications gv
                 LEFT JOIN thinkific_students ts ON TRIM(ts.thinkific_user_id) = TRIM(gv.student_thinkific_id)
                 WHERE gv.online_progress = 0 OR gv.online_progress IS NULL
                 LIMIT 10`
            )
        } catch (e) { graduation.error = e.message }

        res.json({
            success: true,
            dialect,
            note: 'Read-only. A table with has_id_column=false must never receive "RETURNING id" on Postgres.',
            tables,
            thinkific_students: students,
            graduation_verifications: graduation,
        })
    } catch (e) {
        console.error('[diagnostics] schema-check error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

/**
 * GET /api/diagnostics/resolve-trace  (Admin only, READ-ONLY — performs no writes)
 *
 * Answers with DATA, not inference, why most group members resolve to 0% progress:
 *   W1 = rows genuinely absent from thinkific_students
 *   W2 = rows present but looked up by the wrong identity column
 *
 * ?ids=a,b,c   optional comma-separated ids to trace (defaults below)
 * ?skipLive=1  skip the live Thinkific calls (1e)
 *
 * Reports schema/counts/progress only. NEVER returns a token — auth mode only.
 */
const DEFAULT_TRACE_IDS = [
    '777173231', '779197335', '777173540', '776483845',  // known failing (77x)
    '240655086', '240396230',                             // known working (240x)
]

// SUBSTR + CAST + TRIM all behave the same on Postgres and SQLite.
const AS_TEXT = (col) => `TRIM(CAST(${col} AS TEXT))`

async function idPrefixHistogram(table, column) {
    try {
        const rows = await dbAll(
            `SELECT SUBSTR(${AS_TEXT(column)}, 1, 3) AS prefix, COUNT(*) AS n
             FROM ${table} WHERE ${column} IS NOT NULL
             GROUP BY SUBSTR(${AS_TEXT(column)}, 1, 3)
             ORDER BY COUNT(*) DESC`
        )
        return rows.map(r => ({ prefix: r.prefix, n: parseInt(r.n, 10) }))
    } catch (e) {
        return { error: e.message }
    }
}

async function columnType(table, column) {
    try {
        if (IS_POSTGRES) {
            const r = await dbGet(
                'SELECT data_type FROM information_schema.columns WHERE table_name = ? AND column_name = ?',
                [table, column]
            )
            return r?.data_type || 'unknown'
        }
        const cols = await dbAll(`PRAGMA table_info(${table})`)
        return cols.find(c => c.name === column)?.type || 'unknown'
    } catch (e) { return `error: ${e.message}` }
}

/**
 * POST /api/diagnostics/rebuild-aliases  (Admin only)
 *
 * Rebuilds thinkific_id_aliases by paging /enrollments and harvesting each
 * record's (id → user_id) mapping. Same pass the full sync performs, without the
 * student upserts — so the mapping can be repaired without a full sync.
 * Writes only to thinkific_id_aliases. Audit-logged. Never returns a token.
 */
router.post('/rebuild-aliases', requireAdmin, async (req, res) => {
    const user = req.session.user
    try {
        const mode = await getThinkificAuthMode()
        const totals = { attempted: 0, written: 0, failed: 0 }
        let page = 1, fetched = 0, hasMore = true, lastStatus = null

        while (hasMore) {
            const r = await thinkificRest('get', '/enrollments', { params: { page, limit: 250 } }, { label: 'rebuild-aliases' })
            lastStatus = r.status
            if (r.status !== 200) break
            const items = r.data?.items || r.data?.data || []
            fetched += items.length

            const rep = await upsertAliases(items, 'backfill')
            totals.attempted += rep.attempted
            totals.written += rep.written
            totals.failed += rep.failed

            const pg = r.data?.meta?.pagination || r.data?.pagination || null
            const totalPages = pg?.total_pages || pg?.num_pages || null
            hasMore = items.length >= 250 && (!totalPages || page < totalPages)
            page++
            if (page > 100) { console.warn('[rebuild-aliases] 100-page safety stop'); break }
            if (hasMore) await new Promise(r2 => setTimeout(r2, 150))
        }

        await logAudit(user.name, user.role, 'rebuild_aliases', JSON.stringify({
            enrollments_fetched: fetched, pages: page - 1, ...totals,
        }))

        res.json({
            success: true,
            auth_mode: mode,                 // mode only — never the token
            enrollments_fetched: fetched,
            pages: page - 1,
            last_http_status: lastStatus,
            aliases: totals,
        })
    } catch (e) {
        console.error('[diagnostics] rebuild-aliases error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

/**
 * GET /api/diagnostics/attendance-trace?groupId=  (Admin only, READ-ONLY)
 *
 * The graduation roster counted DISTINCT group_sessions.week_number, while the
 * Attendance/Formation-Groups pages count sessions attended. Where week_number
 * is duplicated (many sessions labelled Wk 1), DISTINCT collapses them and
 * silently discards attendance. This quantifies the gap without changing data.
 *
 * Omit groupId for the cross-group scale summary (1c) only.
 */
router.get('/attendance-trace', requireAdmin, async (req, res) => {
    try {
        const groupId = req.query.groupId ? String(req.query.groupId) : null
        const out = { dialect: IS_POSTGRES ? 'postgres' : 'sqlite', groupId }

        if (groupId) {
            // ── 1a. Session inventory ───────────────────────────────────────
            const sessions = await dbAll(
                `SELECT id, session_date, week_number, did_not_meet
                 FROM group_sessions WHERE formation_group_id = ?
                 ORDER BY session_date`, [groupId]
            )
            const counted = sessions.filter(s => !s.did_not_meet)
            const weekHist = {}
            for (const s of counted) {
                const k = String(s.week_number ?? 'null')
                weekHist[k] = (weekHist[k] || 0) + 1
            }
            out.session_inventory = {
                sessions,
                total_sessions: sessions.length,
                sessions_counted: counted.length,
                distinct_week_numbers: new Set(counted.map(s => String(s.week_number ?? 'null'))).size,
                week_number_histogram: weekHist,
                collapse_detected: new Set(counted.map(s => String(s.week_number ?? 'null'))).size < counted.length,
            }

            // ── 1b. Per-participant: sessions vs distinct-weeks ─────────────
            out.participants = await dbAll(
                `SELECT gm.student_thinkific_id, gm.student_name,
                        COUNT(DISTINCT CASE WHEN sa.attended = 1 AND gs.did_not_meet = 0 THEN gs.id END)          AS sessions_attended,
                        COUNT(DISTINCT CASE WHEN sa.attended = 1 AND gs.did_not_meet = 0 THEN gs.week_number END) AS distinct_weeks_attended
                 FROM group_members gm
                 LEFT JOIN session_attendance sa ON sa.group_member_id = gm.id
                 LEFT JOIN group_sessions gs ON gs.id = sa.session_id
                 WHERE gm.formation_group_id = ? AND gm.active = 1
                 GROUP BY gm.student_thinkific_id, gm.student_name
                 ORDER BY sessions_attended DESC`, [groupId]
            ).then(rows => rows.map(r => ({
                ...r,
                sessions_attended: parseInt(r.sessions_attended || 0, 10),
                distinct_weeks_attended: parseInt(r.distinct_weeks_attended || 0, 10),
                undercount: parseInt(r.sessions_attended || 0, 10) - parseInt(r.distinct_weeks_attended || 0, 10),
            })))
        }

        // ── 1c. Scale across ALL groups ─────────────────────────────────────
        const scale = {}
        try {
            const perGroup = await dbAll(
                `SELECT fg.id, fg.group_code,
                        COUNT(gs.id) AS sessions,
                        COUNT(DISTINCT gs.week_number) AS distinct_weeks
                 FROM formation_groups fg
                 JOIN group_sessions gs ON gs.formation_group_id = fg.id AND gs.did_not_meet = 0
                 GROUP BY fg.id, fg.group_code`
            )
            const affected = perGroup.filter(g => parseInt(g.distinct_weeks, 10) < parseInt(g.sessions, 10))
            scale.groups_with_sessions = perGroup.length
            scale.groups_with_collapse = affected.length
            scale.affected_groups_sample = affected.slice(0, 15).map(g => ({
                group_code: g.group_code, sessions: parseInt(g.sessions, 10), distinct_weeks: parseInt(g.distinct_weeks, 10),
            }))

            const impact = await dbAll(
                `SELECT COUNT(*) AS participants, SUM(diff) AS total_undercount FROM (
                   SELECT gm.id,
                     COUNT(DISTINCT CASE WHEN sa.attended = 1 AND gs.did_not_meet = 0 THEN gs.id END)
                   - COUNT(DISTINCT CASE WHEN sa.attended = 1 AND gs.did_not_meet = 0 THEN gs.week_number END) AS diff
                   FROM group_members gm
                   LEFT JOIN session_attendance sa ON sa.group_member_id = gm.id
                   LEFT JOIN group_sessions gs ON gs.id = sa.session_id
                   WHERE gm.active = 1
                   GROUP BY gm.id
                 ) t WHERE diff > 0`
            )
            scale.participants_undercounted = parseInt(impact[0]?.participants || 0, 10)
            scale.total_sessions_discarded = parseInt(impact[0]?.total_undercount || 0, 10)

            // Threshold crossings: who moves from <13 to >=13 under session counting
            // MIN(a,b) is SQLite's scalar form; Postgres spells it LEAST(a,b).
            const CAP = (expr, n) => IS_POSTGRES ? `LEAST(${expr}, ${n})` : `MIN(${expr}, ${n})`
            const crossings = await dbAll(
                `SELECT COUNT(*) AS n FROM (
                   SELECT gm.id,
                     COUNT(DISTINCT CASE WHEN sa.attended = 1 AND gs.did_not_meet = 0 THEN gs.id END) AS sess,
                     COUNT(DISTINCT CASE WHEN sa.attended = 1 AND gs.did_not_meet = 0 THEN gs.week_number END) AS wks
                   FROM group_members gm
                   LEFT JOIN session_attendance sa ON sa.group_member_id = gm.id
                   LEFT JOIN group_sessions gs ON gs.id = sa.session_id
                   WHERE gm.active = 1
                   GROUP BY gm.id
                 ) t WHERE t.wks < 13 AND ${CAP('t.sess', 16)} >= 13`
            )
            scale.participants_crossing_threshold = parseInt(crossings[0]?.n || 0, 10)
        } catch (e) { scale.error = e.message }
        out.scale = scale

        // ── Phase 4. Snapshot exposure (REPORT ONLY — changes nothing) ──────
        // graduation_verifications froze attended_weeks at submission time, using
        // the old collapsed week-number count. Quantify; do not modify.
        const snapshot_exposure = { note: 'REPORT ONLY — no graduation_verifications rows modified. Correction is Ivan/Joshua\'s decision.' }
        try {
            const CAPX = IS_POSTGRES ? 'LEAST' : 'MIN'
            const rows = await dbAll(
                `SELECT gv.id, gv.student_name, gv.student_thinkific_id, gv.formation_group_id,
                        gv.attended_weeks AS stored_attended_weeks,
                        gv.attendance_met AS stored_attendance_met,
                        gv.recommendation, gv.status,
                        ${CAPX}(COALESCE(sess.n, 0), 16) AS corrected_attended_weeks
                 FROM graduation_verifications gv
                 LEFT JOIN (
                     SELECT gm.formation_group_id AS gid,
                            TRIM(CAST(gm.student_thinkific_id AS TEXT)) AS sid,
                            COUNT(DISTINCT CASE WHEN sa.attended = 1 AND gs.did_not_meet = 0 THEN gs.id END) AS n
                     FROM group_members gm
                     LEFT JOIN session_attendance sa ON sa.group_member_id = gm.id
                     LEFT JOIN group_sessions   gs ON gs.id = sa.session_id
                     WHERE gm.active = 1
                     GROUP BY gm.formation_group_id, TRIM(CAST(gm.student_thinkific_id AS TEXT))
                 ) sess
                   ON sess.gid = gv.formation_group_id
                  AND sess.sid = TRIM(CAST(gv.student_thinkific_id AS TEXT))`
            )
            const undercounted = rows.filter(r => Number(r.corrected_attended_weeks) > Number(r.stored_attended_weeks ?? 0))
            const wouldFlip = undercounted.filter(r =>
                Number(r.corrected_attended_weeks) >= 13 && !Number(r.stored_attendance_met))
            snapshot_exposure.submitted_rows_total = rows.length
            snapshot_exposure.rows_stored_lower_than_corrected = undercounted.length
            snapshot_exposure.rows_that_would_flip_attendance_met = wouldFlip.length
            snapshot_exposure.sample = undercounted.slice(0, 10).map(r => ({
                verification_id: r.id,
                student_name: r.student_name,
                stored_attended_weeks: r.stored_attended_weeks,
                corrected_attended_weeks: Number(r.corrected_attended_weeks),
                recommendation: r.recommendation,
                status: r.status,
            }))
        } catch (e) { snapshot_exposure.error = e.message }
        out.snapshot_exposure = snapshot_exposure

        // ── week_number data-quality (REPORT ONLY — no repair) ──────────────
        const week_number_quality = { note: 'REPORT ONLY — week_number is NOT modified by this endpoint.' }
        try {
            const dup = await dbAll(
                `SELECT formation_group_id, week_number, COUNT(*) AS n
                 FROM group_sessions WHERE did_not_meet = 0
                 GROUP BY formation_group_id, week_number HAVING COUNT(*) > 1`
            )
            week_number_quality.duplicate_week_labels = dup.length
            week_number_quality.sample = dup.slice(0, 10)
            const nulls = await dbGet('SELECT COUNT(*) AS n FROM group_sessions WHERE week_number IS NULL')
            const oob = await dbGet('SELECT COUNT(*) AS n FROM group_sessions WHERE week_number < 1 OR week_number > 16')
            week_number_quality.null_week_number = parseInt(nulls?.n || 0, 10)
            week_number_quality.out_of_range_week_number = parseInt(oob?.n || 0, 10)
        } catch (e) { week_number_quality.error = e.message }
        out.week_number_quality = week_number_quality

        res.json({ success: true, ...out })
    } catch (e) {
        console.error('[diagnostics] attendance-trace error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

/**
 * GET /api/diagnostics/submission-status-check  (Admin only, READ-ONLY)
 *
 * Compares each thinkific_submissions row's stored thinkific_status against the
 * LIVE Thinkific status (fetched via the GraphQL API), and flags mismatches.
 * Diagnoses the Ashley-Businge report: a submission approved on Thinkific shows
 * REJECTED in the portal. Never writes; never returns a token (auth mode only).
 *
 * ?ids=a,b   specific thinkific_submission_id values
 * ?name=x    filter stored rows by student_name (default: Ashley Businge)
 * (no args)  scans ALL stored rows against live — the full mismatch count.
 */
router.get('/submission-status-check', requireAdmin, async (req, res) => {
    try {
        const { fetchLiveSubmissions } = await import('../services/thinkific-submissions.js')
        const authMode = await getThinkificAuthMode()

        // Which stored rows to examine.
        let stored
        if (req.query.ids) {
            const ids = String(req.query.ids).split(',').map(s => s.trim()).filter(Boolean)
            const ph = ids.map(() => '?').join(',')
            stored = await dbAll(
                `SELECT id, thinkific_submission_id, student_name, thinkific_user_id, thinkific_status, portal_review_status, synced_at
                 FROM thinkific_submissions WHERE thinkific_submission_id IN (${ph})`, ids)
        } else {
            const name = req.query.name != null ? String(req.query.name) : 'Ashley Businge'
            stored = await dbAll(
                `SELECT id, thinkific_submission_id, student_name, thinkific_user_id, thinkific_status, portal_review_status, synced_at
                 FROM thinkific_submissions WHERE student_name LIKE ?`, [`%${name}%`])
        }

        // Live status for every submission id (one paged read of the assignment).
        const live = await fetchLiveSubmissions()

        let mismatches = 0
        const rows = stored.map(r => {
            const l = live.get(String(r.thinkific_submission_id))
            const mismatch = !!l && String(l.status) !== String(r.thinkific_status)
            if (mismatch) mismatches++
            return {
                submission_id: r.thinkific_submission_id,
                student_name: r.student_name,
                stored_thinkific_status: r.thinkific_status,
                live_thinkific_status: l ? l.status : '(not found in live list)',
                live_reviewed_at: l?.reviewedAt || null,
                portal_review_status: r.portal_review_status,
                synced_at: r.synced_at,
                mismatch,
                live_missing: !l,
            }
        })

        // Full-population mismatch count (independent of the row filter above).
        let total_stored = 0, total_mismatched = 0, total_live_missing = 0
        try {
            const all = await dbAll('SELECT thinkific_submission_id, thinkific_status FROM thinkific_submissions')
            total_stored = all.length
            for (const r of all) {
                const l = live.get(String(r.thinkific_submission_id))
                if (!l) { total_live_missing++; continue }
                if (String(l.status) !== String(r.thinkific_status)) total_mismatched++
            }
        } catch (e) { /* reported via error field below if it throws */ }

        res.json({
            success: true,
            auth_mode: authMode,                       // mode only — never the token
            live_submission_count: live.size,
            examined: rows.length,
            mismatches_in_examined: mismatches,
            rows,
            population: {
                total_stored,
                total_mismatched,                      // rows whose stored status ≠ live
                total_live_missing,                    // stored rows with no matching live submission (stale ids)
                note: 'total_mismatched>1 suggests a mapping/sync bug; ~0 with a stale row suggests a one-off resubmission.',
            },
        })
    } catch (e) {
        console.error('[diagnostics] submission-status-check error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

/**
 * GET /api/diagnostics/submission-sync-check  (Admin only, READ-ONLY)
 *
 * Diagnoses why re-uploaded / newly-uploaded portfolios aren't surfacing in the
 * Certificate Submissions queue. Compares LIVE Thinkific submissions against the
 * stored thinkific_submissions rows and classifies every discrepancy:
 *   file_changed        — same submission id, but live file_url/name/date differ from stored
 *   live_missing_stored — a live submission with NO stored row (new id not fetched/inserted)
 *   stale_stored        — a stored row with no live match (superseded / removed)
 *   status_changed      — same id, live status ≠ stored
 *
 * ?userId=  one participant's Thinkific user id
 * ?name=    filter by student_name (LIKE)
 * (no args) scans the whole population and returns the discrepancy sample + counts.
 * Never writes; never returns a token (auth mode only).
 */
/**
 * GET /api/diagnostics/submission-completeness  (Admin only, READ-ONLY)
 *
 * The trustworthy completeness measure: portal STORED count vs Thinkific's TRUE
 * total (paged to the very end with retry/pacing — the same path the real sync
 * uses). Portal-vs-portal counts are misleading: a never-fetched submission is
 * absent from both sides and would falsely read "complete".
 *
 * Reports true total, stored total, the difference, a sample of live submissions
 * with NO stored row, per-lesson live vs stored counts, an explicit trace for
 * Edgar Kusasira / kamoga23@yahoo.com, and how many rate-limit waits occurred.
 * Never writes; never returns a token.
 */
router.get('/submission-completeness', requireAdmin, async (req, res) => {
    try {
        const { fetchLiveSubmissions } = await import('../services/thinkific-submissions.js')
        const { getRateLimitWaitCount, resetRateLimitWaitCount } = await import('../services/thinkific-auth.js')
        const authMode = await getThinkificAuthMode()

        resetRateLimitWaitCount()
        const live = await fetchLiveSubmissions()           // paged to the end
        const rate_limit_waits = getRateLimitWaitCount()

        const storedRows = await dbAll('SELECT thinkific_submission_id, student_name, student_email, lesson_id FROM thinkific_submissions')
        const storedIds = new Set(storedRows.map(r => String(r.thinkific_submission_id)))

        // Live submissions with no stored row (the real gap).
        const missing = []
        for (const [sid, l] of live) {
            if (storedIds.has(String(sid))) continue
            let resolves = false
            try { resolves = !!(await resolveStudent(l.userId)) } catch (_) {}
            if (missing.length < 25) {
                missing.push({ submission_id: sid, student_name: l.userName, email: l.email, user_id: l.userId, resolves_to_student: resolves })
            }
        }
        const live_total = live.size
        const stored_total = storedRows.length
        const difference = live_total - storedIds.size  // live not-yet-stored (by id)

        // Per-lesson live vs stored.
        const liveByLesson = {}
        for (const [, l] of live) { const k = l.lessonId || 'unknown'; liveByLesson[k] = (liveByLesson[k] || 0) + 1 }
        const storedByLesson = {}
        for (const r of storedRows) { const k = String(r.lesson_id || 'unknown'); storedByLesson[k] = (storedByLesson[k] || 0) + 1 }
        const per_lesson = [...new Set([...Object.keys(liveByLesson), ...Object.keys(storedByLesson)])]
            .map(lessonId => ({ lessonId, live: liveByLesson[lessonId] || 0, stored: storedByLesson[lessonId] || 0 }))

        // Explicit Edgar trace (name↔email divergence example).
        const edgar = { name: 'Edgar Kusasira', email: 'kamoga23@yahoo.com' }
        const edgarLive = [...live.entries()].filter(([, l]) =>
            (l.userName || '').toLowerCase().includes('edgar') && (l.userName || '').toLowerCase().includes('kusasira')
            || (l.email || '').toLowerCase() === edgar.email)
        const edgarStored = await dbAll(
            `SELECT thinkific_submission_id, student_name, student_email, thinkific_status, portal_review_status
             FROM thinkific_submissions WHERE student_name LIKE ? OR student_email = ?`,
            ['%Edgar%Kusasira%', edgar.email]
        )
        let edgarResolves = null
        if (edgarLive[0]) { try { edgarResolves = !!(await resolveStudent(edgarLive[0][1].userId)) } catch (_) {} }
        edgar.in_live = edgarLive.length > 0
        edgar.live = edgarLive.slice(0, 5).map(([id, l]) => ({ submission_id: id, name: l.userName, email: l.email, user_id: l.userId, status: l.status, file: l.fileName }))
        edgar.in_stored = edgarStored.length > 0
        edgar.stored = edgarStored
        edgar.resolves_to_student = edgarResolves
        edgar.dropped_step = edgar.in_live && !edgar.in_stored
            ? (edgarResolves ? 'fetched but not inserted (ingest gap)' : 'fetched but unresolved identity — likely dropped at ingest')
            : (!edgar.in_live ? 'not present in live fetch (not fetched / not submitted)' : 'present in both')

        res.json({
            success: true,
            auth_mode: authMode,                 // mode only — never the token
            live_total,                          // Thinkific's true count (paged to end)
            stored_total,                        // portal rows
            missing_from_portal: difference,     // live submission ids with no stored row
            rate_limit_waits,                    // >0 means throttling occurred (and was retried)
            per_lesson,
            missing_sample: missing,
            edgar,
            note: 'Proof of completeness = stored_total == live_total (and Edgar in_stored). rate_limit_waits shows throttling was handled, not that data is complete.',
        })
    } catch (e) {
        console.error('[diagnostics] submission-completeness error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

router.get('/submission-sync-check', requireAdmin, async (req, res) => {
    try {
        const { fetchLiveSubmissions } = await import('../services/thinkific-submissions.js')
        const authMode = await getThinkificAuthMode()
        const userId = req.query.userId ? String(req.query.userId).trim() : null
        const name = req.query.name != null ? String(req.query.name).trim() : null

        // TODO(WL101): for ?userId=, a User.assignmentSubmissions(courseIds:[...])
        // query would fetch just that participant's submissions (1 cheap call)
        // instead of paging the whole assignment — much lighter on the rate-limit
        // budget. Kept as full-list for now so ?name= and no-arg scans also work.
        const live = await fetchLiveSubmissions() // Map(submissionId -> {status,fileName,fileUrl,submittedAt,userName,userId,...})

        // Stored rows keyed by submission id.
        const storedRows = await dbAll(
            `SELECT thinkific_submission_id, student_name, thinkific_user_id, file_name, file_url,
                    submitted_at, thinkific_status, portal_review_status, reviewed_by_user_id, reviewed_at
             FROM thinkific_submissions`
        )
        const storedById = new Map(storedRows.map(r => [String(r.thinkific_submission_id), r]))

        const matchesFilter = (l) => {
            if (userId) return String(l.userId) === userId
            if (name) return (l.userName || '').toLowerCase().includes(name.toLowerCase())
            return true
        }
        const norm = (v) => (v == null ? '' : String(v)).trim()

        const discrepancies = []
        const counts = { file_changed: 0, live_missing_stored: 0, status_changed: 0, stale_stored: 0 }

        // Live → stored comparison
        for (const [sid, l] of live) {
            if (!matchesFilter(l)) continue
            const stored = storedById.get(String(sid))
            if (!stored) {
                counts.live_missing_stored++
                discrepancies.push({ kind: 'live_missing_stored', submission_id: sid, student_name: l.userName,
                    live: { file_name: l.fileName, file_url: l.fileUrl, submitted_at: l.submittedAt, status: l.status }, stored: null })
                continue
            }
            const fileChanged = norm(l.fileUrl) !== norm(stored.file_url) || norm(l.fileName) !== norm(stored.file_name) || norm(l.submittedAt) !== norm(stored.submitted_at)
            const statusChanged = norm(l.status) !== norm(stored.thinkific_status)
            if (fileChanged || statusChanged) {
                if (fileChanged) counts.file_changed++
                if (statusChanged) counts.status_changed++
                discrepancies.push({
                    kind: fileChanged ? 'file_changed' : 'status_changed',
                    submission_id: sid, student_name: l.userName,
                    already_reviewed: stored.portal_review_status && stored.portal_review_status !== 'unreviewed' ? stored.portal_review_status : null,
                    live: { file_name: l.fileName, file_url: (l.fileUrl || '').slice(0, 80), submitted_at: l.submittedAt, status: l.status },
                    stored: { file_name: stored.file_name, file_url: (stored.file_url || '').slice(0, 80), submitted_at: stored.submitted_at, status: stored.thinkific_status },
                })
            }
        }

        // Stored → live (stale rows), only within the filtered set
        for (const r of storedRows) {
            const l = live.get(String(r.thinkific_submission_id))
            const inScope = userId ? String(r.thinkific_user_id) === userId : name ? (r.student_name || '').toLowerCase().includes(name.toLowerCase()) : true
            if (inScope && !l) {
                counts.stale_stored++
                if (discrepancies.length < 200) discrepancies.push({ kind: 'stale_stored', submission_id: r.thinkific_submission_id, student_name: r.student_name,
                    stored: { file_name: r.file_name, submitted_at: r.submitted_at, status: r.thinkific_status, portal_review_status: r.portal_review_status }, live: null })
            }
        }

        res.json({
            success: true,
            auth_mode: authMode,               // mode only — never the token
            filter: userId ? { userId } : name ? { name } : 'all',
            live_submission_count: live.size,
            stored_submission_count: storedRows.length,
            counts,
            interpretation: 'file_changed>0 → re-uploads not reflected (C1 update gap or same-id file swap). live_missing_stored>0 → new submission ids not inserted (C2/C3). stale_stored with a matching newer row → C4.',
            sample: discrepancies.slice(0, req.query.userId || req.query.name ? 100 : 25),
        })
    } catch (e) {
        console.error('[diagnostics] submission-sync-check error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

router.get('/resolve-trace', requireAdmin, async (req, res) => {
    try {
        const ids = (req.query.ids ? String(req.query.ids).split(',') : DEFAULT_TRACE_IDS)
            .map(s => String(s).trim()).filter(Boolean)

        // ── 1a. Per-ID trace ────────────────────────────────────────────────
        const traces = []
        for (const id of ids) {
            const t = { id }
            try {
                t.by_student_id_exact = await dbGet('SELECT student_id, thinkific_user_id, progress, name, celebration_point FROM thinkific_students WHERE student_id = ?', [id]) || null
                t.by_student_id_trimmed = await dbGet(`SELECT student_id, thinkific_user_id, progress, name, celebration_point FROM thinkific_students WHERE ${AS_TEXT('student_id')} = ?`, [id]) || null
                t.by_thinkific_user_id_exact = await dbGet('SELECT student_id, thinkific_user_id, progress, name, celebration_point FROM thinkific_students WHERE thinkific_user_id = ?', [id]) || null
                t.by_thinkific_user_id_trimmed = await dbGet(`SELECT student_id, thinkific_user_id, progress, name, celebration_point FROM thinkific_students WHERE ${AS_TEXT('thinkific_user_id')} = ?`, [id]) || null
            } catch (e) { t.db_error = e.message }

            const cached = getStudentById(id)
            t.in_memory_cache = cached
                ? {
                    found: true,
                    matched_on: String(cached.id) === id ? 'id' : (String(cached.userId) === id ? 'userId' : 'other'),
                    progress: cached.progress, name: cached.name,
                }
                : { found: false }

            try {
                const r = await resolveStudent(id, 'resolve-trace')
                t.resolveStudent_result = r ? { id: r.id, userId: r.userId, name: r.name, progress: r.progress, celebration_point: r.celebration_point } : null
            } catch (e) { t.resolveStudent_result = { error: e.message } }

            // Is this id present anywhere in the roster tables?
            try {
                const gm = await dbGet(`SELECT COUNT(*) AS n FROM group_members WHERE ${AS_TEXT('student_thinkific_id')} = ?`, [id])
                const fgm = await dbGet(`SELECT COUNT(*) AS n FROM formation_group_members WHERE ${AS_TEXT('student_id')} = ?`, [id])
                t.roster_presence = { group_members: parseInt(gm?.n || 0, 10), formation_group_members: parseInt(fgm?.n || 0, 10) }
            } catch (e) { t.roster_presence = { error: e.message } }

            traces.push(t)
        }

        // ── 1a(ii). Column types — a text/integer mismatch is a prime suspect ─
        const column_types = {
            'thinkific_students.student_id': await columnType('thinkific_students', 'student_id'),
            'thinkific_students.thinkific_user_id': await columnType('thinkific_students', 'thinkific_user_id'),
            'group_members.student_thinkific_id': await columnType('group_members', 'student_thinkific_id'),
            'formation_group_members.student_id': await columnType('formation_group_members', 'student_id'),
        }

        // ── 1b. ID-shape histogram — THE DECISIVE QUERY ──────────────────────
        const id_shape_histogram = {
            'group_members.student_thinkific_id': await idPrefixHistogram('group_members', 'student_thinkific_id'),
            'formation_group_members.student_id': await idPrefixHistogram('formation_group_members', 'student_id'),
            'thinkific_students.student_id': await idPrefixHistogram('thinkific_students', 'student_id'),
            'thinkific_students.thinkific_user_id': await idPrefixHistogram('thinkific_students', 'thinkific_user_id'),
        }

        // ── 1c. Are student_id and thinkific_user_id the same value? ─────────
        const two_columns = {}
        try {
            two_columns.sample = await dbAll('SELECT student_id, thinkific_user_id, name, progress FROM thinkific_students LIMIT 10')
            const same = await dbGet(`SELECT COUNT(*) AS n FROM thinkific_students WHERE ${AS_TEXT('student_id')} = ${AS_TEXT('thinkific_user_id')}`)
            const diff = await dbGet(`SELECT COUNT(*) AS n FROM thinkific_students WHERE ${AS_TEXT('student_id')} <> ${AS_TEXT('thinkific_user_id')}`)
            const nullTuid = await dbGet('SELECT COUNT(*) AS n FROM thinkific_students WHERE thinkific_user_id IS NULL')
            two_columns.identical_count = parseInt(same?.n || 0, 10)
            two_columns.different_count = parseInt(diff?.n || 0, 10)
            two_columns.null_thinkific_user_id = parseInt(nullTuid?.n || 0, 10)
        } catch (e) { two_columns.error = e.message }

        // ── 1d. Orphans: group members matching NEITHER column ───────────────
        const orphans = {}
        try {
            const totalRow = await dbGet('SELECT COUNT(DISTINCT student_thinkific_id) AS n FROM group_members WHERE student_thinkific_id IS NOT NULL')
            const total = parseInt(totalRow?.n || 0, 10)
            const orphanSql = `
                SELECT DISTINCT ${AS_TEXT('gm.student_thinkific_id')} AS sid
                FROM group_members gm
                WHERE gm.student_thinkific_id IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1 FROM thinkific_students ts
                    WHERE ${AS_TEXT('ts.thinkific_user_id')} = ${AS_TEXT('gm.student_thinkific_id')}
                       OR ${AS_TEXT('ts.student_id')} = ${AS_TEXT('gm.student_thinkific_id')}
                  )`
            const rows = await dbAll(orphanSql)
            const byPrefix = {}
            for (const r of rows) {
                const p = String(r.sid || '').slice(0, 3)
                byPrefix[p] = (byPrefix[p] || 0) + 1
            }
            orphans.total_distinct_group_member_ids = total
            orphans.orphan_count = rows.length
            orphans.orphan_pct = total > 0 ? Math.round((rows.length / total) * 1000) / 10 : 0
            orphans.orphan_by_prefix = byPrefix
            orphans.sample = rows.slice(0, 15).map(r => r.sid)
        } catch (e) { orphans.error = e.message }

        // ── 1e. Live Thinkific check (the decider) ──────────────────────────
        const live = { auth_mode: null, checked: [] }
        if (req.query.skipLive !== '1') {
            try {
                live.auth_mode = await getThinkificAuthMode()   // mode only, never the token
                const failing = ids.filter(i => i.startsWith('77')).slice(0, 3)
                const probeIds = failing.length ? failing : ids.slice(0, 3)
                for (const id of probeIds) {
                    const entry = { id }
                    try {
                        const u = await thinkificRest('get', `/users/${id}`, {}, { label: 'trace-user' })
                        entry.users_endpoint = { status: u.status, exists: u.status === 200 }
                        if (u.status === 200) {
                            entry.users_endpoint.name = `${u.data?.first_name || ''} ${u.data?.last_name || ''}`.trim()
                            entry.users_endpoint.email = u.data?.email || null
                            entry.users_endpoint.company = u.data?.company ?? null
                        }
                    } catch (e) { entry.users_endpoint = { error: e.message } }

                    try {
                        const en = await thinkificRest('get', `/enrollments`, { params: { 'query[user_id]': id, limit: 25 } }, { label: 'trace-enrollments' })
                        const items = en.data?.items || en.data?.data || []
                        entry.enrollments = {
                            status: en.status,
                            count: items.length,
                            courses: items.map(x => ({
                                course_name: x.course_name ?? x.product_name ?? null,
                                course_id: x.course_id ?? null,
                                enrollment_id: x.id ?? null,
                                percentage_completed_raw: x.percentage_completed,
                                raw_type: typeof x.percentage_completed,
                                completed_at: x.completed_at ?? null,
                            })),
                        }
                    } catch (e) { entry.enrollments = { error: e.message } }

                    // Is this id actually an ENROLLMENT id rather than a user id?
                    try {
                        const e1 = await thinkificRest('get', `/enrollments/${id}`, {}, { label: 'trace-enrollment-by-id' })
                        entry.enrollment_by_id = {
                            status: e1.status,
                            is_enrollment_id: e1.status === 200,
                            user_id: e1.status === 200 ? (e1.data?.user_id ?? null) : null,
                            course_name: e1.status === 200 ? (e1.data?.course_name ?? null) : null,
                        }
                    } catch (e) { entry.enrollment_by_id = { error: e.message } }

                    live.checked.push(entry)
                }
            } catch (e) { live.error = e.message }
        } else {
            live.skipped = true
        }

        // ── 2e. Snapshot remediation impact (REPORT ONLY — changes nothing) ──
        // Recommendations submitted while ~97% of members were orphaned froze a
        // false online_progress: 0. Quantify, do not modify.
        const snapshot_remediation = { note: 'REPORT ONLY — no rows modified. Data-correction decision is Ivan/Joshua.' }
        try {
            const thrRow = await dbGet("SELECT value FROM system_settings WHERE key = 'graduation_online_threshold'")
            const threshold = parseInt(thrRow?.value ?? '100', 10) || 100
            snapshot_remediation.online_threshold = threshold

            const zeroRows = await dbAll(
                `SELECT id, student_thinkific_id, student_name, online_progress, online_met, status
                 FROM graduation_verifications
                 WHERE online_progress = 0 OR online_progress IS NULL`
            )
            snapshot_remediation.rows_stored_zero = zeroRows.length

            const resolvedMap = await resolveStudentMap(
                zeroRows.map(r => r.student_thinkific_id), 'snapshot-remediation'
            )
            let wouldChange = 0, wouldFlipMet = 0
            const sample = []
            for (const r of zeroRows) {
                const rec = resolvedMap.get(String(r.student_thinkific_id ?? '').trim())
                const resolvedProgress = rec ? (Number(rec.progress) || 0) : 0
                if (resolvedProgress > 0) {
                    wouldChange++
                    if (resolvedProgress >= threshold && !r.online_met) wouldFlipMet++
                    if (sample.length < 10) {
                        sample.push({
                            verification_id: r.id,
                            student_name: r.student_name,
                            roster_id: r.student_thinkific_id,
                            stored_online_progress: r.online_progress,
                            resolved_online_progress: resolvedProgress,
                            status: r.status,
                        })
                    }
                }
            }
            snapshot_remediation.rows_now_resolving_nonzero = wouldChange
            snapshot_remediation.rows_that_would_flip_online_met = wouldFlipMet
            snapshot_remediation.sample = sample
        } catch (e) { snapshot_remediation.error = e.message }

        // Alias table health
        const aliases = {}
        try {
            aliases.row_count = parseInt((await dbGet('SELECT COUNT(*) AS n FROM thinkific_id_aliases'))?.n ?? 0, 10)
            aliases.max_updated_at = (await dbGet('SELECT MAX(updated_at) AS m FROM thinkific_id_aliases'))?.m ?? null
            aliases.by_source = await dbAll('SELECT source, COUNT(*) AS n FROM thinkific_id_aliases GROUP BY source')
        } catch (e) { aliases.error = e.message }

        res.json({
            success: true,
            dialect: IS_POSTGRES ? 'postgres' : 'sqlite',
            how_to_read: 'orphan_count/orphan_pct is the headline. Rosters store Thinkific ENROLLMENT ids; thinkific_students is keyed by USER id. thinkific_id_aliases bridges them — if aliases.row_count is 0, run POST /api/diagnostics/rebuild-aliases (or a full sync) first.',
            aliases,
            snapshot_remediation,
            column_types,
            traces,
            id_shape_histogram,
            two_columns,
            orphans,
            live_thinkific: live,
        })
    } catch (e) {
        console.error('[diagnostics] resolve-trace error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

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
        // Use cached API check if fresh
        if (apiHealthCache.data && (Date.now() - apiHealthCache.timestamp < apiHealthCache.TTL)) {
            console.log('[Diagnostics] Using cached API health check')
            payload.connectivity = { ...apiHealthCache.data.connectivity, cached: true }
            payload.auth = { ...apiHealthCache.data.auth, cached: true }
        } else {
            try {
                const apiRes = await axios.get(`https://api.thinkific.com/api/public/v1/courses?limit=1`, {
                    headers: { 'X-Auth-API-Key': apiKey, 'X-Auth-Subdomain': subdomain },
                    timeout: 8000
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
            // Update cache
            apiHealthCache.data = { connectivity: payload.connectivity, auth: payload.auth }
            apiHealthCache.timestamp = Date.now()
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
    const thinkificStatus = getCacheStatus()
    payload.backgroundSync = {
        running: true,
        lastSync: thinkificStatus.lastSync ? new Date(thinkificStatus.lastSync).toISOString() : null,
        lastAttempt: thinkificStatus.lastSyncAttempt ? new Date(thinkificStatus.lastSyncAttempt).toISOString() : null,
        lastError: thinkificStatus.error || null,
        // Data quality metrics — populated after first sync
        unknownCount: thinkificStatus.unknownCount,
        unknownCampusCount: thinkificStatus.unknownCampusCount,
        droppedCount: thinkificStatus.droppedCount,
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
    }

    // 9. Cache Freshness — reads scheduler/webhook heartbeat from system_settings
    payload.cacheFreshness = {
        diskCacheAgeMinutes: payload.cacheFile.lastModified
            ? Math.round((Date.now() - new Date(payload.cacheFile.lastModified).getTime()) / 60000)
            : null,
        webhookLastEvent: null,
        cronLastSuccess: null,
        cronLastError: null,
    }
    try {
        const [whRow, cronSuccRow, cronErrRow] = await Promise.all([
            dbGet("SELECT value FROM system_settings WHERE key = 'webhook_last_event'"),
            dbGet("SELECT value FROM system_settings WHERE key = 'cron_thinkific_last_success'"),
            dbGet("SELECT value FROM system_settings WHERE key = 'cron_thinkific_last_error'"),
        ])
        payload.cacheFreshness.webhookLastEvent = whRow?.value ? JSON.parse(whRow.value) : null
        payload.cacheFreshness.cronLastSuccess = cronSuccRow?.value || null
        payload.cacheFreshness.cronLastError = cronErrRow?.value ? JSON.parse(cronErrRow.value) : null
    } catch (e) {
        payload.cacheFreshness.settingsError = e.message
    }

    // 10. Last sync report
    payload.syncReport = null
    try {
        const syncReportRow = await dbGet("SELECT value FROM system_settings WHERE key = 'last_thinkific_sync_report'")
        if (syncReportRow?.value) payload.syncReport = JSON.parse(syncReportRow.value)
    } catch (_) {}

    res.json(payload)
})

// GET /api/diagnostics/student-lookup?email=...&name=...
// Search both the processed cache and raw enrollment cache for a specific student
router.get('/student-lookup', requireDiagnosticsAccess, async (req, res) => {
    const { email, name } = req.query
    if (!email && !name) {
        return res.status(400).json({ success: false, message: 'Provide email or name query param' })
    }

    const { students: allStudents } = await getStudentData()
    const rawUsers = getRawCache() // array of Thinkific user objects {id, first_name, last_name, email, company, ...}

    const emailLower = email?.toLowerCase().trim()
    const nameLower  = name?.toLowerCase().trim()

    const processedMatches = allStudents.filter(s => {
        if (emailLower && s.email?.toLowerCase().includes(emailLower)) return true
        if (nameLower  && s.name?.toLowerCase().includes(nameLower))  return true
        return false
    })

    const rawMatches = rawUsers.filter(u => {
        const userEmail = (u.email || '').toLowerCase()
        const fullName  = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().trim()
        if (emailLower && userEmail.includes(emailLower)) return true
        if (nameLower  && fullName.includes(nameLower))   return true
        return false
    })

    res.json({
        success: true,
        query: { email, name },
        processedCacheMatches: processedMatches,
        rawCacheMatches: rawMatches.map(u => ({
            userId:    u.id,
            firstName: u.first_name,
            lastName:  u.last_name,
            email:     u.email,
            company:   u.company,
            hasName:   !!(u.first_name || u.last_name),
            hasEmail:  !!u.email,
        })),
        summary: {
            foundInProcessed: processedMatches.length,
            foundInRaw:       rawMatches.length,
            totalProcessed:   allStudents.length,
            totalRaw:         rawUsers.length,
        },
    })
})

// GET /api/diagnostics/unknown-students
// Returns students that processed as "Unknown" + raw records with missing user data
router.get('/unknown-students', requireDiagnosticsAccess, async (req, res) => {
    const { students: processed } = await getStudentData()
    const rawUsers = getRawCache()
    const totalEnrollments = getRawEnrollmentCount()

    const unknownProcessed = processed.filter(s =>
        !s.name || s.name === 'Unknown' || s.name.trim() === '' ||
        !s.email || s.email === 'Unknown' || s.email.trim() === ''
    )

    // User objects with missing name or email (most likely to be dropped during processing)
    const rawProblematic = rawUsers.filter(u =>
        !u || !u.email || (!u.first_name && !u.last_name)
    )

    const droppedCount = totalEnrollments > 0 ? totalEnrollments - processed.length : null

    res.json({
        success: true,
        unknownInProcessedCache:  unknownProcessed.length,
        problematicInRawCache:    rawProblematic.length,
        droppedDuringProcessing:  droppedCount,
        totalProcessed:           processed.length,
        totalRawUsers:            rawUsers.length,
        totalEnrollments,
        unknownRecords:           unknownProcessed.slice(0, 50),
        rawProblematicSample:     rawProblematic.slice(0, 20).map(u => ({
            userId:    u?.id,
            firstName: u?.first_name,
            lastName:  u?.last_name,
            email:     u?.email,
            company:   u?.company,
            hasName:   !!(u?.first_name || u?.last_name),
            hasEmail:  !!u?.email,
        })),
    })
})

// GET /api/diagnostics/thinkific-raw-test?email=...
// Tests the Thinkific API directly — page 1 of enrollments + users, plus optional email search
router.get('/thinkific-raw-test', requireDiagnosticsAccess, async (req, res) => {
    const results = {}
    const { apiKey, subdomain } = await getThinkificConfig()
    results.credentials = {
        hasApiKey: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : null,
        subdomain: subdomain || null,
    }

    if (!apiKey || !subdomain) {
        return res.json({ success: false, results, error: 'Missing credentials' })
    }

    const headers = { 'X-Auth-API-Key': apiKey, 'X-Auth-Subdomain': subdomain, 'Content-Type': 'application/json' }

    // Test v1 enrollments
    try {
        const r = await axios.get('https://api.thinkific.com/api/public/v1/enrollments', {
            headers, params: { page: 1, limit: 5 }, timeout: 10000
        })
        const items = r.data?.items || r.data?.data || []
        results.v1Enrollments = {
            status: r.status,
            totalFromPagination: r.data?.meta?.pagination?.total ?? r.data?.pagination?.total ?? 'not found',
            numPagesFromPagination: r.data?.meta?.pagination?.num_pages ?? 'not found',
            itemsOnPage1: items.length,
            sampleKeys: items.length > 0 ? Object.keys(items[0]) : [],
            sampleItem: items.length > 0 ? {
                id: items[0].id, user_id: items[0].user_id, user_email: items[0].user_email,
                user_name: items[0].user_name, course_name: items[0].course_name,
                course_id: items[0].course_id, percentage_completed: items[0].percentage_completed,
                has_user_object: !!items[0].user,
            } : null,
        }
    } catch (err) {
        results.v1Enrollments = { error: err.message, status: err.response?.status, body: err.response?.data }
    }

    // Test v1 users
    try {
        const r = await axios.get('https://api.thinkific.com/api/public/v1/users', {
            headers, params: { page: 1, limit: 5 }, timeout: 10000
        })
        const items = r.data?.items || r.data?.data || []
        results.v1Users = {
            status: r.status,
            totalFromPagination: r.data?.meta?.pagination?.total ?? r.data?.pagination?.total ?? 'not found',
            numPages: r.data?.meta?.pagination?.num_pages ?? 'not found',
            itemsOnPage1: items.length,
            sampleKeys: items.length > 0 ? Object.keys(items[0]) : [],
            sampleItem: items.length > 0 ? {
                id: items[0].id, first_name: items[0].first_name, last_name: items[0].last_name,
                email: items[0].email, company: items[0].company,
                last_sign_in_at: items[0].last_sign_in_at, has_company: !!items[0].company,
            } : null,
        }
    } catch (err) {
        results.v1Users = { error: err.message, status: err.response?.status, body: err.response?.data }
    }

    // Optional email search on users endpoint
    const testEmail = req.query.email || 'kasulech@yahoo.com'
    try {
        const r = await axios.get('https://api.thinkific.com/api/public/v1/users', {
            headers, params: { page: 1, limit: 50, query: { email: testEmail } }, timeout: 10000
        })
        const items = r.data?.items || r.data?.data || []
        results.userSearch = {
            searchEmail: testEmail, status: r.status, found: items.length,
            user: items.length > 0 ? {
                id: items[0].id, first_name: items[0].first_name, last_name: items[0].last_name,
                email: items[0].email, company: items[0].company,
            } : null,
        }
    } catch (err) {
        results.userSearch = { error: err.message, status: err.response?.status }
    }

    res.json({ success: true, results })
})

// GET /api/diagnostics/thinkific-user-search?email=...
// Searches Thinkific directly for a user by email — bypasses cache
router.get('/thinkific-user-search', requireDiagnosticsAccess, async (req, res) => {
    const { email } = req.query
    if (!email) return res.status(400).json({ success: false, message: 'email query param required' })

    const { apiKey, subdomain } = await getThinkificConfig()
    if (!apiKey || !subdomain) return res.status(500).json({ success: false, message: 'Missing Thinkific credentials' })

    const headers = { 'X-Auth-API-Key': apiKey, 'X-Auth-Subdomain': subdomain, 'Content-Type': 'application/json' }

    try {
        const r = await axios.get('https://api.thinkific.com/api/public/v1/users', {
            headers, params: { page: 1, limit: 100, query: { email } }, timeout: 15000
        })
        const items = r.data?.items || r.data?.data || []

        if (items.length === 0) {
            // Fall back to enrollment search by email
            try {
                const r2 = await axios.get('https://api.thinkific.com/api/public/v1/enrollments', {
                    headers, params: { page: 1, limit: 100, query: { user_email: email } }, timeout: 15000
                })
                const enrollments = r2.data?.items || r2.data?.data || []
                return res.json({
                    success: true, searchedEmail: email, foundInUsers: 0,
                    foundInEnrollments: enrollments.length,
                    enrollments: enrollments.map(e => ({
                        id: e.id, user_id: e.user_id, user_email: e.user_email,
                        user_name: e.user_name, course_name: e.course_name,
                        percentage_completed: e.percentage_completed,
                    })),
                    message: enrollments.length === 0 ? 'Not found in Thinkific — student may not exist under this email' : null,
                })
            } catch (err2) {
                return res.json({ success: true, searchedEmail: email, foundInUsers: 0, foundInEnrollments: 0, message: 'Not found in Thinkific', enrollmentSearchError: err2.message })
            }
        }

        // Found — also fetch their enrollments
        let enrollments = []
        try {
            const enrollRes = await axios.get('https://api.thinkific.com/api/public/v1/enrollments', {
                headers, params: { page: 1, limit: 100, query: { user_id: items[0].id } }, timeout: 15000
            })
            enrollments = enrollRes.data?.items || enrollRes.data?.data || []
        } catch (_) {}

        res.json({
            success: true, searchedEmail: email, foundInUsers: items.length,
            user: {
                id: items[0].id, first_name: items[0].first_name, last_name: items[0].last_name,
                email: items[0].email, company: items[0].company, last_sign_in_at: items[0].last_sign_in_at,
            },
            enrollments: enrollments.map(e => ({
                id: e.id, course_name: e.course_name, course_id: e.course_id,
                percentage_completed: e.percentage_completed, activated_at: e.activated_at,
            })),
            inWL101: enrollments.some(e => {
                const name = (e.course_name || '').toLowerCase()
                return name.includes('leadership 101') || name.includes('wl101') || name.includes('watoto leadership')
            }),
        })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, status: err.response?.status, body: err.response?.data })
    }
})

// GET /api/diagnostics/student-progress/:userId
// Returns raw cache + DB record for one student — debugs 0% progress issues
router.get('/student-progress/:userId', requireDiagnosticsAccess, async (req, res) => {
    const { userId } = req.params
    const student = getStudentById(userId)
    let dbRecord = null
    try {
        const sql = IS_POSTGRES
            ? 'SELECT student_id, thinkific_user_id, name, progress, risk_category, enrollment_status, celebration_point, updated_at FROM thinkific_students WHERE thinkific_user_id = $1'
            : 'SELECT student_id, thinkific_user_id, name, progress, risk_category, enrollment_status, celebration_point, updated_at FROM thinkific_students WHERE thinkific_user_id = ?'
        dbRecord = await dbGet(sql, [userId])
    } catch (e) {
        console.warn('[Diagnostics] student-progress DB error:', e.message)
    }
    res.json({
        success: true,
        inCache: !!student,
        progress: student?.progress ?? null,
        student: student ? {
            userId: student.userId,
            name: student.name,
            email: student.email,
            progress: student.progress,
            celebration_point: student.celebration_point,
            risk_category: student.risk_category,
            status: student.status,
            daysInactive: student.daysInactive,
            lastActivity: student.lastActivity,
        } : null,
        dbRecord: dbRecord ? {
            progress: dbRecord.progress,
            risk_category: dbRecord.risk_category,
            enrollment_status: dbRecord.enrollment_status,
            celebration_point: dbRecord.celebration_point,
            updated_at: dbRecord.updated_at,
        } : null,
        hint: !student ? 'Student not found in memory cache. Try triggering a Thinkific sync.' :
              student.progress === 0 ? 'Progress is 0 — may be a re-enrollment reset. Check raw enrollment data via /thinkific-user-search.' :
              null,
    })
})

// POST /api/diagnostics/sync-dry-run
// Runs a test sync (page 1 only) without persisting to cache — reveals API shape and filter results
router.post('/sync-dry-run', requireDiagnosticsAccess, async (req, res) => {
    const { apiKey, subdomain } = await getThinkificConfig()
    if (!apiKey || !subdomain) return res.status(500).json({ success: false, message: 'Missing Thinkific credentials' })

    const headers = { 'X-Auth-API-Key': apiKey, 'X-Auth-Subdomain': subdomain, 'Content-Type': 'application/json' }

    try {
        const report = { step1_enrollments: null, step2_users: null, step3_join: null, step4_filter: null, step5_process: null, sampleStudents: [], errors: [] }

        // Step 1: Fetch enrollments page 1
        const enrollRes = await axios.get('https://api.thinkific.com/api/public/v1/enrollments', {
            headers, params: { page: 1, limit: 250 }, timeout: 30000
        })
        const enrollItems = enrollRes.data?.items || []
        const enrollPagination = enrollRes.data?.meta?.pagination || enrollRes.data?.pagination || {}
        report.step1_enrollments = {
            page1Count: enrollItems.length,
            totalReported: enrollPagination.total ?? 'N/A',
            numPages: enrollPagination.num_pages ?? 'N/A',
            sampleKeys: enrollItems.length > 0 ? Object.keys(enrollItems[0]) : [],
            hasCourseName: enrollItems.length > 0 && !!enrollItems[0].course_name,
            hasUserObject: enrollItems.length > 0 && !!enrollItems[0].user,
            courseNames: [...new Set(enrollItems.slice(0, 50).map(e => e.course_name).filter(Boolean))],
        }

        // Step 2: Fetch users page 1
        const usersRes = await axios.get('https://api.thinkific.com/api/public/v1/users', {
            headers, params: { page: 1, limit: 250 }, timeout: 30000
        })
        const userItems = usersRes.data?.items || []
        const userPagination = usersRes.data?.meta?.pagination || usersRes.data?.pagination || {}
        const companyValueCounts = {}
        userItems.forEach(u => {
            const raw = u.company || '(empty)'
            companyValueCounts[raw] = (companyValueCounts[raw] || 0) + 1
        })
        report.step2_users = {
            page1Count: userItems.length,
            totalReported: userPagination.total ?? 'N/A',
            numPages: userPagination.num_pages ?? 'N/A',
            sampleKeys: userItems.length > 0 ? Object.keys(userItems[0]) : [],
            hasCompany: userItems.length > 0 && !!userItems[0].company,
            companyExamples: [...new Set(userItems.slice(0, 30).map(u => u.company).filter(Boolean))].slice(0, 10),
            companyValueCounts,
            unmappedCompanies: Object.keys(companyValueCounts).filter(v =>
                v !== '(empty)' && normalizeCelebrationPoint(v) === 'Unknown'
            ),
        }

        // Step 3: Join enrollments with users
        const userMap = new Map(userItems.map(u => [String(u.id), u]))
        const joined = enrollItems.map(e => ({ ...e, user: userMap.get(String(e.user_id)) || null }))
        const joinedWithUser = joined.filter(e => e.user !== null)
        report.step3_join = {
            totalEnrollments: enrollItems.length,
            matchedWithUser: joinedWithUser.length,
            noUserMatch: enrollItems.length - joinedWithUser.length,
            note: 'page 1 only — full sync needs all pages from both endpoints',
        }

        // Step 4: WL101 course filter
        const wl101 = joined.filter(e => {
            const name = (e.course_name || '').toLowerCase()
            return name.includes('leadership 101') || name.includes('wl101') || name.includes('watoto leadership')
        })
        report.step4_filter = {
            beforeFilter: joined.length,
            afterFilter: wl101.length,
            filterMatched: wl101.length > 0,
            courseNamesFound: [...new Set(joined.map(e => e.course_name).filter(Boolean))],
            wl101CourseNames: [...new Set(wl101.map(e => e.course_name))],
        }

        // Step 5: Process a sample (does not touch in-memory cache)
        const toProcess = (wl101.length > 0 ? wl101 : joined).slice(0, 10)
        const processed = toProcess.map(e => {
            try { return processEnrollment(e) } catch (err) { report.errors.push(err.message); return null }
        }).filter(Boolean)
        report.step5_process = { attempted: toProcess.length, succeeded: processed.length, failed: toProcess.length - processed.length }
        report.sampleStudents = processed.slice(0, 5).map(s => ({
            userId: s.userId, name: s.name, email: s.email, campus: s.campus,
            progress: s.progress, rawCampus: s.rawCampus,
        }))

        res.json({ success: true, report })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, body: err.response?.data })
    }
})

// GET /api/diagnostics/logs — recent server log entries for the Live Logs viewer
router.get('/logs', requireDiagnosticsAccess, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 500)
  const level = req.query.level || null
  res.json({ success: true, logs: getLogs(limit, level) })
})

export default router
