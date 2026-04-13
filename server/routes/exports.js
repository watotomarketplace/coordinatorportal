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

        const isGlobal = GLOBAL_ROLES.includes(user.role)
        const campus = req.query.celebration_point || req.scopedCelebrationPoint || (!isGlobal ? user.celebration_point : null)
        const data = await getStudentData(campus)
        const students = data.students || []

        const columns = ['userId', 'first_name', 'last_name', 'email', 'celebration_point', 'course', 'progress', 'status', 'daysInactive', 'alertLevel', 'risk_score', 'risk_category', 'lastActivity', 'last_sign_in_at', 'enrolled_at']
        sendCSV(res, `roster_${campus || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`, students, columns)
    } catch (error) {
        console.error('Export roster error:', error)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

// 1.5 Groups Export
router.get('/campus/groups', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const { where, params } = buildFilters(user, req.query.celebration_point)
        const rows = await dbAll(`
            SELECT fg.group_code, fg.name, fg.celebration_point,
                   u.name as facilitator_name, u2.name as co_facilitator_name,
                   (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
            FROM formation_groups fg
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
            WHERE 1=1 ${where}
            ORDER BY fg.celebration_point, fg.group_code
        `, params)

        const columns = ['group_code', 'name', 'celebration_point', 'facilitator_name', 'co_facilitator_name', 'member_count']
        sendCSV(res, `groups_${req.query.celebration_point || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`, rows, columns)
    } catch (err) {
        console.error('Export groups error:', err)
        res.status(500).json({ success: false, message: 'Export failed' })
    }
})

// 2. Inactivity / Risk Report
router.get('/campus/risk', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        if (user.role === 'Facilitator') return res.status(403).json({ success: false, message: 'Campus reports not available for Facilitators' })

        const isGlobal = GLOBAL_ROLES.includes(user.role)
        const campus = req.query.celebration_point || req.scopedCelebrationPoint || (!isGlobal ? user.celebration_point : null)
        const data = await getStudentData(campus)
        const atRisk = (data.students || []).filter(s =>
            (s.risk_score && s.risk_score >= 50) || s.daysInactive > 14
        ).sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))

        const columns = ['userId', 'first_name', 'last_name', 'email', 'celebration_point', 'course', 'progress', 'status', 'risk_score', 'risk_category', 'daysInactive', 'alertLevel', 'lastActivity', 'last_sign_in_at', 'enrolled_at']
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

        // Get group members from DB (student_id + cached name/email)
        const members = await dbAll(`SELECT student_id, student_name, student_email
            FROM formation_group_members WHERE formation_group_id = ?`, [req.params.groupId])

        // Enrich with live Thinkific data from cache
        const thinkificData = await getStudentData()
        const studentMap = new Map((thinkificData.students || []).map(s => [String(s.userId), s]))

        const enriched = members.map(m => {
            const s = studentMap.get(String(m.student_id))
            return {
                student_id: m.student_id,
                first_name: s?.first_name || (m.student_name || '').split(' ')[0] || '',
                last_name: s?.last_name || (m.student_name || '').split(' ').slice(1).join(' ') || '',
                email: s?.email || m.student_email || '',
                progress: s?.progress ?? 0,
                status: s?.status || 'Unknown',
                daysInactive: s?.daysInactive ?? 0,
                risk_score: s?.risk_score ?? 0,
                risk_category: s?.risk_category || 'Unknown',
                lastActivity: s?.lastActivity || '',
                last_sign_in_at: s?.last_sign_in_at || ''
            }
        })

        const columns = ['student_id', 'first_name', 'last_name', 'email', 'progress', 'status', 'daysInactive', 'risk_score', 'risk_category', 'lastActivity', 'last_sign_in_at']
        sendCSV(res, `group_roster_${group.group_code}_${new Date().toISOString().slice(0, 10)}.csv`, enriched, columns)
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

// ═══════════════════════════════════════════════════════
// ATTENDANCE + CHECKPOINTS CSV EXPORTS
// ═══════════════════════════════════════════════════════

// 9. Attendance Export
router.get('/attendance', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const campus = req.query.celebration_point || req.scopedCelebrationPoint || user.celebration_point
        const group_id = req.query.group_id

        const { where, params } = buildFilters(user, campus)
        const groupFilter = group_id ? 'AND fg.id = ?' : ''
        if (group_id) params.push(group_id)

        const rows = await dbAll(`
            SELECT fg.group_code, fg.celebration_point,
                   gs.session_date, gs.week_number,
                   gm.student_name, gm.student_email,
                   sa.attended, sa.note
            FROM session_attendance sa
            JOIN group_sessions gs ON sa.session_id = gs.id
            JOIN group_members gm ON sa.group_member_id = gm.id
            JOIN formation_groups fg ON gs.formation_group_id = fg.id
            WHERE 1=1 ${where} ${groupFilter}
            ORDER BY fg.group_code, gs.session_date, gm.student_name
        `, params)

        const columns = ['group_code', 'celebration_point', 'session_date', 'week_number', 'student_name', 'student_email', 'attended', 'note']
        sendCSV(res, `attendance_${campus || 'all'}_${Date.now()}.csv`, rows, columns)
    } catch (err) {
        console.error('Attendance export error:', err)
        res.status(500).json({ success: false, message: 'Attendance export failed' })
    }
})

// 10. Checkpoints CSV Export
router.get('/checkpoints-csv', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const campus = req.query.celebration_point || req.scopedCelebrationPoint || user.celebration_point
        const week = req.query.week

        const { where, params } = buildFilters(user, campus)
        const weekFilter = week ? 'AND dc.checkpoint_week = ?' : ''
        if (week) params.push(week)

        const rows = await dbAll(`
            SELECT fg.group_code, fg.celebration_point,
                   u.name as facilitator_name,
                   dc.checkpoint_week, dc.status,
                   dc.attendance_trend, dc.engagement_trend,
                   dc.summary, dc.concerns_summary as pastoral_concerns,
                   dc.created_at
            FROM discernment_checkpoints dc
            JOIN formation_groups fg ON dc.formation_group_id = fg.id
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            WHERE 1=1 ${where} ${weekFilter}
            ORDER BY dc.checkpoint_week, fg.group_code
        `, params)

        const columns = ['group_code', 'celebration_point', 'facilitator_name', 'checkpoint_week', 'status', 'attendance_trend', 'engagement_trend', 'summary', 'pastoral_concerns', 'created_at']
        sendCSV(res, `checkpoints_week${week || 'all'}_${Date.now()}.csv`, rows, columns)
    } catch (err) {
        console.error('Checkpoints export error:', err)
        res.status(500).json({ success: false, message: 'Checkpoints export failed' })
    }
})

export default router
