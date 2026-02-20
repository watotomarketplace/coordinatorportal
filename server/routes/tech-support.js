import express from 'express'
import { requireAuth } from '../middleware/rbac.js'
import { updateUserName, resetUserPassword, getThinkificUser } from '../services/thinkific-writeback.js'
import { dbAll } from '../db/init.js'

const router = express.Router()

// Only Admin and TechSupport can access write-back functions
function requireTechAccess(req, res, next) {
    if (!['Admin', 'TechSupport'].includes(req.session.user?.role)) {
        return res.status(403).json({ success: false, message: 'Tech Support or Admin access required' })
    }
    next()
}

// --- LOOK UP THINKIFIC USER ---
router.get('/lookup/:thinkificId', requireAuth, requireTechAccess, async (req, res) => {
    try {
        const result = await getThinkificUser(req.params.thinkificId)
        res.json(result)
    } catch (error) {
        console.error('Thinkific lookup error:', error)
        res.status(500).json({ success: false, message: 'Lookup failed' })
    }
})

// --- UPDATE NAME ---
router.put('/name/:thinkificId', requireAuth, requireTechAccess, async (req, res) => {
    try {
        const { first_name, last_name } = req.body
        if (!first_name && !last_name) {
            return res.status(400).json({ success: false, message: 'Provide first_name and/or last_name' })
        }

        const actor = req.session.user
        const result = await updateUserName(
            req.params.thinkificId,
            { first_name, last_name },
            { id: actor.id, name: actor.name, role: actor.role }
        )

        if (result.success) {
            res.json({
                success: true,
                message: 'Name updated successfully',
                previous: result.previous,
                updated: { first_name, last_name }
            })
        } else {
            res.status(400).json({ success: false, message: result.error })
        }
    } catch (error) {
        console.error('Name update error:', error)
        res.status(500).json({
            success: false,
            message: 'Name update failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    }
})

// --- PASSWORD RESET ---
router.post('/reset-password/:thinkificId', requireAuth, requireTechAccess, async (req, res) => {
    try {
        const actor = req.session.user
        const result = await resetUserPassword(
            req.params.thinkificId,
            { id: actor.id, name: actor.name, role: actor.role }
        )

        if (result.success) {
            res.json({
                success: true,
                message: 'Password reset successfully',
                tempPassword: result.tempPassword,
                studentEmail: result.email,
                studentName: result.studentName
            })
        } else {
            res.status(400).json({ success: false, message: result.error })
        }
    } catch (error) {
        console.error('Password reset error:', error)
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    }
})

// --- RECENT AUDIT LOGS (for this user's tech support actions) ---
router.get('/audit-log', requireAuth, requireTechAccess, async (req, res) => {
    try {
        const user = req.session.user
        const isAdmin = user.role === 'Admin'

        // Admin sees all tech support logs, TechSupport sees only their own
        const logs = await dbAll(`
            SELECT al.*, u.name as actor_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.action LIKE 'thinkific_%'
            ${isAdmin ? '' : 'AND al.user_id = ?'}
            ORDER BY al.created_at DESC
            LIMIT 50
        `, isAdmin ? [] : [user.id])

        res.json({ success: true, logs })
    } catch (error) {
        console.error('Audit log error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' })
    }
})

export default router
