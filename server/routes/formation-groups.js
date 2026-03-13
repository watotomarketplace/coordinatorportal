import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAuth, requireAdmin, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES, userHasAnyRole } from '../middleware/rbac.js'

const router = express.Router()

// --- Campus Code Mapping ---
const CAMPUS_CODES = {
    'Bbira': 'WBB', 'Bugolobi': 'WBG', 'Bweyogerere': 'WBW', 'Downtown': 'WDT',
    'Entebbe': 'WEN', 'Nakwero': 'WGN', 'Gulu': 'WGU', 'Jinja': 'WJJ',
    'Juba': 'WJB', 'Kansanga': 'WKA', 'Kyengera': 'WKY', 'Laminadera': 'WLM',
    'Lubowa': 'WLB', 'Mbarara': 'WMB', 'Mukono': 'WMK', 'Nansana': 'WNW',
    'Ntinda': 'WNT', 'Online': 'WON', 'Suubi': 'WSU'
}

// Generate next group code for a campus (e.g. WDT01, WDT02, ...)
async function generateGroupCode(celebrationPoint) {
    const prefix = CAMPUS_CODES[celebrationPoint] || 'WXX'
    const existing = await dbAll(
        'SELECT group_code FROM formation_groups WHERE celebration_point = ? ORDER BY group_code DESC LIMIT 1',
        [celebrationPoint]
    )
    if (existing.length > 0) {
        // Handle varying lengths robustly using regex to grab trailing digits
        const match = existing[0].group_code.match(/\d+$/)
        const lastNum = match ? parseInt(match[0], 10) : 0
        return `${prefix}${String(lastNum + 1).padStart(2, '0')}`
    }
    return `${prefix}01`
}

// --- LIST GROUPS ---
router.get('/', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        // Get current week from settings
        const currentWeekSetting = await dbGet("SELECT value FROM system_settings WHERE key = 'current_week'")
        const currentWeek = currentWeekSetting ? parseInt(currentWeekSetting.value, 10) : 0
        const targetWeek = currentWeek > 1 ? currentWeek - 1 : 0

        // Common overdue check subquery
        const overdueCheck = targetWeek > 0 ? `
            , (
                SELECT COUNT(*) = 0 
                FROM weekly_reports wr 
                WHERE wr.formation_group_id = fg.id 
                AND wr.week_number = ${targetWeek}
            ) as is_overdue
        ` : ', 0 as is_overdue'

        let groups = []
        if (user.role === 'Facilitator') {
            // Facilitators see only their assigned groups
            groups = await dbAll(`
                SELECT fg.*, u.name as facilitator_name,
                    (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                    ${overdueCheck}
                FROM formation_groups fg
                LEFT JOIN users u ON fg.facilitator_user_id = u.id
                WHERE fg.facilitator_user_id = ? AND fg.active = 1
                ORDER BY fg.group_code
            `, [user.id])
        } else if (GLOBAL_ROLES.includes(user.role)) {
            // Admin, LeadershipTeam see all groups (optionally filtered by campus)
            const campus = req.scopedCelebrationPoint
            if (campus) {
                groups = await dbAll(`
                    SELECT fg.*, u.name as facilitator_name,
                        (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                        ${overdueCheck}
                    FROM formation_groups fg
                    LEFT JOIN users u ON fg.facilitator_user_id = u.id
                    WHERE fg.celebration_point = ? AND fg.active = 1
                    ORDER BY fg.group_code
                `, [campus])
            } else {
                groups = await dbAll(`
                    SELECT fg.*, u.name as facilitator_name,
                        (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                        ${overdueCheck}
                    FROM formation_groups fg
                    LEFT JOIN users u ON fg.facilitator_user_id = u.id
                    WHERE fg.active = 1
                    ORDER BY fg.group_code
                `)
            }
        } else {
            // Campus-scoped roles (Pastor, Coordinator, TechSupport)
            groups = await dbAll(`
                SELECT fg.*, u.name as facilitator_name,
                    (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                    ${overdueCheck}
                FROM formation_groups fg
                LEFT JOIN users u ON fg.facilitator_user_id = u.id
                WHERE fg.celebration_point = ? AND fg.active = 1
                ORDER BY fg.group_code
            `, [req.scopedCelebrationPoint])
        }

        res.json({ success: true, groups })
    } catch (error) {
        console.error('Get formation groups error details:', {
            message: error.message,
            stack: error.stack,
            role: req.session.user?.role,
            scopedCP: req.scopedCelebrationPoint
        })
        res.status(500).json({ success: false, message: 'Failed to fetch groups: ' + error.message })
    }
})

