import express from 'express'
import { dbAll, dbGet, IS_POSTGRES } from '../db/init.js'
import { getStudentData } from '../services/thinkific.js'
import { requireAuth, applyCampusScope, GLOBAL_ROLES } from '../middleware/rbac.js'
import { getCache, setCache } from '../services/cache.js'

const router = express.Router()

/**
 * GET /api/dashboard/all
 * Single consolidated endpoint for all dashboard data.
 * Uses: Thinkific in-memory cache, weekly_reports, group_sessions, session_attendance.
 * Cache TTL: 5 minutes.
 */
router.get('/', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const isGlobal = GLOBAL_ROLES.includes(user.role)
        const campus = req.query.campus || req.query.celebration_point || req.scopedCelebrationPoint || (!isGlobal ? user.celebration_point : null)

        const cacheKey = `cache:dashboard:all:${user.id}:${campus || 'global'}`
        const cached = await getCache(cacheKey)
        if (cached) return res.json(cached)

        // ── 1. Thinkific student stats ──────────────────────────────────────────
        const thinkificData = await getStudentData(campus)
        let students = thinkificData.students || []
        console.log(`[Dashboard/all] Total students in cache: ${thinkificData.students?.length ?? 0}, after campus filter (${campus || 'global'}): ${students.length}`)

        // Facilitator scope: limit to their group members
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

        const total = students.length
        const avgProgress = total > 0
            ? Math.round(students.reduce((acc, s) => acc + (s.progress || 0), 0) / total)
            : 0

        // Active: enrollment updated within last 30 days (daysSinceActivity from risk engine)
        const activeStudents = students.filter(s => {
            const dsa = s.risk?.breakdown?.daysSinceActivity
            if (dsa !== undefined && dsa < 999) return dsa <= 30
            if (s.lastActivity) return (new Date() - new Date(s.lastActivity)) < 30 * 864e5
            return false
        }).length

        // Inactive counts
        const over30 = students.filter(s => {
            const dsa = s.risk?.breakdown?.daysSinceActivity ?? 999
            return dsa > 30
        }).length
        const over14 = students.filter(s => {
            const dsa = s.risk?.breakdown?.daysSinceActivity ?? 999
            return dsa > 14
        }).length

        // Risk categories
        const healthy = students.filter(s => s.risk_category === 'Healthy').length
        const attention = students.filter(s => s.risk_category === 'Attention').length
        const critical = students.filter(s => s.risk_category === 'Critical').length

        // Progress distribution (5 × 20% buckets: 0-19, 20-39, 40-59, 60-79, 80-100)
        const progressDist = [0, 0, 0, 0, 0]
        students.forEach(s => {
            const p = s.progress || 0
            progressDist[Math.min(Math.floor(p / 20), 4)]++
        })

        // Completion status [onTrack≥75%, inProgress 1-74%, notStarted 0%]
        const onTrack = students.filter(s => (s.progress || 0) >= 75).length
        const inProgress = students.filter(s => (s.progress || 0) >= 1 && (s.progress || 0) < 75).length
        const notStarted = students.filter(s => (s.progress || 0) === 0).length

        // Course progress grouping
        const courseMap = {}
        students.forEach(s => {
            const c = s.course || 'Watoto Leadership 101'
            if (!courseMap[c]) courseMap[c] = { sum: 0, count: 0 }
            courseMap[c].sum += (s.progress || 0)
            courseMap[c].count++
        })
        const courseEntries = Object.entries(courseMap)
        const courseProgress = {
            labels: courseEntries.map(([name]) => name),
            values: courseEntries.map(([, d]) => Math.round(d.sum / d.count))
        }

        // ── 2. Campus / group scope helpers ────────────────────────────────────
        const floatCast = IS_POSTGRES ? 'DECIMAL' : 'FLOAT'
        const campusFilter = campus ? 'AND fg.celebration_point = ?' : ''
        const campusParam = campus ? [campus] : []

        // ── 3. Attendance trend (weeks 1-13) ────────────────────────────────────
        const attendanceTrend = await dbAll(`
            SELECT gs.week_number,
                   COUNT(gs.id) as session_count,
                   COALESCE(
                     AVG(
                       CAST((
                         SELECT COUNT(*) FROM session_attendance sa
                         JOIN group_members gm ON sa.group_member_id = gm.id
                         WHERE sa.session_id = gs.id AND sa.attended = 1
                       ) AS ${floatCast}) /
                       NULLIF((
                         SELECT COUNT(*) FROM group_members gm2
                         WHERE gm2.formation_group_id = gs.formation_group_id AND gm2.active = 1
                       ), 0)
                     ) * 100,
                   0) as avg_att
            FROM group_sessions gs
            JOIN formation_groups fg ON gs.formation_group_id = fg.id
            WHERE gs.did_not_meet = 0 ${campusFilter}
              AND gs.week_number BETWEEN 1 AND 13
            GROUP BY gs.week_number
            ORDER BY gs.week_number
        `, campusParam)

        const attendanceByWeek = Array.from({ length: 13 }, (_, i) => ({
            label: `Week ${i + 1}`,
            value: 0
        }))
        let totalSessions = 0
        let attSum = 0
        let attWeeks = 0
        attendanceTrend.forEach(t => {
            const wk = parseInt(t.week_number, 10)
            if (wk >= 1 && wk <= 13) {
                const val = Math.round(t.avg_att || 0)
                attendanceByWeek[wk - 1].value = val
                totalSessions += parseInt(t.session_count, 10) || 0
                if (t.avg_att != null) { attSum += val; attWeeks++ }
            }
        })
        const avgAttendance = attWeeks > 0 ? Math.round(attSum / attWeeks) : 0

        // Groups with at least one session
        const groupsTrackingRow = await dbGet(`
            SELECT COUNT(DISTINCT gs.formation_group_id) as cnt
            FROM group_sessions gs
            JOIN formation_groups fg ON gs.formation_group_id = fg.id
            WHERE gs.did_not_meet = 0 ${campusFilter}
        `, campusParam)
        const groupsTracking = groupsTrackingRow?.cnt || 0

        // ── 4. Pastoral concerns trend (weeks 1-13) ─────────────────────────────
        // Filter out "None"/"None for now" etc. — real concerns only
        const pastoralTrend = await dbAll(`
            SELECT wr.week_number, COUNT(*) as cnt
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            WHERE wr.pastoral_concerns IS NOT NULL
              AND LENGTH(wr.pastoral_concerns) > 20
              AND LOWER(wr.pastoral_concerns) NOT LIKE '%none%'
              AND wr.week_number BETWEEN 1 AND 13
              ${campusFilter}
            GROUP BY wr.week_number
            ORDER BY wr.week_number
        `, campusParam)

        const trendsByWeek = Array.from({ length: 13 }, (_, i) => ({
            week: i + 1,
            reports: 0,
            concerns: 0
        }))
        pastoralTrend.forEach(t => {
            const wk = parseInt(t.week_number, 10)
            if (wk >= 1 && wk <= 13) trendsByWeek[wk - 1].concerns = t.cnt
        })

        // Also fill report counts per week
        const reportCountsByWeek = await dbAll(`
            SELECT wr.week_number, COUNT(*) as cnt
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            WHERE wr.week_number BETWEEN 1 AND 13 ${campusFilter}
            GROUP BY wr.week_number
            ORDER BY wr.week_number
        `, campusParam)
        reportCountsByWeek.forEach(t => {
            const wk = parseInt(t.week_number, 10)
            if (wk >= 1 && wk <= 13) trendsByWeek[wk - 1].reports = t.cnt
        })

        // ── 5. Reporting compliance ─────────────────────────────────────────────
        const currentWeekRow = await dbGet("SELECT value FROM system_settings WHERE key = 'current_week'")
        const currentWeek = currentWeekRow ? parseInt(currentWeekRow.value, 10) : 0

        const totalGroupsRow = await dbGet(
            `SELECT COUNT(*) as c FROM formation_groups WHERE active = 1 ${campus ? 'AND celebration_point = ?' : ''}`,
            campus ? [campus] : []
        )
        const totalGroups = totalGroupsRow?.c || 1

        let submittedThisWeek = 0
        if (currentWeek > 0) {
            const submitted = await dbGet(
                `SELECT COUNT(DISTINCT wr.formation_group_id) as c FROM weekly_reports wr JOIN formation_groups fg ON wr.formation_group_id = fg.id WHERE wr.week_number = ? ${campusFilter}`,
                currentWeek > 0 ? [currentWeek, ...campusParam] : campusParam
            )
            submittedThisWeek = submitted?.c || 0
        }
        const compliance = Math.round((submittedThisWeek / totalGroups) * 100)

        const totalReportsRow = await dbGet(
            `SELECT COUNT(*) as c FROM weekly_reports wr JOIN formation_groups fg ON wr.formation_group_id = fg.id WHERE 1=1 ${campusFilter}`,
            campusParam
        )
        const totalReports = totalReportsRow?.c || 0

        const totalPastoralRow = await dbGet(
            `SELECT COUNT(*) as c FROM weekly_reports wr JOIN formation_groups fg ON wr.formation_group_id = fg.id WHERE LENGTH(wr.pastoral_concerns) > 20 AND LOWER(wr.pastoral_concerns) NOT LIKE '%none%' ${campusFilter}`,
            campusParam
        )
        const totalPastoral = totalPastoralRow?.c || 0

        // ── 6. Top groups by sessions ───────────────────────────────────────────
        const topGroups = await dbAll(`
            SELECT fg.group_code, COUNT(gs.id) as sessions
            FROM formation_groups fg
            JOIN group_sessions gs ON gs.formation_group_id = fg.id
            WHERE fg.active = 1 AND gs.did_not_meet = 0 ${campusFilter}
            GROUP BY fg.id, fg.group_code
            ORDER BY sessions DESC
            LIMIT 5
        `, campusParam)

        // ── 7. Assemble response (same shape as /api/data/stats) ───────────────
        const payload = {
            success: true,
            // KPIs
            totalStudents: total,
            activeStudents,
            completedStudents: healthy,   // "On Track" uses healthy count
            avgProgress,
            inactiveCount: over30,
            atRiskCount: attention + critical,
            // Chart data
            atRiskDist: { healthy, attention, critical },
            progressDistribution: progressDist,
            completionStatus: [onTrack, inProgress, notStarted],
            courseProgress,
            // Attendance
            attendanceStats: {
                avgAttendance,
                totalSessions,
                trend: attendanceByWeek
            },
            // Formation / Notion
            formationStats: {
                compliance,
                totalReports,
                pastoralConcerns: totalPastoral,
                trends: trendsByWeek
            },
            topGroups,
            // Attendance layer extras
            attendanceLayer: {
                totalSessions,
                groupsTracking,
                totalGroups,
                avgAttendance
            },
            // Inactivity bars (absolute counts)
            inactivityBars: { over30, over14 }
        }

        await setCache(cacheKey, payload, 300)
        res.json(payload)
    } catch (err) {
        console.error('GET /api/dashboard/all error:', err.message, err.stack)
        res.status(500).json({ success: false, message: 'Failed to load dashboard data', detail: err.message })
    }
})

export default router
