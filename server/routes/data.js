import express from 'express'
import { getStudentData, getChartData, getStats, forceRefresh, getPaginatedUsers, getStudentById, getStudentProgress } from '../services/thinkific.js'
import { getNotes, addNote, getGroupNotes, addGroupNote } from '../services/notes.js'
import { getStudentTags, getAllTags, addTag, removeTag, removeTagByName, TAG_COLORS } from '../services/tags.js'
import { logAudit } from '../services/audit.js'
import { requireAuth, applyCampusScope } from '../middleware/rbac.js'
import { dbAll, dbGet } from '../db/init.js'
import { getCache, setCache } from '../services/cache.js'

const router = express.Router()

// Map role to note_type for the comments system (PRD v2 Section 5.5)
const ROLE_NOTE_TYPE_MAP = {
    Admin: 'coordinator',        // Admin inherits all capabilities
    LeadershipTeam: 'coordinator',
    Pastor: 'pastoral',
    Coordinator: 'coordinator',
    Facilitator: 'facilitator_observation',
    TechSupport: 'tech_note'
}

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
                SELECT fgm.student_id, fgm.student_name, fgm.student_email
                FROM formation_group_members fgm
                JOIN formation_groups fg ON fgm.formation_group_id = fg.id
                WHERE fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?
            `, [user.id, user.id])

            const memberIds = new Set(members.map(m => String(m.student_id)))
            const memberEmails = new Set(members.filter(m => m.student_email).map(m => m.student_email.toLowerCase()))

            students = students.filter(s => {
                if (s.id && memberIds.has(String(s.id))) return true
                if (s.userId && memberIds.has(String(s.userId))) return true
                if (s.email && memberEmails.has(s.email.toLowerCase())) return true
                return false
            })
        }

        const stats = getStats(students)
        const chartData = getChartData(students)

        // ═══════════════════════════════════════════════════════
        // ADD ATTENDANCE & REPORTING OVERLAYS (Part 2)
        // ═══════════════════════════════════════════════════════
        let attendanceStats = { avgAttendance: 0, totalSessions: 0, trend: [] }
        let topGroups = []
        let reportingStats = { compliance: 0, totalReports: 0, pastoralConcerns: 0, trends: [] }

        // Fetch attendance trend (last 6 months or 13 weeks)
        const attendanceTrend = await dbAll(`
            SELECT strftime('%Y-%W', session_date) as week, 
                   COUNT(*) as session_count,
                   AVG(CAST((SELECT COUNT(*) FROM session_attendance WHERE session_id = gs.id AND attended = 1) AS FLOAT) / 
                       NULLIF((SELECT COUNT(*) FROM group_members WHERE formation_group_id = gs.formation_group_id AND active = 1), 0)) * 100 as avg_att
            FROM group_sessions gs
            JOIN formation_groups fg ON gs.formation_group_id = fg.id
            WHERE gs.did_not_meet = 0 ${celebrationPoint ? 'AND fg.celebration_point = ?' : ''}
            GROUP BY week
            ORDER BY week DESC
            LIMIT 13
        `, celebrationPoint ? [celebrationPoint] : [])

        attendanceStats.trend = attendanceTrend.reverse().map(t => ({
            label: `Week ${t.week.split('-')[1]}`,
            value: Math.round(t.avg_att || 0)
        }))

        // Fetch Top Groups by Sessions
        topGroups = await dbAll(`
            SELECT fg.name, fg.group_code, COUNT(gs.id) as sessions,
                   (SELECT COUNT(*) FROM group_members WHERE formation_group_id = fg.id AND active = 1) as members
            FROM formation_groups fg
            LEFT JOIN group_sessions gs ON gs.formation_group_id = fg.id AND gs.did_not_meet = 0
            WHERE fg.active = 1 ${celebrationPoint ? 'AND fg.celebration_point = ?' : ''}
            GROUP BY fg.id
            ORDER BY sessions DESC
            LIMIT 5
        `, celebrationPoint ? [celebrationPoint] : [])

        // Fetch Reporting Stats from Notion cache
        const reports = await dbAll(`
            SELECT wr.*, fg.celebration_point
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            WHERE 1=1 ${celebrationPoint ? 'AND fg.celebration_point = ?' : ''}
        `, celebrationPoint ? [celebrationPoint] : [])

        const totalGroups = (await dbGet(`SELECT COUNT(*) as count FROM formation_groups WHERE active = 1 ${celebrationPoint ? 'AND celebration_point = ?' : ''}`, celebrationPoint ? [celebrationPoint] : [])).count || 1
        
        reportingStats.totalReports = reports.length
        reportingStats.pastoralConcerns = reports.filter(r => r.pastoral_concerns === 1 || r.pastoral_concerns === true).length
        reportingStats.compliance = Math.round((reports.length / (totalGroups * 13)) * 100) // Rough estimation across 13 weeks

        // Engagement/Pastoral trend over weeks
        const reportTrend = await dbAll(`
            SELECT week_number, 
                   COUNT(*) as count,
                   SUM(CASE WHEN pastoral_concerns = 1 THEN 1 ELSE 0 END) as concerns
            FROM weekly_reports wr
            JOIN formation_groups fg ON wr.formation_group_id = fg.id
            WHERE 1=1 ${celebrationPoint ? 'AND fg.celebration_point = ?' : ''}
            GROUP BY week_number
            ORDER BY week_number ASC
        `, celebrationPoint ? [celebrationPoint] : [])

        reportingStats.trends = reportTrend.map(t => ({
            week: t.week_number,
            reports: t.count,
            concerns: t.concerns
        }))

        res.json({
            success: true,
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            atRiskCount: stats.atRiskStudents,
            completedStudents: stats.healthyStudents, 
            avgProgress: stats.averageProgress,
            inactiveCount: stats.totalStudents - stats.activeStudents,
            
            // Chart Data Overlays
            progressDistribution: chartData.progressDistribution,
            atRiskDist: chartData.riskDistribution,
            completionStatus: chartData.completionStatus,
            courseProgress: chartData.courseProgress,
            
            // New Operational Layers
            attendanceStats,
            topGroups,
            formationStats: reportingStats
        })
    } catch (e) {
        console.error('Stats endpoint error', e)
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
        if (cachedRes) {
            return res.json(cachedRes)
        }

        const result = await getStudentData(celebrationPoint)
        let students = result.students || []

        // Facilitators: filter to only students in their assigned groups
        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            const members = await dbAll(`
                SELECT fgm.student_id, fgm.student_name, fgm.student_email
                FROM formation_group_members fgm
                JOIN formation_groups fg ON fgm.formation_group_id = fg.id
                WHERE fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?
            `, [user.id, user.id])

            const memberIds = new Set(members.map(m => String(m.student_id)))
            const memberEmails = new Set(members.filter(m => m.student_email).map(m => m.student_email.toLowerCase()))

            students = students.filter(s => {
                // Match by student_id or by email
                if (s.id && memberIds.has(String(s.id))) return true
                if (s.email && memberEmails.has(s.email.toLowerCase())) return true
                return false
            })
        }

        const stats = getStats(students)
        const chartData = getChartData(students)

        const payload = {
            success: true,
            students,
            stats,
            chartData,
            lastUpdated: result.lastUpdated
        }
        await setCache(cacheKey, payload, 300) // 5 Min TTL
        res.json(payload)
    } catch (error) {
        console.error('Get students error:', error)
        res.json({ success: false, message: 'Failed to load student data' })
    }
})

// Get inactive students — dedicated endpoint for "View Inactive Students"
router.get('/inactive', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const campus = req.scopedCelebrationPoint || null
        const result = await getStudentData(campus)

        const threshold = parseInt(req.query.days) || 14 // Default 14 days
        let inactive = (result.students || [])
            .filter(s => s.daysInactive >= threshold)
            .sort((a, b) => b.daysInactive - a.daysInactive)

        // Facilitator filter — only their group members
        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            const groupMembers = await dbAll(`
                SELECT fgm.student_id, fgm.student_email FROM formation_group_members fgm
                JOIN formation_groups fg ON fgm.formation_group_id = fg.id
                WHERE fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?
            `, [user.id, user.id])
            const memberIds = new Set(groupMembers.map(m => String(m.student_id)))
            const memberEmails = new Set(groupMembers.map(m => m.student_email).filter(Boolean))
            inactive = inactive.filter(s =>
                memberIds.has(String(s.userId)) || memberIds.has(String(s.id)) ||
                memberEmails.has(s.email)
            )
        }

        res.json({
            success: true,
            students: inactive,
            total: inactive.length,
            threshold,
            lastUpdated: result.lastUpdated
        })
    } catch (error) {
        console.error('Get inactive students error:', error)
        res.status(500).json({ success: false, message: 'Failed to load inactive students' })
    }
})

// Get individual student details
router.get('/students/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const student = await getStudentById(id);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found in cache' });
        }

        const notes = await getNotes(id);
        const progress = getStudentProgress(id);

        res.json({ 
            success: true, 
            student: { ...student, ...progress }, 
            notes: notes || [] 
        });
    } catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({ success: false, message: 'Failed to load student details' });
    }
})

// Get paginated users (Unified Endpoint)
router.get('/users', requireAuth, applyCampusScope, async (req, res) => {
    try {
        // Extract params
        const { page, limit, type, search, date, noCompany, source } = req.query

        const result = await getPaginatedUsers({
            page: page || 1,
            limit: limit || 50,
            type: type || 'enrolled',
            search: search || '',
            celebrationPoint: req.scopedCelebrationPoint || '',
            date: date || '',
            noCompany: noCompany === 'true',
            source: source || 'all',
            risk: req.query.risk || ''
        })

        res.json(result)

    } catch (error) {
        console.error('Get paginated users error:', error)
        res.status(500).json({ success: false, message: 'Failed to load users' })
    }
})

// Refresh data manually
router.post('/refresh', requireAuth, async (req, res) => {
    try {
        forceRefresh()
        res.json({ success: true, message: 'Data refresh started in background' })
    } catch (error) {
        res.json({ success: false, message: 'Refresh failed' })
    }
})

// --- NOTES ENDPOINTS ---

// Get notes for a student
router.get('/notes/:studentId', requireAuth, async (req, res) => {
    try {
        const { studentId } = req.params;
        const notes = await getNotes(studentId);
        res.json({ success: true, notes });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notes' });
    }
});

// Add a note (PRD v2: includes author_role and note_type)
router.post('/notes', requireAuth, async (req, res) => {
    try {
        const { studentId, groupId, content, celebrationPoint } = req.body;
        const user = req.session.user;

        if ((!studentId && !groupId) || !content) {
            return res.status(400).json({ success: false, message: 'Missing required fields (studentId or groupId, and content)' });
        }

        const noteType = ROLE_NOTE_TYPE_MAP[user.role] || 'coordinator'
        const cp = celebrationPoint || user.celebration_point || 'Unknown'

        if (groupId) {
            await addGroupNote(groupId, user.name, cp, content, user.role, noteType)
            logAudit(user.name, user.role, 'ADD_NOTE', `Added ${noteType} note to group ${groupId}`)
        } else {
            await addNote(studentId, user.name, cp, content, user.role, noteType)
            logAudit(user.name, user.role, 'ADD_NOTE', `Added ${noteType} note to student ${studentId}`)
        }

        res.json({ success: true, message: 'Note added' });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ success: false, message: 'Failed to add note' });
    }
});

// Get notes for a formation group
router.get('/notes/group/:groupId', requireAuth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const notes = await getGroupNotes(groupId);
        res.json({ success: true, notes });
    } catch (error) {
        console.error('Get group notes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch group notes' });
    }
});

// ═══════════════════════════════════════════════════════
// STUDENT TAGS (macOS Finder-style Tagging)
// ═══════════════════════════════════════════════════════
router.get('/tags', requireAuth, async (req, res) => {
    try {
        const tags = getAllTags()
        res.json({ success: true, tags, colors: TAG_COLORS })
    } catch (error) {
        console.error('Get all tags error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch tags' })
    }
})

router.get('/tags/:studentId', requireAuth, async (req, res) => {
    try {
        const tags = getStudentTags(req.params.studentId)
        res.json({ success: true, tags })
    } catch (error) {
        console.error('Get student tags error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch student tags' })
    }
})

router.post('/tags', requireAuth, async (req, res) => {
    try {
        const { studentId, tagName, color } = req.body
        if (!studentId || !tagName) {
            return res.status(400).json({ success: false, message: 'studentId and tagName required' })
        }
        addTag(studentId, tagName.trim(), color || '#007aff', req.user?.name)
        res.json({ success: true })
    } catch (error) {
        console.error('Add tag error:', error)
        res.status(500).json({ success: false, message: 'Failed to add tag' })
    }
})

router.delete('/tags/:id', requireAuth, async (req, res) => {
    try {
        removeTag(req.params.id)
        res.json({ success: true })
    } catch (error) {
        console.error('Remove tag error:', error)
        res.status(500).json({ success: false, message: 'Failed to remove tag' })
    }
})

// ═══════════════════════════════════════════════════════
// UNIFIED SEARCH (Spotlight Search)
// Search across students, groups, notes in one call
// ═══════════════════════════════════════════════════════
router.get('/search', requireAuth, async (req, res) => {
    try {
        const { q } = req.query
        if (!q || q.trim().length < 2) {
            return res.json({ success: true, results: { students: [], groups: [], notes: [] } })
        }

        const term = `%${q.trim()}%`
        const { dbAll } = await import('../db/init.js')

        // Search students
        const students = (await dbAll(`
            SELECT id, first_name, last_name, email, celebration_point, percentage_completed,
                   risk_score, days_since_last_sign_in
            FROM students
            WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
            ORDER BY first_name
            LIMIT 8
        `, [term, term, term])).map(s => ({
            ...s,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            type: 'student'
        }))

        // Search formation groups
        const groups = (await dbAll(`
            SELECT fg.id, fg.name, fg.group_code, fg.celebration_point, fg.active,
                   u.name as facilitator_name,
                   (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
            FROM formation_groups fg
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            WHERE fg.name LIKE ? OR fg.group_code LIKE ? OR fg.celebration_point LIKE ?
            ORDER BY fg.name
            LIMIT 6
        `, [term, term, term])).map(g => ({ ...g, type: 'group' }))

        // Search notes
        const notes = (await dbAll(`
            SELECT id, student_id, group_id, author_name, content, created_at
            FROM notes
            WHERE content LIKE ? OR author_name LIKE ?
            ORDER BY created_at DESC
            LIMIT 5
        `, [term, term])).map(n => ({ ...n, type: 'note' }))

        res.json({
            success: true,
            results: { students, groups, notes }
        })
    } catch (error) {
        console.error('Unified search error:', error)
        res.status(500).json({ success: false, message: 'Search failed' })
    }
})

export default router
