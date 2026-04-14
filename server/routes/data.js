import express from 'express'
import { getStudentData, getChartData, getStats, forceRefresh, getPaginatedUsers, getStudentById, getStudentProgress } from '../services/thinkific.js'
import { getNotes, addNote } from '../services/notes.js'
import { getStudentTags } from '../services/tags.js'
import { requireAuth, applyCampusScope, GLOBAL_ROLES } from '../middleware/rbac.js'
import { dbAll, dbGet, IS_POSTGRES } from '../db/init.js'
import { getCache, setCache } from '../services/cache.js'

const router = express.Router()

// Get dashboard stats (Total Enrolled, Active, etc.)
router.get('/stats', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const celebrationPoint = req.scopedCelebrationPoint

        const result = await getStudentData(celebrationPoint)
        let students = result.students || []

        // Facilitators: filter to only students in their assigned groups
        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            const members = await dbAll(`
                SELECT fgm.student_id
                FROM formation_group_members fgm
                JOIN formation_groups fg ON fgm.formation_group_id = fg.id
                WHERE fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?
            `, [user.id, user.id])

            const memberIds = new Set(members.map(m => String(m.student_id)))
            students = students.filter(s => memberIds.has(String(s.id || s.userId)))
        }

        const stats = getStats(students)
        const chartData = getChartData(students)

        let attendanceStats = { avgAttendance: 0, totalSessions: 0, trend: [] }
        let topGroups = []
        let reportingStats = { compliance: 0, totalReports: 0, pastoralConcerns: 0, trends: [] }

        const floatCast = IS_POSTGRES ? "DECIMAL" : "FLOAT"

        // Fetch attendance trend (last 13 weeks)
        // Explicitly using week_number and avoiding any implicit "week" references
        const attendanceTrend = await dbAll(`
            SELECT gs.week_number, 
                   COUNT(gs.id) as session_count,
                   AVG(CAST((SELECT COUNT(*) FROM session_attendance sa WHERE sa.session_id = gs.id AND sa.attended = 1) AS ${floatCast}) / 
                       NULLIF((SELECT COUNT(*) FROM formation_group_members fgm WHERE fgm.formation_group_id = gs.formation_group_id), 0)) * 100 as avg_att
            FROM group_sessions gs
            JOIN formation_groups fg ON gs.formation_group_id = fg.id
            WHERE gs.did_not_meet = 0 ${celebrationPoint ? 'AND fg.celebration_point = ?' : ''}
            AND gs.week_number BETWEEN 1 AND 13
            GROUP BY gs.week_number
            ORDER BY gs.week_number ASC
        `, celebrationPoint ? [celebrationPoint] : [])

        const attendanceByWeek = Array.from({ length: 13 }, (_, i) => ({
            label: `Week ${i + 1}`,
            value: 0
        }))

        attendanceTrend.forEach(t => {
            const wk = parseInt(t.week_number, 10)
            if (wk >= 1 && wk <= 13) {
                attendanceByWeek[wk - 1].value = Math.round(t.avg_att || 0)
            }
        })

        attendanceStats.trend = attendanceByWeek

        // Fetch Top Groups by Sessions
        topGroups = await dbAll(`
            SELECT fg.name, fg.group_code, COUNT(gs.id) as sessions
            FROM formation_groups fg
            JOIN group_sessions gs ON gs.formation_group_id = fg.id
            WHERE fg.active = 1 AND gs.did_not_meet = 0 ${celebrationPoint ? 'AND fg.celebration_point = ?' : ''}
            GROUP BY fg.id, fg.name, fg.group_code
            ORDER BY sessions DESC
            LIMIT 5
        `, celebrationPoint ? [celebrationPoint] : [])

        // Fetch Reporting Stats from Notion cache
        const reports = await dbAll(`
            SELECT wr.id, wr.week_number, wr.pastoral_concerns, fg.celebration_point
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            WHERE 1=1 ${celebrationPoint ? 'AND fg.celebration_point = ?' : ''}
        `, celebrationPoint ? [celebrationPoint] : [])

        const totalGroupsResult = await dbGet(`SELECT COUNT(*) as count FROM formation_groups WHERE active = 1 ${celebrationPoint ? 'AND celebration_point = ?' : ''}`, celebrationPoint ? [celebrationPoint] : [])
        const totalGroupsCount = totalGroupsResult?.count || 1
        
        reportingStats.totalReports = reports.length
        reportingStats.pastoralConcerns = reports.filter(r => r.pastoral_concerns && r.pastoral_concerns.length > 2).length
        reportingStats.compliance = Math.round((reports.length / (totalGroupsCount * 13)) * 100)

        // Engagement/Pastoral trend over weeks (1-13)
        const reportTrend = await dbAll(`
            SELECT wr.week_number, 
                   COUNT(wr.id) as report_count,
                   SUM(CASE WHEN wr.pastoral_concerns IS NOT NULL AND LENGTH(wr.pastoral_concerns) > 2 THEN 1 ELSE 0 END) as concerns_count
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            WHERE wr.week_number BETWEEN 1 AND 13 ${celebrationPoint ? 'AND fg.celebration_point = ?' : ''}
            GROUP BY wr.week_number
            ORDER BY wr.week_number ASC
        `, celebrationPoint ? [celebrationPoint] : [])

        const trendsByWeek = Array.from({ length: 13 }, (_, i) => ({
            week: i + 1,
            reports: 0,
            concerns: 0
        }))

        reportTrend.forEach(t => {
            const wk = parseInt(t.week_number, 10)
            if (wk >= 1 && wk <= 13) {
                trendsByWeek[wk - 1].reports = t.report_count
                trendsByWeek[wk - 1].concerns = t.concerns_count
            }
        })

        reportingStats.trends = trendsByWeek

        res.json({
            success: true,
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            atRiskCount: stats.atRiskStudents,
            completedStudents: stats.healthyStudents, 
            avgProgress: stats.averageProgress,
            inactiveCount: stats.totalStudents - stats.activeStudents,
            progressDistribution: chartData.progressDistribution,
            atRiskDist: chartData.riskDistribution,
            completionStatus: chartData.completionStatus,
            courseProgress: chartData.courseProgress,
            attendanceStats,
            topGroups,
            formationStats: reportingStats
        })
    } catch (e) {
        console.error('Stats endpoint error:', e.message)
        res.status(500).json({ success: false, message: 'Failed to fetch stats' })
    }
})