// --- GET GROUP DETAIL ---
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const group = await dbGet(`
            SELECT fg.*, u.name as facilitator_name, u.username as facilitator_username
            FROM formation_groups fg
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            WHERE fg.id = ?
        `, [req.params.id])

        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' })
        }

        // Access check
        if (user.role === 'Facilitator' && group.facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator') {
            if (group.celebration_point !== user.celebration_point) {
                return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
            }
        }

        // Get members
        const members = await dbAll(`
            SELECT fgm.id as membership_id, fgm.student_id, fgm.student_name, fgm.student_email, fgm.joined_at
            FROM formation_group_members fgm
            WHERE fgm.formation_group_id = ?
            ORDER BY fgm.joined_at
        `, [req.params.id])

        // Get weekly reports for this group
        const reports = await dbAll(`
            SELECT wr.id, wr.week_number, wr.attendance_count, wr.engagement_level,
                   wr.formation_evidence, wr.pastoral_concerns, wr.submitted_at,
                   u.name as facilitator_name
            FROM weekly_reports wr
            LEFT JOIN users u ON wr.facilitator_user_id = u.id
            WHERE wr.formation_group_id = ?
            ORDER BY wr.week_number DESC
        `, [req.params.id])

        res.json({ success: true, group, members, reports })
    } catch (error) {
        console.error('Get group detail error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch group details' })
    }
})

// --- CREATE GROUP (Admin, TechSupport, Coordinator) ---
router.post('/', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        if (!userHasAnyRole(user, ['Admin', 'TechSupport', 'Coordinator'])) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }

        const { name, celebration_point, facilitator_user_id, cohort, group_code } = req.body

        if (!name || !celebration_point) {
            return res.status(400).json({ success: false, message: 'Name and Celebration Point are required' })
        }

        // TechSupport can only create groups at their own campus
        if (!userHasAnyRole(user, ['Admin']) && user.celebration_point && celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'You can only create groups at your assigned campus' })
        }

        // Use provided group_code or auto-generate
        const code = group_code || await generateGroupCode(celebration_point)

        // Check uniqueness
        const existing = await dbGet('SELECT id FROM formation_groups WHERE group_code = ?', [code])
        if (existing) {
            return res.status(409).json({ success: false, message: `Group code ${code} already exists` })
        }

        const result = await dbRun(
            'INSERT INTO formation_groups (group_code, name, celebration_point, facilitator_user_id, cohort) VALUES (?, ?, ?, ?, ?)',
            [code, name, celebration_point, facilitator_user_id || null, cohort || '2025']
        )

        res.json({ success: true, groupId: result.lastInsertRowid, group_code: code })
    } catch (error) {
        console.error('Create group error:', error)
        res.status(500).json({ success: false, message: 'Failed to create group' })
    }
})

