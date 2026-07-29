/**
 * Gate 2 — Graduation Verification (commissioning)
 *
 * Facilitators/CoFacilitators recommend each participant (complete / exception /
 * not_recommended) against auto-computed attendance (≥13/16 weeks) and online
 * progress. Coordinators/Pastors/Admin approve or reject. Pure portal data.
 *
 * All writes are audit-logged. RBAC via server/middleware/rbac.js only.
 */
import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAuth, applyCampusScope, requireGraduationApprover, userRoles, userHasAnyRole } from '../middleware/rbac.js'
import { logAudit } from '../services/audit.js'
import { resolveStudentMap } from '../services/thinkific.js'
import { getAttendedSessionsByGroup } from '../services/attendance-calc.js'

const router = express.Router()

// Program criteria. Attendance requirement is fixed at 13 of 16 weeks.
// Mirrors server/services/attendance-calc.js (shared attendance definition).
// TODO(WL101): promote REQUIRED_WEEKS to a system_setting if it needs tuning.
const REQUIRED_WEEKS = 13
const TOTAL_WEEKS = 16
const DEFAULT_COHORT = '2026'

async function getOnlineThreshold() {
    const row = await dbGet("SELECT value FROM system_settings WHERE key = 'graduation_online_threshold'")
    const n = parseInt(row?.value ?? '100', 10)
    return Number.isFinite(n) ? n : 100
}

// Group-ownership / campus-scope check mirroring attendance.js checkGroupAccess.
function canAccessGroup(user, group) {
    if (!group) return false
    const roles = userRoles(user)
    if (roles.includes('Admin') || roles.includes('LeadershipTeam')) return true
    if (roles.includes('Facilitator') || roles.includes('CoFacilitator')) {
        if (Number(group.facilitator_user_id) === Number(user.id) ||
            Number(group.co_facilitator_user_id) === Number(user.id)) return true
    }
    if (roles.some(r => ['Coordinator', 'Pastor', 'TechSupport'].includes(r))) {
        return group.celebration_point === user.celebration_point
    }
    return false
}

function isFacilitatorOf(user, group) {
    if (!group) return false
    if (userHasAnyRole(user, ['Admin'])) return true
    return Number(group.facilitator_user_id) === Number(user.id) ||
        Number(group.co_facilitator_user_id) === Number(user.id)
}

// Who may SUBMIT a recommendation: the group's facilitator/co-facilitator, or —
// as a fallback when the facilitator doesn't act — a Coordinator/Pastor in the
// same campus, or an Admin. The submitter is recorded on the row + audit log.
function canSubmitVerification(user, group) {
    if (!group) return false
    if (isFacilitatorOf(user, group)) return true
    if (userHasAnyRole(user, ['Coordinator', 'Pastor'])) {
        return group.celebration_point === user.celebration_point
    }
    return false
}

// Compute attendance + online progress + existing verification for every active
// member of a group.
// NOTE on identity: group_members.student_thinkific_id stores a Thinkific
// ENROLLMENT id for most participants, while thinkific_students is keyed by
// USER id. Resolution therefore goes through the shared resolver, which falls
// back to thinkific_id_aliases (enrollment id → user id). Do not "simplify"
// this to a direct join — that is what made ~97% of members read 0%.
async function computeRoster(group, threshold) {
    const groupId = group.id
    const cohort = group.cohort || DEFAULT_COHORT

    const members = await dbAll(
        `SELECT id AS group_member_id, student_thinkific_id, student_name, student_email
         FROM group_members WHERE formation_group_id = ? AND active = 1`,
        [groupId]
    )

    // Attendance via the SHARED helper: distinct SESSIONS attended (capped at
    // TOTAL_WEEKS), not distinct week_number. Counting week_number collapsed
    // duplicate labels and made a 16/16 participant read 3/16. The Attendance and
    // Formation-Groups pages use this same definition, so they cannot disagree.
    const attMap = await getAttendedSessionsByGroup(groupId, TOTAL_WEEKS)

    // Existing verification rows for this group/cohort
    const verRows = await dbAll(
        `SELECT * FROM graduation_verifications WHERE formation_group_id = ? AND cohort = ?`,
        [groupId, cohort]
    )
    const verMap = new Map(verRows.map(v => [String(v.student_thinkific_id), v]))

    // Batched shared resolver (cache → user_id → student_id → enrollment-id alias),
    // keyed by the original roster id. One batch instead of one query per member.
    const resolved = await resolveStudentMap(
        members.map(m => m.student_thinkific_id),
        `graduation group ${groupId}`
    )

    let mismatches = 0
    const roster = []
    for (const m of members) {
        const sid = String(m.student_thinkific_id)
        const ts = resolved.get(String(sid).trim()) || null
        if (!ts) mismatches++

        const attendedWeeks = attMap.get(sid) || 0
        const onlineProgress = ts ? (Number(ts.progress) || 0) : 0
        const attendanceMet = attendedWeeks >= REQUIRED_WEEKS ? 1 : 0
        const onlineMet = onlineProgress >= threshold ? 1 : 0
        const existing = verMap.get(sid) || null

        roster.push({
            student_thinkific_id: sid,
            student_name: m.student_name || ts?.name || `Student ${sid}`,
            student_email: m.student_email || ts?.email || '',
            formation_group_id: groupId,
            celebration_point: group.celebration_point,
            cohort,
            attended_weeks: attendedWeeks,
            total_weeks: TOTAL_WEEKS,
            attendance_met: attendanceMet,
            online_progress: onlineProgress,
            online_met: onlineMet,
            required_weeks: REQUIRED_WEEKS,
            online_threshold: threshold,
            verification: existing
        })
    }
    if (mismatches > 0) {
        console.warn(`[graduation] computeRoster group ${groupId}: ${mismatches} member(s) had no thinkific_students match`)
    }
    return roster
}

