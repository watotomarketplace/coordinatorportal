import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAuth, requireAdmin, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES } from '../middleware/rbac.js'
import { generateAllCheckpoints } from '../services/checkpoints.js'

const router = express.Router()

// --- LIST CHECKPOINTS ---
router.get('/', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const { checkpoint_week, celebration_point, status } = req.query
        let params = []
        let conditions = ['1=1']

        if (checkpoint_week) { conditions.push('dc.checkpoint_week = ?'); params.push(checkpoint_week) }
        if (status) { conditions.push('dc.status = ?'); params.push(status) }

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

        const checkpoints = await dbAll(`
            SELECT dc.*, fg.group_code, fg.name as group_name, fg.celebration_point,
                   u.name as facilitator_name, r.name as reviewer_name
            FROM discernment_checkpoints dc
            JOIN formation_groups fg ON dc.formation_group_id = fg.id
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            LEFT JOIN users r ON dc.reviewed_by = r.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY dc.checkpoint_week ASC, fg.group_code ASC
        `, params)

        res.json({ success: true, checkpoints })
    } catch (error) {
        console.error('List checkpoints error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch checkpoints' })
    }
})

// --- GET SINGLE CHECKPOINT ---
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const checkpoint = await dbGet(`
            SELECT dc.*, fg.group_code, fg.name as group_name, fg.celebration_point,
                   u.name as facilitator_name, r.name as reviewer_name
            FROM discernment_checkpoints dc
            JOIN formation_groups fg ON dc.formation_group_id = fg.id
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            LEFT JOIN users r ON dc.reviewed_by = r.id
            WHERE dc.id = ?
        `, [req.params.id])

        if (!checkpoint) {
            return res.status(404).json({ success: false, message: 'Checkpoint not found' })
        }

        // Access check
        if (user.role === 'Facilitator') {
            const group = await dbGet('SELECT facilitator_user_id FROM formation_groups WHERE id = ?', [checkpoint.formation_group_id])
            if (group?.facilitator_user_id !== user.id) {
                return res.status(403).json({ success: false, message: 'Access denied' })
            }
        } else if (CAMPUS_SCOPED_ROLES.includes(user.role) && user.role !== 'Facilitator') {
            if (checkpoint.celebration_point !== user.celebration_point) {
                return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
            }
        }

        // Get group members for participant flagging context
        const members = await dbAll(`
            SELECT fgm.student_id, s.first_name, s.last_name, s.email
            FROM formation_group_members fgm
            LEFT JOIN students s ON fgm.student_id = s.id
            WHERE fgm.formation_group_id = ?
        `, [checkpoint.formation_group_id])

        res.json({ success: true, checkpoint, members })
    } catch (error) {
        console.error('Get checkpoint error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch checkpoint' })
    }
})

// --- GENERATE CHECKPOINTS (Admin only) ---
router.post('/generate', requireAdmin, async (req, res) => {
    try {
        const { checkpoint_week } = req.body

        if (![4, 8, 13].includes(Number(checkpoint_week))) {
            return res.status(400).json({ success: false, message: 'checkpoint_week must be 4, 8, or 13' })
        }

        const results = generateAllCheckpoints(Number(checkpoint_week))

        res.json({
            success: true,
            message: `Generated ${results.generated} checkpoint(s), skipped ${results.skipped}, errors ${results.errors}`,
            ...results
        })
    } catch (error) {
        console.error('Generate checkpoints error:', error)
        res.status(500).json({ success: false, message: 'Failed to generate checkpoints' })
    }
})

// --- REVIEW CHECKPOINT (Admin, Pastor, Coordinator) ---
router.put('/:id/review', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const allowedRoles = ['Admin', 'LeadershipTeam', 'Pastor', 'Coordinator']
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Only Pastors, Coordinators, and Admin can review checkpoints' })
        }

        const checkpoint = await dbGet(`
            SELECT dc.*, fg.celebration_point
            FROM discernment_checkpoints dc
            JOIN formation_groups fg ON dc.formation_group_id = fg.id
            WHERE dc.id = ?
        `, [req.params.id])

        if (!checkpoint) {
            return res.status(404).json({ success: false, message: 'Checkpoint not found' })
        }

        // Campus check for Pastors/Coordinators
        if (['Pastor', 'Coordinator'].includes(user.role) && checkpoint.celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: 'Access restricted to your campus' })
        }

        const { review_notes, participants_flagged, status } = req.body

        // Status must advance: pending → completed → reviewed
        const validTransitions = { pending: ['completed'], completed: ['reviewed'], reviewed: ['reviewed'] }
        const newStatus = status || (checkpoint.status === 'pending' ? 'completed' : 'reviewed')

        if (!validTransitions[checkpoint.status]?.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from '${checkpoint.status}' to '${newStatus}'`
            })
        }

        await dbRun(`
            UPDATE discernment_checkpoints SET
                review_notes = COALESCE(?, review_notes),
                participants_flagged = COALESCE(?, participants_flagged),
                status = ?,
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            review_notes || null,
            participants_flagged ? JSON.stringify(participants_flagged) : null,
            newStatus,
            user.id,
            req.params.id
        ])

        res.json({ success: true, message: `Checkpoint ${newStatus}`, status: newStatus })
    } catch (error) {
        console.error('Review checkpoint error:', error)
        res.status(500).json({ success: false, message: 'Failed to review checkpoint' })
    }
})

export default router