// --- UPDATE GROUP (Admin, TechSupport, Coordinator) ---
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        if (!userHasAnyRole(user, ['Admin', 'TechSupport', 'Coordinator'])) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }

        const { name, celebration_point, facilitator_user_id, cohort, active } = req.body
        const { id } = req.params

        const group = await dbGet('SELECT id, celebration_point FROM formation_groups WHERE id = ?', [id])
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' })
        }

        // TechSupport can only update groups at their own campus
        if (!userHasAnyRole(user, ['Admin']) && user.celebration_point && group.celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'You can only update groups at your assigned campus' })
        }

        await dbRun(
            `UPDATE formation_groups 
             SET name = COALESCE(?, name), 
                 celebration_point = COALESCE(?, celebration_point),
                 facilitator_user_id = COALESCE(?, facilitator_user_id),
                 cohort = COALESCE(?, cohort),
                 active = COALESCE(?, active)
             WHERE id = ?`,
            [
                name !== undefined ? name : null,
                celebration_point !== undefined ? celebration_point : null,
                facilitator_user_id !== undefined ? facilitator_user_id : null,
                cohort !== undefined ? cohort : null,
                active !== undefined ? active : null,
                id
            ]
        )

        res.json({ success: true })
    } catch (error) {
        console.error('Update group error:', error)
        res.status(500).json({ success: false, message: 'Failed to update group' })
    }
})

// --- ADD MEMBER (Admin, Coordinator, TechSupport, Facilitator) ---
router.post('/:id/members', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        if (!userHasAnyRole(user, ['Admin', 'Coordinator', 'TechSupport', 'Facilitator'])) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }

        const { student_id, student_name, student_email } = req.body
        const groupId = req.params.id

        if (!student_id) {
            return res.status(400).json({ success: false, message: 'student_id is required' })
        }

        // Verify group exists and access
        const group = await dbGet('SELECT * FROM formation_groups WHERE id = ?', [groupId])
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' })
        }
        if (user.role === 'Coordinator' && group.celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
        }

        // Check for duplicate across ANY group
        const existing = await dbGet(
            'SELECT id, formation_group_id FROM formation_group_members WHERE student_id = ?',
            [student_id]
        )
        if (existing) {
            if (existing.formation_group_id === parseInt(groupId, 10)) {
                return res.status(409).json({ success: false, message: 'Student is already in this group' })
            } else {
                return res.status(409).json({ success: false, message: 'Student is already assigned to another formation group' })
            }
        }

        await dbRun(
            'INSERT INTO formation_group_members (formation_group_id, student_id, student_name, student_email) VALUES (?, ?, ?, ?)',
            [groupId, student_id, student_name || null, student_email || null]
        )

        res.json({ success: true })
    } catch (error) {
        console.error('Add member error:', error)
        res.status(500).json({ success: false, message: 'Failed to add member' })
    }
})

// --- REMOVE MEMBER (Admin, Coordinator, TechSupport, Facilitator) ---
router.delete('/:id/members/:studentId', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        if (!userHasAnyRole(user, ['Admin', 'Coordinator', 'TechSupport', 'Facilitator'])) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }

        const { id, studentId } = req.params

        // Verify group exists and access
        const group = await dbGet('SELECT * FROM formation_groups WHERE id = ?', [id])
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' })
        }
        if (user.role === 'Coordinator' && group.celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
        }

        await dbRun(
            'DELETE FROM formation_group_members WHERE formation_group_id = ? AND student_id = ?',
            [id, studentId]
        )

        res.json({ success: true })
    } catch (error) {
        console.error('Remove member error:', error)
        res.status(500).json({ success: false, message: 'Failed to remove member' })
    }
})

// --- GET AVAILABLE FACILITATORS ---
router.get('/facilitators/available', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        let facilitators

        if (GLOBAL_ROLES.includes(user.role)) {
            facilitators = await dbAll(
                "SELECT id, name, celebration_point FROM users WHERE role = 'Facilitator' AND active = 1 ORDER BY name"
            )
        } else {
            facilitators = await dbAll(
                "SELECT id, name, celebration_point FROM users WHERE role = 'Facilitator' AND active = 1 AND celebration_point = ? ORDER BY name",
                [user.celebration_point]
            )
        }

        res.json({ success: true, facilitators })
    } catch (error) {
        console.error('Get facilitators error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch facilitators' })
    }
})

export default router