// ─── GET /roster?groupId= ─────────────────────────────────────────────────
// Facilitator/CoFac → own group; Coordinator/Pastor → own campus; Admin/Leadership → all.
router.get('/roster', requireAuth, async (req, res) => {
    try {
        const groupId = req.query.groupId
        if (!groupId) return res.status(400).json({ success: false, message: 'groupId required' })
        const group = await dbGet(
            'SELECT id, group_code, celebration_point, cohort, facilitator_user_id, co_facilitator_user_id FROM formation_groups WHERE id = ?',
            [groupId]
        )
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })
        if (!canAccessGroup(req.session.user, group)) {
            return res.status(403).json({ success: false, message: 'Access denied for this group' })
        }
        const threshold = await getOnlineThreshold()
        const roster = await computeRoster(group, threshold)
        res.json({ success: true, group, required_weeks: REQUIRED_WEEKS, total_weeks: TOTAL_WEEKS, online_threshold: threshold, roster })
    } catch (e) {
        console.error('[graduation] /roster error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

// ─── POST /verify ─────────────────────────────────────────────────────────
// Facilitator/CoFac submit/update a recommendation for one participant.
router.post('/verify', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const {
            student_thinkific_id, formation_group_id,
            recommendation, justification, reason_for_gap, evidence_category, remarks
        } = req.body || {}

        if (!student_thinkific_id || !formation_group_id) {
            return res.status(400).json({ success: false, message: 'student_thinkific_id and formation_group_id required' })
        }
        if (!['complete', 'exception', 'not_recommended'].includes(recommendation)) {
            return res.status(400).json({ success: false, message: 'Invalid recommendation' })
        }
        if (recommendation === 'exception' && !(justification && justification.trim())) {
            return res.status(400).json({ success: false, message: 'Justification is required for an exception recommendation' })
        }

        const group = await dbGet(
            'SELECT id, celebration_point, cohort, facilitator_user_id, co_facilitator_user_id FROM formation_groups WHERE id = ?',
            [formation_group_id]
        )
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })
        if (!canSubmitVerification(user, group)) {
            return res.status(403).json({ success: false, message: 'Only the group facilitator/co-facilitator, or a coordinator/pastor for this campus, may submit recommendations' })
        }

        // Snapshot the computed criteria for this participant onto the row.
        const threshold = await getOnlineThreshold()
        const roster = await computeRoster(group, threshold)
        const snap = roster.find(r => r.student_thinkific_id === String(student_thinkific_id))
        if (!snap) return res.status(404).json({ success: false, message: 'Participant not found in this group roster' })

        const cohort = group.cohort || DEFAULT_COHORT
        const existing = await dbGet(
            'SELECT id FROM graduation_verifications WHERE student_thinkific_id = ? AND formation_group_id = ? AND cohort = ?',
            [String(student_thinkific_id), formation_group_id, cohort]
        )

        if (existing) {
            await dbRun(
                `UPDATE graduation_verifications SET
                    student_name = ?, student_email = ?, celebration_point = ?,
                    attended_weeks = ?, total_weeks = ?, attendance_met = ?,
                    online_progress = ?, online_met = ?, facilitator_user_id = ?,
                    recommendation = ?, reason_for_gap = ?, evidence_category = ?,
                    justification = ?, remarks = ?, status = 'submitted',
                    submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [snap.student_name, snap.student_email, group.celebration_point,
                 snap.attended_weeks, snap.total_weeks, snap.attendance_met,
                 snap.online_progress, snap.online_met, user.id,
                 recommendation, reason_for_gap || null, evidence_category || null,
                 justification || null, remarks || null, existing.id]
            )
        } else {
            await dbRun(
                `INSERT INTO graduation_verifications
                    (student_thinkific_id, student_id, student_name, student_email,
                     formation_group_id, celebration_point, cohort,
                     attended_weeks, total_weeks, attendance_met, online_progress, online_met,
                     facilitator_user_id, recommendation, reason_for_gap, evidence_category,
                     justification, remarks, status, submitted_at, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [String(student_thinkific_id), String(student_thinkific_id), snap.student_name, snap.student_email,
                 formation_group_id, group.celebration_point, cohort,
                 snap.attended_weeks, snap.total_weeks, snap.attendance_met, snap.online_progress, snap.online_met,
                 user.id, recommendation, reason_for_gap || null, evidence_category || null,
                 justification || null, remarks || null]
            )
        }

        await logAudit(user.name, user.role, 'graduation_recommend', JSON.stringify({
            student_thinkific_id, formation_group_id, cohort, recommendation,
            attended_weeks: snap.attended_weeks, online_progress: snap.online_progress
        }))

        const saved = await dbGet(
            'SELECT * FROM graduation_verifications WHERE student_thinkific_id = ? AND formation_group_id = ? AND cohort = ?',
            [String(student_thinkific_id), formation_group_id, cohort]
        )
        res.json({ success: true, verification: saved })
    } catch (e) {
        console.error('[graduation] /verify error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

// ─── GET /review?campus=&groupId=&status= ─────────────────────────────────
// Aggregated roll-up for approvers, campus-scoped.
router.get('/review', requireAuth, requireGraduationApprover, applyCampusScope, async (req, res) => {
    try {
        const conditions = []
        const params = []
        // req.scopedCelebrationPoint: null for global roles (unless campus filter given)
        if (req.scopedCelebrationPoint) { conditions.push('gv.celebration_point = ?'); params.push(req.scopedCelebrationPoint) }
        if (req.query.groupId) { conditions.push('gv.formation_group_id = ?'); params.push(req.query.groupId) }
        if (req.query.status) { conditions.push('gv.status = ?'); params.push(req.query.status) }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

        const rows = await dbAll(
            `SELECT gv.*, fg.group_code
             FROM graduation_verifications gv
             LEFT JOIN formation_groups fg ON fg.id = gv.formation_group_id
             ${where}
             ORDER BY gv.celebration_point, fg.group_code, gv.student_name`,
            params
        )
        res.json({ success: true, verifications: rows })
    } catch (e) {
        console.error('[graduation] /review error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

// ─── POST /review/:id ─────────────────────────────────────────────────────
// Approve/reject. Supports a single record (:id) or a bulk array body { ids: [...] }.
router.post('/review/:id', requireAuth, requireGraduationApprover, async (req, res) => {
    try {
        const user = req.session.user
        const { decision, review_note, pastor_consulted } = req.body || {}
        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ success: false, message: "decision must be 'approved' or 'rejected'" })
        }

        // Bulk: { ids: [...] } in the body; else single :id from the path.
        const ids = Array.isArray(req.body?.ids) && req.body.ids.length ? req.body.ids : [req.params.id]
        const results = []

        for (const id of ids) {
            const row = await dbGet('SELECT * FROM graduation_verifications WHERE id = ?', [id])
            if (!row) { results.push({ id, ok: false, message: 'not found' }); continue }

            // Campus scope: non-global approvers may only act on their own campus.
            if (!userHasAnyRole(user, ['Admin', 'LeadershipTeam'])) {
                if (row.celebration_point !== user.celebration_point) {
                    results.push({ id, ok: false, message: 'campus scope denied' }); continue
                }
            }

            await dbRun(
                `UPDATE graduation_verifications SET
                    status = ?, coordinator_user_id = ?, review_note = ?,
                    pastor_consulted = ?, pastor_consulted_user_id = ?,
                    reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [decision, user.id, review_note || null,
                 pastor_consulted ? 1 : (row.pastor_consulted || 0),
                 pastor_consulted ? user.id : (row.pastor_consulted_user_id || null),
                 id]
            )
            await logAudit(user.name, user.role, 'graduation_review', JSON.stringify({
                verification_id: id, student_thinkific_id: row.student_thinkific_id,
                decision, pastor_consulted: !!pastor_consulted
            }))
            results.push({ id, ok: true })
        }

        res.json({ success: true, results })
    } catch (e) {
        console.error('[graduation] /review/:id error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

// ─── GET /summary ─────────────────────────────────────────────────────────
// Graduation Dashboard data. Every ACTIVE roster member (group_members.active=1)
// falls into exactly one bucket. Computed as roster LEFT JOIN verifications — NOT
// by grouping the verifications table (which omits everyone who hasn't started).
// Campus-scoped by role via applyCampusScope; optional ?campus= (validated there).
function emptyBuckets() {
    return {
        approved_for_graduation: 0,
        approved_with_exceptions: 0,
        pending_approval: 0,
        pending_approval_with_exception: 0,
        pending_approval_without_exception: 0,
        pending_recommendation: 0,
        not_recommended_declined: 0,
        other: 0,
        total: 0,
    }
}
// Map the SQL bucket token onto the response counters (keeps buckets mutually exclusive).
function addBucket(acc, bucket, n) {
    acc.total += n
    switch (bucket) {
        case 'approved': acc.approved_for_graduation += n; break
        case 'approved_exceptions': acc.approved_with_exceptions += n; break
        case 'pending_approval_exception':
            acc.pending_approval += n; acc.pending_approval_with_exception += n; break
        case 'pending_approval':
            acc.pending_approval += n; acc.pending_approval_without_exception += n; break
        case 'pending_recommendation': acc.pending_recommendation += n; break
        case 'not_recommended': acc.not_recommended_declined += n; break
        default: acc.other += n
    }
}

router.get('/summary', requireAuth, requireGraduationApprover, applyCampusScope, async (req, res) => {
    try {
        const params = []
        let campusFilter = ''
        if (req.scopedCelebrationPoint) { campusFilter = 'AND fg.celebration_point = ?'; params.push(req.scopedCelebrationPoint) }

        // One pass: bucket every active roster member (priority order in the CASE
        // keeps buckets mutually exclusive), grouped by campus.
        const rows = await dbAll(
            `SELECT campus, bucket, COUNT(*) AS n FROM (
               SELECT fg.celebration_point AS campus,
                 CASE
                   WHEN gv.id IS NULL THEN 'pending_recommendation'
                   WHEN gv.status = 'rejected' OR gv.recommendation = 'not_recommended' THEN 'not_recommended'
                   WHEN gv.status = 'approved' AND gv.recommendation = 'exception' THEN 'approved_exceptions'
                   WHEN gv.status = 'approved' THEN 'approved'
                   WHEN gv.status = 'submitted' AND gv.recommendation = 'exception' THEN 'pending_approval_exception'
                   WHEN gv.status = 'submitted' THEN 'pending_approval'
                   ELSE 'other'
                 END AS bucket
               FROM group_members gm
               JOIN formation_groups fg ON fg.id = gm.formation_group_id
               LEFT JOIN graduation_verifications gv
                 ON gv.student_thinkific_id = gm.student_thinkific_id
                AND gv.formation_group_id = gm.formation_group_id
                AND gv.cohort = COALESCE(fg.cohort, '2026')
               WHERE gm.active = 1 ${campusFilter}
             ) t GROUP BY campus, bucket`,
            params
        )

        const totals = emptyBuckets()
        const perCampus = new Map()
        for (const r of rows) {
            const n = parseInt(r.n, 10) || 0
            addBucket(totals, r.bucket, n)
            const key = r.campus || 'Unknown'
            if (!perCampus.has(key)) perCampus.set(key, emptyBuckets())
            addBucket(perCampus.get(key), r.bucket, n)
        }

        const total_roster = totals.total
        const verified = total_roster - totals.pending_recommendation // has a verification row
        const verified_pct = total_roster > 0 ? Math.round((verified / total_roster) * 100) : 0

        const sum_of_all_buckets =
            totals.approved_for_graduation + totals.approved_with_exceptions +
            totals.pending_approval + totals.pending_recommendation +
            totals.not_recommended_declined + totals.other
        const reconciliation = { sum_of_all_buckets, total_roster, balances: sum_of_all_buckets === total_roster }

        const by_campus = [...perCampus.entries()]
            .map(([celebration_point, b]) => ({ celebration_point, ...b }))
            .sort((a, b) => a.celebration_point.localeCompare(b.celebration_point))

        // Legacy keys (kept additively; no known consumers) — from the verifications table.
        const legacyWhere = req.scopedCelebrationPoint ? 'WHERE gv.celebration_point = ?' : ''
        const legacyParams = req.scopedCelebrationPoint ? [req.scopedCelebrationPoint] : []
        const byStatus = await dbAll(`SELECT status, COUNT(*) AS n FROM graduation_verifications gv ${legacyWhere} GROUP BY status`, legacyParams)
        const byCampus = await dbAll(
            `SELECT celebration_point, status, COUNT(*) AS n FROM graduation_verifications gv ${legacyWhere}
             GROUP BY celebration_point, status ORDER BY celebration_point`, legacyParams
        )

        res.json({
            success: true,
            scope: req.scopedCelebrationPoint || 'all',
            total_roster,
            verified,
            verified_pct,
            buckets: {
                approved_for_graduation: totals.approved_for_graduation,
                approved_with_exceptions: totals.approved_with_exceptions,
                pending_approval: {
                    total: totals.pending_approval,
                    with_exception: totals.pending_approval_with_exception,
                    without_exception: totals.pending_approval_without_exception,
                },
                pending_recommendation: totals.pending_recommendation,
                not_recommended_declined: totals.not_recommended_declined,
                other: totals.other,
            },
            by_campus,
            reconciliation,
            byStatus, byCampus, // legacy
        })
    } catch (e) {
        console.error('[graduation] /summary error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

// ─── GET /export?campus=&type=complete|exception ─────────────────────────
// complete  = approved non-exceptions; exception = approved exceptions w/ justification.
function toCSV(rows, columns) {
    const header = columns.join(',')
    if (!rows.length) return header + '\n'
    const body = rows.map(row => columns.map(col => {
        let val = row[col]
        if (val === null || val === undefined) return ''
        val = String(val).replace(/"/g, '""')
        return /[",\n]/.test(val) ? `"${val}"` : val
    }).join(',')).join('\n')
    return header + '\n' + body + '\n'
}

router.get('/export', requireAuth, requireGraduationApprover, applyCampusScope, async (req, res) => {
    try {
        const type = req.query.type === 'exception' ? 'exception' : 'complete'
        const conditions = ["gv.status = 'approved'"]
        const params = []
        if (req.scopedCelebrationPoint) { conditions.push('gv.celebration_point = ?'); params.push(req.scopedCelebrationPoint) }
        if (type === 'exception') conditions.push("gv.recommendation = 'exception'")
        else conditions.push("gv.recommendation != 'exception'")
        const where = `WHERE ${conditions.join(' AND ')}`

        const rows = await dbAll(
            `SELECT gv.*, fg.group_code
             FROM graduation_verifications gv
             LEFT JOIN formation_groups fg ON fg.id = gv.formation_group_id
             ${where}
             ORDER BY gv.celebration_point, fg.group_code, gv.student_name`,
            params
        )

        const columns = type === 'exception'
            ? ['student_name', 'student_email', 'group_code', 'celebration_point', 'cohort',
               'attended_weeks', 'total_weeks', 'online_progress', 'recommendation',
               'reason_for_gap', 'evidence_category', 'justification', 'review_note']
            : ['student_name', 'student_email', 'group_code', 'celebration_point', 'cohort',
               'attended_weeks', 'total_weeks', 'online_progress', 'recommendation', 'review_note']

        const csv = toCSV(rows, columns)
        const stamp = new Date().toISOString().slice(0, 10)
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="graduation_${type}_${req.scopedCelebrationPoint || 'all'}_${stamp}.csv"`)
        res.send(csv)
    } catch (e) {
        console.error('[graduation] /export error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

export default router
