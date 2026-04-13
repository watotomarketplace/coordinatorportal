import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAuth, requireAdmin, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES, userHasAnyRole, userHasRole } from '../middleware/rbac.js'
import { getGroupNotes, addGroupNote } from '../services/notes.js'
import { invalidatePattern } from '../services/cache.js'
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

// Generate next group code for a campus (e.g. WDT01, WDT02, ...)
async function generateGroupCode(celebrationPoint) {
    const prefix = CAMPUS_CODES[celebrationPoint]
    if (!prefix) {
        throw new Error(`Unknown celebration point: "${celebrationPoint}". Valid values: ${Object.keys(CAMPUS_CODES).join(', ')}`)
    }
    const allCodes = await dbAll(
        'SELECT group_code FROM formation_groups WHERE celebration_point = ?',
        [celebrationPoint]
    )
    const nums = allCodes
        .map(r => {
            const match = r.group_code.match(/(\d+)$/)
            return match ? parseInt(match[1], 10) : 0
        })
        .filter(n => !isNaN(n))
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1
    return `${prefix}${String(nextNum).padStart(2, '0')}`
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
        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            // Facilitators see groups where they are main facilitator OR co-facilitator
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
        } else if (GLOBAL_ROLES.includes(user.role)) {
            // Admin, LeadershipTeam see all groups (optionally filtered by campus)
            const campus = req.scopedCelebrationPoint
            if (campus) {
                groups = await dbAll(`
                    SELECT fg.*, u.name as facilitator_name, u2.name as co_facilitator_name,
                        (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                        ${overdueCheck}
                    FROM formation_groups fg
                    LEFT JOIN users u ON fg.facilitator_user_id = u.id
                    LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
                    WHERE fg.celebration_point = ? AND fg.active = 1
                    ORDER BY fg.group_code
                `, [campus])
            } else {
                groups = await dbAll(`
                    SELECT fg.*, u.name as facilitator_name, u2.name as co_facilitator_name,
                        (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                        ${overdueCheck}
                    FROM formation_groups fg
                    LEFT JOIN users u ON fg.facilitator_user_id = u.id
                    LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
                    WHERE fg.active = 1
                    ORDER BY fg.group_code
                `)
            }
        } else {
            // Campus-scoped roles (Pastor, Coordinator, TechSupport)
            groups = await dbAll(`
                SELECT fg.*, u.name as facilitator_name, u2.name as co_facilitator_name,
                    (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                    ${overdueCheck}
                FROM formation_groups fg
                LEFT JOIN users u ON fg.facilitator_user_id = u.id
                LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
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

// --- GET NEXT CODE (must be before /:id to avoid catch-all) ---
router.get('/next-code', requireAuth, async (req, res) => {
    try {
        const { campus } = req.query
        if (!campus) return res.status(400).json({ success: false, message: 'campus required' })
        const code = await generateGroupCode(campus)
        res.json({ success: true, code })
    } catch (error) {
        console.error('Get next code error:', error)
        res.status(500).json({ success: false, message: 'Failed to generate next code' })
    }
})

// --- GET GROUP DETAIL ---
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const group = await dbGet(`
            SELECT fg.*, u.name as facilitator_name, u.username as facilitator_username,
                   u2.name as co_facilitator_name, u2.username as co_facilitator_username
            FROM formation_groups fg
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
            WHERE fg.id = ?
        `, [req.params.id])

        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' })
        }

        // Access check — facilitators/co-facilitators can access if they are main OR co-facilitator
        if ((user.role === 'Facilitator' || user.role === 'CoFacilitator') && group.facilitator_user_id !== user.id && group.co_facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator' && user.role !== 'CoFacilitator') {
            if (group.celebration_point !== user.celebration_point) {
                return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
            }
        }

        // Get members with attendance calculation
        let members = await dbAll(`
            SELECT fgm.id as membership_id, fgm.student_id, fgm.student_name, fgm.student_email, fgm.joined_at,
                (SELECT COUNT(*) FROM session_attendance sa 
                 JOIN group_sessions gs ON sa.session_id = gs.id 
                 WHERE sa.student_id = fgm.student_id 
                 AND gs.formation_group_id = fgm.formation_group_id 
                 AND sa.attended = 1 AND gs.did_not_meet = 0) as attended,
                (SELECT COUNT(*) FROM group_sessions gs 
                 WHERE gs.formation_group_id = fgm.formation_group_id 
                 AND gs.did_not_meet = 0) as total
            FROM formation_group_members fgm
            WHERE fgm.formation_group_id = ?
            ORDER BY fgm.joined_at
        `, [req.params.id])

        // Enhance members with real Thinkific data and calculate stable percentage
        members = members.map(m => {
            const detail = getStudentById(m.student_id)
            const percentage = m.total > 0 ? Math.round((m.attended / m.total) * 100) : 0
            
            if (detail) {
                return {
                    ...m,
                    percentage, // Use stable DB-calculated percentage
                    progress: detail.progress,
                    risk_category: detail.risk_category,
                    daysInactive: detail.daysInactive,
                    lastActivity: detail.lastActivity,
                    status: detail.status,
                    risk: detail.risk
                }
            }
            return { ...m, percentage }
        })

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

        res.setHeader('Content-Type', 'application/json')
        res.json({ success: true, group, members, reports })
    } catch (error) {
        console.error('Get group detail error:', error)
        res.setHeader('Content-Type', 'application/json')
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

        const { name, celebration_point, facilitator_user_id, co_facilitator_user_id, cohort, group_code } = req.body

        if (!name || !celebration_point) {
            return res.status(400).json({ success: false, message: 'Name and Celebration Point are required' })
        }

        // TechSupport can only create groups at their own campus
        if (!userHasAnyRole(user, ['Admin']) && user.celebration_point && celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'You can only create groups at your assigned campus' })
        }

        // Use provided group_code or auto-generate
        let code
        if (group_code) {
            const normalised = group_code.trim().toUpperCase()
            const match = normalised.match(/^([A-Z]{3})(\d+)$/)
            if (!match) {
                return res.status(400).json({
                    success: false,
                    message: 'Group code must be campus prefix + 2-digit number (e.g. WDT01)'
                })
            }
            const [, codePrefix, num] = match
            code = `${codePrefix}${String(parseInt(num, 10)).padStart(2, '0')}`
        } else {
            try {
                code = await generateGroupCode(celebration_point)
            } catch (err) {
                if (err.message.startsWith('Unknown celebration point')) {
                    return res.status(400).json({ success: false, message: err.message })
                }
                throw err
            }
        }

        // Validate co-facilitator is different from main facilitator
        if (co_facilitator_user_id && facilitator_user_id && co_facilitator_user_id === facilitator_user_id) {
            return res.status(400).json({ success: false, message: 'Co-facilitator must be different from the main facilitator' })
        }

        // Check uniqueness
        const existing = await dbGet('SELECT id FROM formation_groups WHERE group_code = ?', [code])
        if (existing) {
            return res.status(409).json({ success: false, message: `Group code ${code} already exists` })
        }

        const result = await dbRun(
            'INSERT INTO formation_groups (group_code, name, celebration_point, facilitator_user_id, co_facilitator_user_id, cohort) VALUES (?, ?, ?, ?, ?, ?)',
            [code, code, celebration_point, facilitator_user_id || null, co_facilitator_user_id || null, cohort || '2025']
        )

        res.json({ success: true, groupId: result.lastInsertRowid, group_code: code })
    } catch (error) {
        console.error('Create group error:', error)
        res.status(500).json({ success: false, message: 'Failed to create group' })
    }
})

// --- UPDATE GROUP (Admin, TechSupport only) ---
/**
 * PUT /api/formation-groups/:id
 * Allows Admins and TechSupport to update group metadata (facilitator, campus, cohort, etc.)
 */
router.put('/:id', requireAdminOrTechSupport, async (req, res) => {
    try {
        const user = req.session.user
        const { id } = req.params
        const { group_code, celebration_point, facilitator_user_id, co_facilitator_user_id, cohort, active } = req.body

        const group = await dbGet('SELECT * FROM formation_groups WHERE id = ?', [id])
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' })
        }

        // TechSupport can only update groups at their own campus
        if (user.role === 'TechSupport' && user.celebration_point && group.celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'You can only update groups at your assigned campus' })
        }

        // If changing campus, TechSupport must stay within their own
        if (celebration_point && user.role === 'TechSupport' && celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'You cannot move a group to another campus' })
        }

        // Validate group code format if provided
        let finalCode = group.group_code
        if (group_code) {
            const normalised = group_code.trim().toUpperCase()
            const match = normalised.match(/^([A-Z]{3})(\d+)$/)
            if (!match) {
                return res.status(400).json({ success: false, message: 'Invalid group code format (e.g. WDT01)' })
            }
            finalCode = normalised
        }

        // Validate facilitator/co-facilitator different
        if (facilitator_user_id && co_facilitator_user_id && facilitator_user_id === co_facilitator_user_id) {
            return res.status(400).json({ success: false, message: 'Facilitator and Co-facilitator must be different' })
        }

        // Validate facilitator campus matches group campus (unless Admin)
        if (facilitator_user_id && user.role !== 'Admin') {
            const fac = await dbGet('SELECT celebration_point FROM users WHERE id = ?', [facilitator_user_id])
            if (fac && fac.celebration_point !== (celebration_point || group.celebration_point)) {
                return res.status(400).json({ success: false, message: 'Facilitator must belong to the same campus as the group' })
            }
        }

        await dbRun(
            `UPDATE formation_groups 
             SET group_code = ?,
                 name = ?, 
                 celebration_point = COALESCE(?, celebration_point),
                 facilitator_user_id = ?,
                 co_facilitator_user_id = ?,
                 cohort = COALESCE(?, cohort),
                 active = COALESCE(?, active)
             WHERE id = ?`,
            [
                finalCode,
                finalCode, // name always equals group_code
                celebration_point || null,
                facilitator_user_id !== undefined ? facilitator_user_id : group.facilitator_user_id,
                co_facilitator_user_id !== undefined ? co_facilitator_user_id : group.co_facilitator_user_id,
                cohort !== undefined ? cohort : group.cohort,
                active !== undefined ? active : group.active,
                id
            ]
        )

        await invalidatePattern('cache:dashboard:*')
        res.json({ success: true, message: 'Group updated successfully' })
    } catch (error) {
        console.error('Update group error:', error)
        res.status(500).json({ success: false, message: 'Failed to update group' })
    }
})

// --- ADD MEMBER (Admin, Coordinator, TechSupport, Facilitator) ---
router.post('/:id/members', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
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
        // Campus-scoped roles restricted to own campus
        if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator' && user.role !== 'CoFacilitator') {
            if (user.celebration_point && group.celebration_point !== user.celebration_point) {
                return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
            }
        }
        // Facilitators/CoFacilitators restricted to their assigned groups
        if ((user.role === 'Facilitator' || user.role === 'CoFacilitator') && group.facilitator_user_id !== user.id && group.co_facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'You can only modify groups you are assigned to' })
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

        // Invalidate caching
        await invalidatePattern('cache:dashboard:*')
        await invalidatePattern('cache:students:*')

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
        const { id, studentId } = req.params

        // Verify group exists and access
        const group = await dbGet('SELECT * FROM formation_groups WHERE id = ?', [id])
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' })
        }
        // Campus-scoped roles restricted to own campus
        if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator' && user.role !== 'CoFacilitator') {
            if (user.celebration_point && group.celebration_point !== user.celebration_point) {
                return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
            }
        }
        // Facilitators/CoFacilitators restricted to their assigned groups
        if ((user.role === 'Facilitator' || user.role === 'CoFacilitator') && group.facilitator_user_id !== user.id && group.co_facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'You can only modify groups you are assigned to' })
        }

        await dbRun(
            'DELETE FROM formation_group_members WHERE formation_group_id = ? AND student_id = ?',
            [id, studentId]
        )

        // Invalidate caching
        await invalidatePattern('cache:dashboard:*')
        await invalidatePattern('cache:students:*')

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
                "SELECT id, name, role, celebration_point FROM users WHERE (role = 'Facilitator' OR role = 'CoFacilitator') AND active = 1 ORDER BY name"
            )
        } else {
            facilitators = await dbAll(
                "SELECT id, name, role, celebration_point FROM users WHERE (role = 'Facilitator' OR role = 'CoFacilitator') AND active = 1 AND celebration_point = ? ORDER BY name",
                [user.celebration_point]
            )
        }

        res.json({ success: true, facilitators })
    } catch (error) {
        console.error('Get facilitators error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch facilitators' })
    }
})


// --- GET GROUP COMMENTS ---
router.get('/:id/comments', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const group = await dbGet('SELECT * FROM formation_groups WHERE id = ?', [req.params.id])
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

        // Access check: Facilitator/CoFacilitator must be assigned to this group
        if (user.role === 'Facilitator' && group.facilitator_user_id !== user.id && group.co_facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        if (user.role === 'CoFacilitator' && group.co_facilitator_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }

        const comments = await getGroupNotes(req.params.id)
        res.json({ success: true, comments })
    } catch (error) {
        console.error('Get group comments error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch comments' })
    }
})

// --- POST GROUP COMMENT ---
router.post('/:id/comments', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const { content } = req.body
        if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content required' })

        const group = await dbGet('SELECT * FROM formation_groups WHERE id = ?', [req.params.id])
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

        // Who can comment: Facilitator (own group), CoFacilitator (own group), Coordinator (own campus), Pastor (own campus), Admin
        const canComment =
            userHasRole(user, 'Admin') ||
            (user.role === 'Facilitator' && (group.facilitator_user_id === user.id || group.co_facilitator_user_id === user.id)) ||
            (user.role === 'CoFacilitator' && group.co_facilitator_user_id === user.id) ||
            (['Coordinator', 'Pastor'].includes(user.role) && group.celebration_point === user.celebration_point)

        if (!canComment) return res.status(403).json({ success: false, message: 'Access denied' })

        await addGroupNote(req.params.id, user.name, group.celebration_point, content.trim(), user.role, 'group')
        res.json({ success: true })
    } catch (error) {
        console.error('Post group comment error:', error)
        res.status(500).json({ success: false, message: 'Failed to add comment' })
    }
})

export default router
