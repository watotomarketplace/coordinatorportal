import express from 'express'
import { dbAll, dbGet, IS_POSTGRES } from '../db/init.js'
import { getStudentData, getStats, getChartData } from '../services/thinkific.js'
import { requireAuth, applyCampusScope, GLOBAL_ROLES } from '../middleware/rbac.js'
import { getCache, setCache } from '../services/cache.js'

const router = express.Router()

router.get('/summary', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const isGlobal = GLOBAL_ROLES.includes(user.role)
        const campus = req.query.campus || req.query.celebration_point || req.scopedCelebrationPoint || (!isGlobal ? user.celebration_point : null)

        const cacheKey = `cache:dashboard:summary:${user.id}:${campus || 'global'}`
        const cachedData = await getCache(cacheKey)
        if (cachedData) {
            return res.json(cachedData)
        }

        // --- 1. Thinkific Data Aggregation ---
        const thinkificData = await getStudentData(campus)
        let students = thinkificData.students || []
        
        let facilFilter = ''
        let facilParam = []

        // Scope students and groups for facilitator
        if (user.role === 'Facilitator') {
            facilFilter = 'AND (fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?)'
            facilParam = [user.id, user.id]

            const members = await dbAll(`
                SELECT fgm.student_id, fgm.student_email
                FROM formation_group_members fgm
                JOIN formation_groups fg ON fgm.formation_group_id = fg.id
                WHERE fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?
            `, [user.id, user.id])
            const memberIds = new Set(members.map(m => String(m.student_id)))
            const memberEmails = new Set(members.filter(m => m.student_email).map(m => m.student_email.toLowerCase()))
            
            students = students.filter(s => (s.id && memberIds.has(String(s.id))) || (s.email && memberEmails.has(s.email.toLowerCase())))
        }

        const stats = getStats(students)
        const chartData = getChartData(students)

        const thinkificStats = {
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            inactive14d: students.filter(s => {
                if (!s.last_sign_in_at) return true;
                const days = (new Date() - new Date(s.last_sign_in_at)) / (1000 * 60 * 60 * 24);
                return days > 14;
            }).length,
            inactive30d: students.filter(s => {
                if (!s.last_sign_in_at) return true;
                const days = (new Date() - new Date(s.last_sign_in_at)) / (1000 * 60 * 60 * 24);
                return days > 30;
            }).length,
            atRiskCount: stats.atRiskStudents,
            onTrackCount: students.filter(s => s.progress >= 75).length,
            avgProgress: stats.averageProgress,
            riskDistribution: chartData.riskDistribution || {
                healthy: stats.healthyStudents,
                attention: stats.atRiskStudents,
                critical: 0
            },
            progressDistribution: chartData.progressDistribution,
            completionStatus: chartData.completionStatus,
            courseProgress: chartData.courseProgress
        }

        // --- 2. Notion Data Aggregation ---
        const campusFilter = (isGlobal && !campus) ? '' : 'AND fg.celebration_point = ?'
        const campusParam = (isGlobal && !campus) ? [] : [campus]
        const params = [...campusParam, ...facilParam]

        // 2a. Pastoral Concerns
        const pastoralConcerns = await dbAll(`
            SELECT wr.id, wr.week_number, wr.pastoral_concerns, wr.submitted_at,
                fg.group_code, fg.name as group_name, u.name as facilitator_name
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE wr.pastoral_concerns IS NOT NULL AND wr.pastoral_concerns != ''
                ${campusFilter} ${facilFilter}
            ORDER BY wr.submitted_at DESC
            LIMIT 10
        `, params)

        // 2b. Formation Evidence
        const formationEvidence = await dbAll(`
            SELECT wr.id, wr.week_number, wr.formation_evidence, wr.submitted_at,
                fg.group_code, fg.name as group_name, u.name as facilitator_name
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE wr.formation_evidence IS NOT NULL AND wr.formation_evidence != ''
                ${campusFilter} ${facilFilter}
            ORDER BY wr.submitted_at DESC
            LIMIT 8
        `, params)

        // 2c. Engagement Trend
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

        // 2d. Checkpoints
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

        // 2e. Compliance Status (Current Week Reporting %)
        const currentWeekSetting = await dbGet("SELECT value FROM system_settings WHERE key = 'current_week'")
        const currentWeek = currentWeekSetting ? parseInt(currentWeekSetting.value, 10) : 0

        let complianceData = []
        let totalActiveGroups = 0
        let totalSubmittedGroups = 0

        if (currentWeek > 0) {
            const allCampuses = (isGlobal && !campus)
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
                totalActiveGroups += row.total_groups || 0
                totalSubmittedGroups += row.submitted || 0
            }
        }

        // 2f. Pastoral Trend (count of concerns by week)
        const pastoralTrend = await dbAll(`
            SELECT wr.week_number, COUNT(*) as count
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            WHERE wr.pastoral_concerns IS NOT NULL AND wr.pastoral_concerns != ''
                ${campusFilter} ${facilFilter}
            GROUP BY wr.week_number
            ORDER BY wr.week_number
        `, params)
        
        const notionStats = {
            pastoralConcerns,
            pastoralTrend,
            formationEvidence,
            engagementTrend,
            checkpointStatus,
            complianceData,
            complianceGlobal: totalActiveGroups > 0 ? Math.round((totalSubmittedGroups / totalActiveGroups) * 100) : 0,
            totalSubmittedGroups,
            totalActiveGroups
        }
        
        const payload = {
            success: true,
            thinkific: thinkificStats,
            notion: notionStats
        }
        
        await setCache(cacheKey, payload, 300) // 5 Min TTL
        res.json(payload)
    } catch (e) {
        console.error('Dashboard summary error:', e.message)
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary', error: e.message })
    }
})

export default router
