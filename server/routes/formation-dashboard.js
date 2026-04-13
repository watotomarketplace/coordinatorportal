import express from 'express'
import { dbGet, dbAll, IS_POSTGRES } from '../db/init.js'
import { requireAuth, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES } from '../middleware/rbac.js'
import { getCache, setCache } from '../services/cache.js'

const router = express.Router()

/**
 * GET /api/formation-dashboard
 * Returns aggregated formation data for dashboard widgets.
 * All data is role/campus-scoped.
 */
router.get('/', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const campus = req.query.celebration_point || req.scopedCelebrationPoint || user.celebration_point
        const isGlobal = GLOBAL_ROLES.includes(user.role)

        // Build campus filter clause
        const campusFilter = (isGlobal && !req.query.celebration_point)
            ? '' : 'AND fg.celebration_point = ?'
        const campusParam = (isGlobal && !req.query.celebration_point)
            ? [] : [campus]

        // Facilitator filter (includes co-facilitator)
        const facilFilter = user.role === 'Facilitator' ? 'AND (fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?)' : ''
        const facilParam = user.role === 'Facilitator' ? [user.id, user.id] : []

        const params = [...campusParam, ...facilParam]

        // Cache Key Formulation
        const cacheKey = `cache:dashboard:formation:${user.id}:${campus || 'global'}`
        const cachedData = await getCache(cacheKey)
        if (cachedData) {
            return res.json(cachedData)
        }

        // --- 1. Report Submission Status ---
        const groups = await dbAll(`
            SELECT fg.id, fg.group_code, fg.name, fg.celebration_point, u.name as facilitator_name,
                (SELECT MAX(week_number) FROM weekly_reports WHERE formation_group_id = fg.id) as latest_week,
                (SELECT COUNT(*) FROM weekly_reports WHERE formation_group_id = fg.id) as total_reports
            FROM formation_groups fg
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            WHERE fg.active = 1 ${campusFilter} ${facilFilter}
            ORDER BY fg.group_code
        `, params)

        // --- 2. Engagement Trend (per week) ---
        const avgScoreSql = IS_POSTGRES 
            ? "ROUND(CAST(AVG(CASE WHEN wr.engagement_level = 'high' THEN 3 WHEN wr.engagement_level = 'medium' THEN 2 WHEN wr.engagement_level = 'low' THEN 1 ELSE NULL END) AS numeric), 2)"
            : "ROUND(AVG(CASE WHEN wr.engagement_level = 'high' THEN 3 WHEN wr.engagement_level = 'medium' THEN 2 WHEN wr.engagement_level = 'low' THEN 1 ELSE NULL END), 2)"

        const engagementTrend = await dbAll(`
            SELECT wr.week_number,
                SUM(CASE WHEN wr.engagement_level = 'high' THEN 1 ELSE 0 END) as high_count,
                SUM(CASE WHEN wr.engagement_level = 'medium' THEN 1 ELSE 0 END) as medium_count,
                SUM(CASE WHEN wr.engagement_level = 'low' THEN 1 ELSE 0 END) as low_count,
                COUNT(*) as total,
                ${avgScoreSql} as avg_score
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            WHERE 1=1 ${campusFilter} ${facilFilter}
            GROUP BY wr.week_number
            ORDER BY wr.week_number
        `, params)

        // --- 3. Pastoral Concerns Feed (recent, non-empty) ---
        const pastoralConcerns = await dbAll(`
            SELECT wr.id, wr.week_number, wr.pastoral_concerns, wr.submitted_at,
                fg.group_code, fg.name as group_name, u.name as facilitator_name
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE wr.pastoral_concerns IS NOT NULL AND wr.pastoral_concerns != ''
                ${campusFilter} ${facilFilter}
            ORDER BY wr.week_number DESC, wr.submitted_at DESC
            LIMIT 10
        `, params)

        // --- 4. Formation Evidence Highlights (recent, non-empty) ---
        const formationEvidence = await dbAll(`
            SELECT wr.id, wr.week_number, wr.formation_evidence, wr.submitted_at,
                fg.group_code, fg.name as group_name, u.name as facilitator_name
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE wr.formation_evidence IS NOT NULL AND wr.formation_evidence != ''
                ${campusFilter} ${facilFilter}
            ORDER BY wr.week_number DESC, wr.submitted_at DESC
            LIMIT 8
        `, params)

        // --- 5. Checkpoint Status ---
        const checkpointStatus = await dbAll(`
            SELECT dc.checkpoint_week, dc.status,
                fg.group_code, fg.name as group_name,
                dc.reviewed_at, r.name as reviewer_name
            FROM discernment_checkpoints dc
            JOIN formation_groups fg ON dc.formation_group_id = fg.id
            LEFT JOIN users r ON dc.reviewed_by = r.id
            WHERE 1=1 ${campusFilter} ${facilFilter}
            ORDER BY dc.checkpoint_week, fg.group_code
        `, params)

        // --- 6. Reporting compliance per campus ---
        const currentWeekSetting = await dbGet("SELECT value FROM system_settings WHERE key = 'current_week'")
        const currentWeek = currentWeekSetting ? parseInt(currentWeekSetting.value, 10) : 0

        let complianceData = []
        if (currentWeek > 0) {
            const allCampuses = (isGlobal && !req.query.celebration_point)
                ? await dbAll("SELECT DISTINCT celebration_point FROM formation_groups WHERE active = 1")
                : [{ celebration_point: campus }]

            for (const { celebration_point } of allCampuses) {
                const row = await dbGet(`
                    SELECT
                        COUNT(*) as total_groups,
                        COUNT(wr.id) as submitted,
                        COUNT(*) - COUNT(wr.id) as missing
                    FROM formation_groups fg
                    LEFT JOIN weekly_reports wr
                        ON wr.formation_group_id = fg.id AND wr.week_number = ?
                    WHERE fg.active = 1 AND fg.celebration_point = ?
                `, [currentWeek, celebration_point])
                complianceData.push({ celebration_point, ...row })
            }
        }

        // --- 7. At-risk groups (2+ consecutive low engagement weeks) ---
        const atRiskGroups = await dbAll(`
            SELECT fg.id, fg.group_code, fg.celebration_point,
                u.name as facilitator_name,
                COUNT(*) as low_weeks
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            WHERE wr.engagement_level = 'low'
                ${campusFilter} ${facilFilter}
            GROUP BY fg.id
            HAVING low_weeks >= 2
            ORDER BY low_weeks DESC
            LIMIT 10
        `, params)

        const payload = {
            success: true,
            submissionStatus: groups,
            engagementTrend,
            pastoralConcerns,
            formationEvidence,
            checkpointStatus,
            campuses: complianceData,
            atRiskGroups
        }

        await setCache(cacheKey, payload, 300) // 5 Min TTL
        res.json(payload)
    } catch (error) {
        console.error('Formation dashboard error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch formation dashboard data' })
    }
})

export default router