// Get student data
router.get('/students', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const celebrationPoint = req.scopedCelebrationPoint
        const cacheKey = `cache:students:${user.id}:${celebrationPoint || 'global'}`
        
        const cachedRes = await getCache(cacheKey)
        if (cachedRes) return res.json(cachedRes)

        const result = await getStudentData(celebrationPoint)
        let students = result.students || []

        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            const members = await dbAll(`
                SELECT fgm.student_id
                FROM formation_group_members fgm
                JOIN formation_groups fg ON fgm.formation_group_id = fg.id
                WHERE fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?
            `, [user.id, user.id])
            const memberIds = new Set(members.map(m => String(m.student_id)))
            students = students.filter(s => memberIds.has(String(s.id || s.userId)))
        }

        const stats = getStats(students)
        const chartData = getChartData(students)

        const payload = { success: true, students, stats, chartData, lastUpdated: result.lastUpdated }
        await setCache(cacheKey, payload, 300)
        res.json(payload)
    } catch (error) {
        console.error('Get students error:', error)
        res.status(500).json({ success: false, message: 'Failed to load student data' })
    }
})

// Get individual student details
router.get('/students/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const student = await getStudentById(id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        const notes = await getNotes(id);
        const progress = getStudentProgress(id);
        res.json({ success: true, student: { ...student, ...progress }, notes: notes || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load student details' });
    }
})

// Get paginated users
router.get('/users', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const result = await getPaginatedUsers({
            ...req.query,
            celebrationPoint: req.scopedCelebrationPoint || ''
        })
        res.json(result)
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load users' })
    }
})

export default router
