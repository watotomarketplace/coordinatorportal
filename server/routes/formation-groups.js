import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAuth, requireAdminOrTechSupport, requireGroupManager, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES, userHasAnyRole } from '../middleware/rbac.js'
import { getStudentById } from '../services/thinkific.js'

const router = express.Router()

// Ensure all responses have proper Content-Type for JSON APIs
router.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json')
    next()
})

// --- Campus Code Mapping ---
const CAMPUS_CODES = {
    'Bbira': 'WBB', 'Bugolobi': 'WBG', 'Bweyogerere': 'WBW', 'Downtown': 'WDT',
    'Entebbe': 'WEN', 'Nakwero': 'WGN', 'Gulu': 'WGU', 'Jinja': 'WJJ',
    'Juba': 'WJB', 'Kansanga': 'WKA', 'Kyengera': 'WKY', 'Laminadera': 'WLM',
    'Lubowa': 'WLB', 'Mbarara': 'WMB', 'Mukono': 'WMK', 'Nansana': 'WNW',
    'Ntinda': 'WNT', 'Online': 'WON', 'Suubi': 'WSU'
}

// Generate next group code
async function generateGroupCode(celebrationPoint) {
    const prefix = CAMPUS_CODES[celebrationPoint]
    if (!prefix) throw new Error(`Unknown celebration point: "${celebrationPoint}"`)
    const allCodes = await dbAll('SELECT group_code FROM formation_groups WHERE celebration_point = ?', [celebrationPoint])
    const nums = allCodes.map(r => {
        const match = r.group_code.match(/(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
    }).filter(n => !isNaN(n))
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1
    return `${prefix}${String(nextNum).padStart(2, '0')}`
}

// --- LIST GROUPS ---
router.get('/', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const currentWeekSetting = await dbGet("SELECT value FROM system_settings WHERE key = 'current_week'")
        const currentWeek = currentWeekSetting ? parseInt(currentWeekSetting.value, 10) : 0
        const targetWeek = currentWeek > 1 ? currentWeek - 1 : 0

        const overdueCheck = targetWeek > 0 ? `
            , (SELECT CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END FROM weekly_reports wr WHERE wr.formation_group_id = fg.id AND wr.week_number = ${targetWeek}) as is_overdue
        ` : ', 0 as is_overdue'

        let groups = []
        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            groups = await dbAll(`
                SELECT fg.*, u.name as facilitator_name, u2.name as co_facilitator_name,
                    (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                    ${overdueCheck}
                FROM formation_groups fg
                LEFT JOIN users u ON fg.facilitator_user_id = u.id
                LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
                WHERE (fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?) AND fg.active = 1
                ORDER BY fg.group_code
            `, [user.id, user.id])
        } else {
            const campus = req.scopedCelebrationPoint
            const query = `
                SELECT fg.*, u.name as facilitator_name, u2.name as co_facilitator_name,
                    (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                    ${overdueCheck}
                FROM formation_groups fg
                LEFT JOIN users u ON fg.facilitator_user_id = u.id
                LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
                WHERE ${campus ? 'fg.celebration_point = ? AND ' : ''} fg.active = 1
                ORDER BY fg.group_code
            `
            groups = await dbAll(query, campus ? [campus] : [])
        }

        res.json({ success: true, groups })
    } catch (error) {
        console.error('GET /formation-groups error:', error.message, error.stack)
        res.status(500).json({ success: false, message: 'Failed to fetch groups', detail: error.message })
    }
})

// --- GET GROUP DETAIL ---
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const group = await dbGet(`
            SELECT fg.*, u.name as facilitator_name, u2.name as co_facilitator_name
            FROM formation_groups fg
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
            WHERE fg.id = ?
        `, [req.params.id])

        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

        // Access check
        if ((user.role === 'Facilitator' || user.role === 'CoFacilitator') && group.facilitator_user_id !== user.id && group.co_facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }

        let members = await dbAll(`
            SELECT fgm.student_id, fgm.student_name, fgm.student_email,
                (SELECT COUNT(*)
                    FROM session_attendance sa
                    JOIN group_sessions gs ON sa.session_id = gs.id
                    JOIN group_members gm ON sa.group_member_id = gm.id
                    WHERE gm.student_thinkific_id = fgm.student_id
                      AND gs.formation_group_id = fgm.formation_group_id
                      AND sa.attended = 1
                      AND gs.did_not_meet = 0
                ) as attended,
                (SELECT COUNT(*) FROM group_sessions gs WHERE gs.formation_group_id = fgm.formation_group_id AND gs.did_not_meet = 0) as total
            FROM formation_group_members fgm
            WHERE fgm.formation_group_id = ?
        `, [req.params.id])

        members = members.map(m => {
            const detail = getStudentById(m.student_id)
            const percentage = m.total > 0 ? Math.round((m.attended / m.total) * 100) : 0
            return { ...m, ...detail, percentage }
        })

        const reports = await dbAll(`
            SELECT id, week_number, attendance_count, engagement_level, submitted_at
            FROM weekly_reports WHERE formation_group_id = ? ORDER BY week_number DESC
        `, [req.params.id])

        res.json({ success: true, group, members, reports })
    } catch (error) {
        console.error('GET /formation-groups/:id error:', error.message, error.stack)
        res.status(500).json({ success: false, message: 'Failed to fetch group details', detail: error.message })
    }
})

