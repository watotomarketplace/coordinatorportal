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

const router = express.Router()

// Program criteria. Attendance requirement is fixed at 13 of 16 weeks.
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

// Compute attendance + online progress + existing verification for every active
// member of a group. Join key: group_members.student_thinkific_id ==
// thinkific_students.thinkific_user_id (== student_id — both hold the Thinkific
// user id). We prefer thinkific_user_id and fall back to student_id.
async function computeRoster(group, threshold) {
    const groupId = group.id
    const cohort = group.cohort || DEFAULT_COHORT

    const members = await dbAll(
        `SELECT id AS group_member_id, student_thinkific_id, student_name, student_email
         FROM group_members WHERE formation_group_id = ? AND active = 1`,
        [groupId]
    )

    // Attended weeks per participant (distinct weeks where present and group met)
    const attRows = await dbAll(
        `SELECT gm.student_thinkific_id,
                COUNT(DISTINCT CASE WHEN sa.attended = 1 AND gs.did_not_meet = 0
                                    THEN gs.week_number END) AS attended_weeks
         FROM group_members gm
         LEFT JOIN session_attendance sa ON sa.group_member_id = gm.id
         LEFT JOIN group_sessions   gs ON gs.id = sa.session_id
         WHERE gm.formation_group_id = ? AND gm.active = 1
         GROUP BY gm.student_thinkific_id`,
        [groupId]
    )
    const attMap = new Map(attRows.map(r => [String(r.student_thinkific_id), Number(r.attended_weeks) || 0]))

    // Existing verification rows for this group/cohort
    const verRows = await dbAll(
        `SELECT * FROM graduation_verifications WHERE formation_group_id = ? AND cohort = ?`,
        [groupId, cohort]
    )
    const verMap = new Map(verRows.map(v => [String(v.student_thinkific_id), v]))

    let mismatches = 0
    const roster = []
    for (const m of members) {
        const sid = String(m.student_thinkific_id)
        let ts = await dbGet('SELECT name, email, progress FROM thinkific_students WHERE thinkific_user_id = ?', [sid])
        if (!ts) ts = await dbGet('SELECT name, email, progress FROM thinkific_students WHERE student_id = ?', [sid])
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
        if (!isFacilitatorOf(user, group)) {
            return res.status(403).json({ success: false, message: 'Only the group facilitator/co-facilitator may submit recommendations' })
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
// Counts by campus/group/status for Admin/Leadership/Coordinator.
router.get('/summary', requireAuth, requireGraduationApprover, applyCampusScope, async (req, res) => {
    try {
        const params = []
        let where = ''
        if (req.scopedCelebrationPoint) { where = 'WHERE gv.celebration_point = ?'; params.push(req.scopedCelebrationPoint) }

        const byStatus = await dbAll(
            `SELECT status, COUNT(*) AS n FROM graduation_verifications gv ${where} GROUP BY status`,
            params
        )
        const byCampus = await dbAll(
            `SELECT celebration_point, status, COUNT(*) AS n
             FROM graduation_verifications gv ${where}
             GROUP BY celebration_point, status ORDER BY celebration_point`,
            params
        )
        res.json({ success: true, byStatus, byCampus })
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
