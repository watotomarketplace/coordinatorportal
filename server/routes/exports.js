import express from 'express'
import { dbAll } from '../db/init.js'
import { requireAuth, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES } from '../middleware/rbac.js'
import { getStudentData } from '../services/thinkific.js'

const router = express.Router()

/**
 * Build campus + facilitator filter SQL fragments
 */
function buildFilters(user, campus) {
    const isGlobal = GLOBAL_ROLES.includes(user.role)
    const conditions = []
    const params = []

    if (user.role === 'Facilitator') {
        conditions.push('fg.facilitator_user_id = ?')
        params.push(user.id)
    } else if (!isGlobal || campus) {
        conditions.push('fg.celebration_point = ?')
        params.push(campus || user.celebration_point)
    }

    return { where: conditions.length ? 'AND ' + conditions.join(' AND ') : '', params }
}

/**
 * Convert rows to CSV string
 */
function toCSV(rows, columns) {
    if (rows.length === 0) return columns.join(',') + '\n'
    const header = columns.join(',')
    const body = rows.map(row =>
        columns.map(col => {
            let val = row[col]
            if (val === null || val === undefined) return ''
            val = String(val).replace(/"/g, '""')
            return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val
        }).join(',')
    ).join('\n')
    return header + '\n' + body + '\n'
}

/**
 * Send CSV response
 */
function sendCSV(res, filename, rows, columns) {
    const csv = toCSV(rows, columns)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
}

// ═══════════════════════════════════════════════════════
// CAMPUS-BASED REPORTS
// ═══════════════════════════════════════════════════════

// 1. Participant Roster with Progress Summary
router.get('/campus/roster', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        if (user.role === 'Facilitator') return res.status(403).json({ success: false, message: 'Campus reports not available for Facilitators' })

        const campus = req.query.celebration_point || req.scopedCelebrationPoint || user.celebration_point
        const data = await getStudentData(campus || null)
        const students = data.students || []

        const columns = ['id', 'first_name', 'last_name', 'email', 'celebration_point', 'percentage_completed', 'days_since_last_sign_in', 'amount_spent', 'risk_score', 'enrolled_at', 'last_sign_in_at']
        sendCSV(res, `roster_${campus || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`, students, columns)
    } catch (error) {
        console.error('Export roster error:', error)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

// 2. Inactivity / Risk Report
router.get('/campus/risk', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        if (user.role === 'Facilitator') return res.status(403).json({ success: false, message: 'Campus reports not available for Facilitators' })

        const campus = req.query.celebration_point || req.scopedCelebrationPoint || user.celebration_point
        const data = await getStudentData(campus || null)
        const atRisk = (data.students || []).filter(s =>
            (s.risk_score && s.risk_score >= 50) || s.days_since_last_sign_in > 14
        ).sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))

        const columns = ['id', 'first_name', 'last_name', 'email', 'celebration_point', 'risk_score', 'days_since_last_sign_in', 'percentage_completed', 'last_sign_in_at']
        sendCSV(res, `risk_report_${campus || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`, atRisk, columns)
    } catch (error) {
        console.error('Export risk error:', error)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

// 3. Weekly Report Aggregation (from Notion data)
router.get('/campus/weekly-reports', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        if (user.role === 'Facilitator') return res.status(403).json({ success: false, message: 'Campus reports not available for Facilitators' })

        const { where, params } = buildFilters(user, req.query.celebration_point)
        const rows = await dbAll(`
            SELECT wr.week_number, wr.module_number, wr.lesson_number,
                fg.group_code, fg.name as group_name, fg.celebration_point,
                u.name as facilitator_name,
                wr.attendance_count, wr.engagement_level, wr.key_themes,
                wr.formation_evidence, wr.pastoral_concerns, wr.questions_to_escalate,
                wr.session_adjustments, wr.submitted_at
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE 1=1 ${where}
            ORDER BY wr.week_number, fg.group_code
        `, params)

        const columns = ['week_number', 'module_number', 'lesson_number', 'group_code', 'group_name', 'celebration_point', 'facilitator_name', 'attendance_count', 'engagement_level', 'key_themes', 'formation_evidence', 'pastoral_concerns', 'questions_to_escalate', 'session_adjustments', 'submitted_at']
        sendCSV(res, `weekly_reports_${req.query.celebration_point || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`, rows, columns)
    } catch (error) {
        console.error('Export weekly reports error:', error)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

// 4. Formation Evidence Summary
router.get('/campus/formation-evidence', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        if (user.role === 'Facilitator') return res.status(403).json({ success: false, message: 'Campus reports not available for Facilitators' })

        const { where, params } = buildFilters(user, req.query.celebration_point)
        const rows = await dbAll(`
            SELECT wr.week_number, fg.group_code, fg.name as group_name, fg.celebration_point,
                u.name as facilitator_name, wr.formation_evidence, wr.submitted_at
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE wr.formation_evidence IS NOT NULL AND wr.formation_evidence != '' ${where}
            ORDER BY wr.week_number, fg.group_code
        `, params)

        const columns = ['week_number', 'group_code', 'group_name', 'celebration_point', 'facilitator_name', 'formation_evidence', 'submitted_at']
        sendCSV(res, `formation_evidence_${req.query.celebration_point || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`, rows, columns)
    } catch (error) {
        console.error('Export formation evidence error:', error)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

// 5. Discernment Checkpoint Summary
router.get('/campus/checkpoints', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        if (user.role === 'Facilitator') return res.status(403).json({ success: false, message: 'Campus reports not available for Facilitators' })

        const { where, params } = buildFilters(user, req.query.celebration_point)
        const rows = await dbAll(`
            SELECT dc.checkpoint_week, dc.status, dc.summary, dc.attendance_trend, dc.engagement_trend,
                dc.recurring_themes, dc.formation_evidence_summary, dc.concerns_summary,
                dc.review_notes, dc.reviewed_at,
                fg.group_code, fg.name as group_name, fg.celebration_point,
                u.name as facilitator_name, r.name as reviewer_name
            FROM discernment_checkpoints dc
            JOIN formation_groups fg ON dc.formation_group_id = fg.id
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            LEFT JOIN users r ON dc.reviewed_by = r.id
            WHERE 1=1 ${where}
            ORDER BY dc.checkpoint_week, fg.group_code
        `, params)

        const columns = ['checkpoint_week', 'group_code', 'group_name', 'celebration_point', 'facilitator_name', 'status', 'summary', 'attendance_trend', 'engagement_trend', 'recurring_themes', 'formation_evidence_summary', 'concerns_summary', 'review_notes', 'reviewer_name', 'reviewed_at']
        sendCSV(res, `checkpoints_${req.query.celebration_point || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`, rows, columns)
    } catch (error) {
        console.error('Export checkpoints error:', error)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

// ═══════════════════════════════════════════════════════
// GROUP-BASED REPORTS
// ═══════════════════════════════════════════════════════

// 6. Group Member Roster with Progress
router.get('/group/:groupId/roster', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const group = (await dbAll(`SELECT * FROM formation_groups WHERE id = ?`, [req.params.groupId]))[0]
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

        // Access check
        if (user.role === 'Facilitator' && group.facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator' && group.celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
        }

        const members = await dbAll(`
            SELECT fgm.student_id, s.first_name, s.last_name, s.email,
                s.percentage_completed, s.days_since_last_sign_in, s.last_sign_in_at, s.risk_score
            FROM formation_group_members fgm
            LEFT JOIN students s ON fgm.student_id = s.id
            WHERE fgm.formation_group_id = ?
        `, [req.params.groupId])

        const columns = ['student_id', 'first_name', 'last_name', 'email', 'percentage_completed', 'days_since_last_sign_in', 'last_sign_in_at', 'risk_score']
        sendCSV(res, `group_roster_${group.group_code}_${new Date().toISOString().slice(0, 10)}.csv`, members, columns)
    } catch (error) {
        console.error('Export group roster error:', error)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

// 7. Group Weekly Report History
router.get('/group/:groupId/weekly-reports', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const group = (await dbAll(`SELECT * FROM formation_groups WHERE id = ?`, [req.params.groupId]))[0]
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

        if (user.role === 'Facilitator' && group.facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator' && group.celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
        }

        const rows = await dbAll(`
            SELECT wr.week_number, wr.module_number, wr.lesson_number,
                wr.attendance_count, wr.engagement_level, wr.key_themes,
                wr.formation_evidence, wr.pastoral_concerns, wr.questions_to_escalate,
                wr.session_adjustments, wr.submitted_at,
                u.name as facilitator_name
            FROM weekly_reports wr
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE wr.formation_group_id = ?
            ORDER BY wr.week_number
        `, [req.params.groupId])

        const columns = ['week_number', 'module_number', 'lesson_number', 'facilitator_name', 'attendance_count', 'engagement_level', 'key_themes', 'formation_evidence', 'pastoral_concerns', 'questions_to_escalate', 'session_adjustments', 'submitted_at']
        sendCSV(res, `weekly_reports_${group.group_code}_${new Date().toISOString().slice(0, 10)}.csv`, rows, columns)
    } catch (error) {
        console.error('Export group weekly reports error:', error)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

// 8. Group Formation Evidence Timeline
router.get('/group/:groupId/formation-evidence', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const group = (await dbAll(`SELECT * FROM formation_groups WHERE id = ?`, [req.params.groupId]))[0]
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

        if (user.role === 'Facilitator' && group.facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator' && group.celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
        }

        const rows = await dbAll(`
            SELECT wr.week_number, wr.formation_evidence, wr.submitted_at,
                u.name as facilitator_name
            FROM weekly_reports wr
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE wr.formation_group_id = ? AND wr.formation_evidence IS NOT NULL AND wr.formation_evidence != ''
            ORDER BY wr.week_number
        `, [req.params.groupId])

        const columns = ['week_number', 'facilitator_name', 'formation_evidence', 'submitted_at']
        sendCSV(res, `formation_evidence_${group.group_code}_${new Date().toISOString().slice(0, 10)}.csv`, rows, columns)
    } catch (error) {
        console.error('Export group formation evidence error:', error)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

export default router
