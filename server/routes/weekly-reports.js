import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAuth, requireAdmin, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES } from '../middleware/rbac.js'
import { syncWeeklyReports, getSyncStatus, restartAutoSync } from '../services/notion-sync.js'

const router = express.Router()

// --- LIST REPORTS ---
router.get('/', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const { week, celebration_point, group_id } = req.query
        let params = []
        let conditions = ['1=1']

        // Week filter
        if (week) { conditions.push('wr.week_number = ?'); params.push(week) }

        // Group filter
        if (group_id) { conditions.push('wr.formation_group_id = ?'); params.push(group_id) }

        // Role-based scoping
        if (user.role === 'Facilitator') {
            conditions.push('fg.facilitator_user_id = ?')
            params.push(user.id)
        } else if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator') {
            conditions.push('fg.celebration_point = ?')
            params.push(req.scopedCelebrationPoint || user.celebration_point)
        } else if (GLOBAL_ROLES.includes(user.role) && celebration_point) {
            conditions.push('fg.celebration_point = ?')
            params.push(celebration_point)
        }

        const reports = await dbAll(`
            SELECT wr.*, fg.group_code, fg.name as group_name, fg.celebration_point,
                   u.name as facilitator_name
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY wr.week_number DESC, fg.group_code ASC
        `, params)

        res.json({ success: true, reports })
    } catch (error) {
        console.error('List reports error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch reports' })
    }
})

// --- GET REPORT DETAIL ---
router.get('/sync-status', requireAuth, async (req, res) => {
    try {
        const status = await getSyncStatus()  // 2705 FIX: was missing await
        res.json({ success: true, ...status })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get sync status' })
    }
})

// --- CAMPUS SUMMARY ---
router.get('/summary', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const { celebration_point, week } = req.query

        // Only global roles and campus-scoped (non-facilitator) roles can see summaries
        if (user.role === 'Facilitator') {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }

        let campus = celebration_point
        if (CAMPUS_SCOPED_ROLES.includes(user.role)) {
            campus = user.celebration_point
        }

        let params = []
        let conditions = ['1=1']
        if (campus) { conditions.push('fg.celebration_point = ?'); params.push(campus) }
        if (week) { conditions.push('wr.week_number = ?'); params.push(week) }

        // Group-level submission status — single query with LEFT JOIN instead of 3 correlated subqueries
        const groups = await dbAll(`
            SELECT fg.id, fg.group_code, fg.name, fg.celebration_point,
                   u.name as facilitator_name,
                   COALESCE(rs.total_reports, 0) as total_reports,
                   rs.latest_week,
                   rs.latest_engagement
            FROM formation_groups fg
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            LEFT JOIN (
                SELECT formation_group_id,
                       COUNT(*) as total_reports,
                       MAX(week_number) as latest_week
                FROM weekly_reports
                GROUP BY formation_group_id
            ) rs ON rs.formation_group_id = fg.id
            LEFT JOIN (
                SELECT wr2.formation_group_id, wr2.engagement_level as latest_engagement
                FROM weekly_reports wr2
                INNER JOIN (
                    SELECT formation_group_id, MAX(week_number) as max_week
                    FROM weekly_reports
                    GROUP BY formation_group_id
                ) mx ON mx.formation_group_id = wr2.formation_group_id
                       AND mx.max_week = wr2.week_number
            ) le ON le.formation_group_id = fg.id
            WHERE fg.active = 1 ${campus ? 'AND fg.celebration_point = ?' : ''}
            ORDER BY fg.group_code
        `, campus ? [campus] : [])

        // Aggregated stats
        const stats = await dbGet(`
            SELECT 
                COUNT(DISTINCT wr.formation_group_id) as groups_with_reports,
                COUNT(*) as total_reports,
                AVG(wr.attendance_count) as avg_attendance,
                SUM(CASE WHEN wr.engagement_level = 'high' THEN 1 ELSE 0 END) as high_engagement_count,
                SUM(CASE WHEN wr.engagement_level = 'medium' THEN 1 ELSE 0 END) as medium_engagement_count,
                SUM(CASE WHEN wr.engagement_level = 'low' THEN 1 ELSE 0 END) as low_engagement_count
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            WHERE ${conditions.join(' AND ')}
        `, params)

        res.json({ success: true, groups, stats })
    } catch (error) {
        console.error('Report summary error:', error)
        res.status(500).json({ success: false, message: 'Failed to get summary' })
    }
})

// --- GET SINGLE REPORT ---
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const report = await dbGet(`
            SELECT wr.*, fg.group_code, fg.name as group_name, fg.celebration_point,
                   u.name as facilitator_name
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE wr.id = ?
        `, [req.params.id])

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' })
        }

        // Access check
        if (user.role === 'Facilitator' && report.facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator') {
            if (report.celebration_point !== user.celebration_point) {
                return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
            }
        }

        res.json({ success: true, report })
    } catch (error) {
        console.error('Get report error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch report' })
    }
})

// --- TRIGGER MANUAL SYNC (Admin only) ---
router.post('/sync', requireAdmin, async (req, res) => {
    try {
        const status = await syncWeeklyReports()
        res.json({ success: true, ...status })
    } catch (error) {
        console.error('Manual sync error:', error)
        res.status(500).json({ success: false, message: 'Sync failed' })
    }
})

export default router