// --- CREATE GROUP ---
router.post('/', requireGroupManager, async (req, res) => {
    try {
        const user = req.session.user
        const { celebration_point, cohort, facilitator_user_id, co_facilitator_user_id } = req.body
        if (!celebration_point) return res.status(400).json({ success: false, message: 'celebration_point required' })

        // Campus-scoped roles can only create groups for their own campus
        const isCampusScoped = !userHasAnyRole(user, ['Admin'])
        if (isCampusScoped && celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: `You can only create groups for your campus (${user.celebration_point})` })
        }

        const group_code = await generateGroupCode(celebration_point)
        const result = await dbRun(
            'INSERT INTO formation_groups (group_code, name, celebration_point, facilitator_user_id, co_facilitator_user_id, cohort, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [group_code, group_code, celebration_point, facilitator_user_id || null, co_facilitator_user_id || null, cohort || null]
        )
        res.json({ success: true, group_code, id: result.lastID ?? result })
    } catch (error) {
        console.error('POST /formation-groups error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to create group', detail: error.message })
    }
})

// --- UPDATE GROUP ---
router.put('/:id', requireGroupManager, async (req, res) => {
    try {
        const user = req.session.user
        const { id } = req.params
        const { group_code, celebration_point, facilitator_user_id, co_facilitator_user_id, cohort, active } = req.body

        // Campus-scoped roles can only edit groups in their own campus
        const isCampusScoped = !userHasAnyRole(user, ['Admin'])
        if (isCampusScoped) {
            const existing = await dbGet('SELECT celebration_point FROM formation_groups WHERE id = ?', [id])
            if (!existing) return res.status(404).json({ success: false, message: 'Group not found' })
            if (existing.celebration_point !== user.celebration_point) {
                return res.status(403).json({ success: false, message: `You can only edit groups for your campus (${user.celebration_point})` })
            }
        }

        await dbRun(`
            UPDATE formation_groups
            SET group_code = ?, name = ?, celebration_point = ?,
                facilitator_user_id = ?, co_facilitator_user_id = ?, cohort = ?, active = ?
            WHERE id = ?
        `, [group_code, group_code, celebration_point, facilitator_user_id || null, co_facilitator_user_id || null, cohort, active ?? 1, id])
        res.json({ success: true })
    } catch (error) {
        console.error('PUT /formation-groups/:id error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to update group' })
    }
})

// --- ADD MEMBER ---
// POST /api/formation-groups/:id/members
router.post('/:id/members', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const groupId = req.params.id

        // Facilitators may only add to their own groups
        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            const group = await dbGet('SELECT facilitator_user_id, co_facilitator_user_id FROM formation_groups WHERE id = ?', [groupId])
            if (!group || (group.facilitator_user_id !== user.id && group.co_facilitator_user_id !== user.id)) {
                return res.status(403).json({ success: false, message: 'Access denied' })
            }
        }

        const { student_id, student_name, student_email } = req.body
        if (!student_id) return res.status(400).json({ success: false, message: 'student_id required' })

        // Prevent duplicate membership
        const existing = await dbGet(
            'SELECT id FROM formation_group_members WHERE formation_group_id = ? AND student_id = ?',
            [groupId, String(student_id)]
        )
        if (existing) return res.status(400).json({ success: false, message: 'Student is already in this group' })

        await dbRun(
            'INSERT INTO formation_group_members (formation_group_id, student_id, student_name, student_email) VALUES (?, ?, ?, ?)',
            [groupId, String(student_id), student_name || '', student_email || '']
        )
        res.json({ success: true })
    } catch (error) {
        console.error('POST /formation-groups/:id/members error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to add member' })
    }
})

// --- REMOVE MEMBER ---
// DELETE /api/formation-groups/:id/members/:studentId
router.delete('/:id/members/:studentId', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        // Only Admin, Coordinator, TechSupport may remove members
        const canRemove = ['Admin', 'Coordinator', 'TechSupport'].some(r => user.role === r ||
            (user.secondary_roles && JSON.parse(user.secondary_roles || '[]').includes(r)))
        if (!canRemove) return res.status(403).json({ success: false, message: 'Access denied' })

        await dbRun(
            'DELETE FROM formation_group_members WHERE formation_group_id = ? AND student_id = ?',
            [req.params.id, String(req.params.studentId)]
        )
        res.json({ success: true })
    } catch (error) {
        console.error('DELETE /formation-groups/:id/members/:studentId error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to remove member' })
    }
})

// --- GET COMMENTS ---
router.get('/:id/comments', requireAuth, async (req, res) => {
    try {
        const comments = await dbAll(`
            SELECT gc.id, gc.content, gc.created_at, u.name as author_name, u.profile_image
            FROM group_comments gc
            JOIN users u ON gc.user_id = u.id
            WHERE gc.formation_group_id = ?
            ORDER BY gc.created_at DESC
        `, [req.params.id])
        res.json({ success: true, comments })
    } catch (error) {
        console.error('GET /formation-groups/:id/comments error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to fetch comments' })
    }
})

// --- ADD COMMENT ---
router.post('/:id/comments', requireAuth, async (req, res) => {
    try {
        const { content } = req.body
        if (!content || !content.trim()) return res.status(400).json({ success: false, message: 'Content required' })
        const user = req.session.user
        await dbRun(
            'INSERT INTO group_comments (formation_group_id, user_id, content) VALUES (?, ?, ?)',
            [req.params.id, user.id, content.trim()]
        )
        res.json({ success: true })
    } catch (error) {
        console.error('POST /formation-groups/:id/comments error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to add comment' })
    }
})

export default router
