import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAuth, requireAdminOrTechSupport, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES, userHasAnyRole } from '../middleware/rbac.js'
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
            , (SELECT COUNT(*) = 0 FROM weekly_reports wr WHERE wr.formation_group_id = fg.id AND wr.week_number = ${targetWeek}) as is_overdue
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
        res.status(500).json({ success: false, message: 'Failed to fetch groups' })
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
                (SELECT COUNT(*) FROM session_attendance sa JOIN group_sessions gs ON sa.session_id = gs.id WHERE sa.student_id = fgm.student_id AND gs.formation_group_id = fgm.formation_group_id AND sa.attended = 1 AND gs.did_not_meet = 0) as attended,
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
        res.status(500).json({ success: false, message: 'Failed to fetch group details' })
    }
})

// --- UPDATE GROUP ---
router.put('/:id', requireAdminOrTechSupport, async (req, res) => {
    try {
        const { id } = req.params
        const { facilitator_user_id, co_facilitator_user_id, cohort, active } = req.body
        await dbRun(`
            UPDATE formation_groups 
            SET facilitator_user_id = ?, co_facilitator_user_id = ?, cohort = ?, active = ?
            WHERE id = ?
        `, [facilitator_user_id, co_facilitator_user_id, cohort, active, id])
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update group' })
    }
})

export default router
