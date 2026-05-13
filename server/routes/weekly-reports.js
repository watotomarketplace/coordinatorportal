import express from 'express'
import { dbGet, dbAll, dbRun, getCurrentWeek, IS_POSTGRES } from '../db/init.js'
import { requireAuth, requireAdmin, requireAdminOrTechSupport, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES, userHasAnyRole } from '../middleware/rbac.js'
import { syncWeeklyReports, getSyncStatus, restartAutoSync } from '../services/notion-sync.js'
import { invalidatePattern } from '../services/cache.js'

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
        const status = await getSyncStatus()
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

// --- TRIGGER MANUAL SYNC (Admin or TechSupport) ---
// ?full=true or body.full=true clears the incremental cursor (Admin only) so the next
// sync re-fetches all Notion pages — use this to correct week_number assignments.
router.post('/sync', requireAdminOrTechSupport, async (req, res) => {
    try {
        const user = req.session.user
        const wantFull = req.query.full === 'true' || req.body?.full === true
        if (wantFull) {
            if (user.role !== 'Admin') {
                return res.status(403).json({ success: false, message: 'Only Admins can force a full re-sync' })
            }
            const upsertQ = IS_POSTGRES
                ? "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
                : "INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)"
            await dbRun(upsertQ, ['notion_last_sync_time', ''])
            console.log('[NotionSync] Full re-sync requested — cursor cleared.')
        }
        const status = await syncWeeklyReports()
        await invalidatePattern('cache:dashboard:*')
        await invalidatePattern('cache:students:*')
        res.json({ success: true, ...status })
    } catch (error) {
        console.error('Manual sync error:', error)
        res.status(500).json({ success: false, message: 'Sync failed' })
    }
})

// --- MANUAL REPORT ENTRY ---
// POST /api/reports  — Facilitator/Coordinator can submit a manual (non-Notion) report
router.post('/', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const {
            formation_group_id, week_number, attendance_count,
            engagement_level, pastoral_concerns, summary, highlights, prayer_requests
        } = req.body

        if (!formation_group_id) {
            return res.status(400).json({ success: false, message: 'formation_group_id required' })
        }

        const group = await dbGet('SELECT * FROM formation_groups WHERE id = ?', [formation_group_id])
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

        // Access check: Facilitator can only submit for their own group; Coordinator/Admin for campus
        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            if (group.facilitator_user_id !== user.id && group.co_facilitator_user_id !== user.id) {
                return res.status(403).json({ success: false, message: 'You can only submit reports for your own group' })
            }
        } else if (CAMPUS_SCOPED_ROLES.includes(user.role)) {
            if (group.celebration_point !== user.celebration_point) {
                return res.status(403).json({ success: false, message: 'Access denied: different campus' })
            }
        }

        const currentWeek = await getCurrentWeek()
        const targetWeek = week_number || currentWeek

        const validEngagement = ['high', 'medium', 'low'].includes(engagement_level) ? engagement_level : null

        const result = await dbRun(`
            INSERT INTO weekly_reports (
                formation_group_id, facilitator_user_id, week_number,
                attendance_count, engagement_level, pastoral_concerns,
                summary, highlights, prayer_requests,
                synced_from_notion, submitted_at, synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            formation_group_id, user.id, targetWeek,
            attendance_count || null, validEngagement, pastoral_concerns || null,
            summary || null, highlights || null, prayer_requests || null
        ])

        await invalidatePattern('cache:dashboard:*')

        res.json({ success: true, id: result.lastID ?? result, week_number: targetWeek })
    } catch (error) {
        console.error('POST /reports error:', error)
        res.status(500).json({ success: false, message: 'Failed to create report' })
    }
})

export default router
