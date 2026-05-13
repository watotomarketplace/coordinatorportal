import express from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { requireAuth, requireAdminOrTechSupport } from '../middleware/rbac.js'
import { updateUserName, resetUserPassword, getThinkificUser } from '../services/thinkific-writeback.js'
import { dbAll, dbGet, dbRun, IS_POSTGRES } from '../db/init.js'
import { sendPasswordResetEmail } from '../services/email.js'

const router = express.Router()

// --- LOOK UP THINKIFIC USER ---
router.get('/lookup/:thinkificId', requireAuth, requireAdminOrTechSupport, async (req, res) => {
    try {
        const result = await getThinkificUser(req.params.thinkificId)
        res.json(result)
    } catch (error) {
        console.error('Thinkific lookup error:', error)
        res.status(500).json({ success: false, message: 'Lookup failed' })
    }
})

// --- UPDATE NAME ---
router.put('/name/:thinkificId', requireAuth, requireAdminOrTechSupport, async (req, res) => {
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
router.post('/reset-password/:thinkificId', requireAuth, requireAdminOrTechSupport, async (req, res) => {
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

// --- PORTAL USER PASSWORD RESET (token-based) ---
router.put('/portal-users/:id/reset-password', requireAuth, requireAdminOrTechSupport, async (req, res) => {
    try {
        const actor = req.session.user
        const { id } = req.params

        const target = await dbGet('SELECT id, username, name, email, celebration_point FROM users WHERE id = ? AND active = 1', [id])
        if (!target) return res.status(404).json({ success: false, message: 'User not found' })

        // TechSupport can only reset users at their own campus
        if (actor.role === 'TechSupport' && target.celebration_point !== actor.celebration_point) {
            return res.status(403).json({ success: false, message: 'You can only reset passwords for users at your campus' })
        }

        // Generate a random token (32 bytes = 64 hex chars)
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

        // Set password to an unusable random hash
        const unusableHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10)
        await dbRun(
            "UPDATE users SET password = ?, password_reset_required = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [unusableHash, id]
        )

        // Store token in DB
        const insertTokenQ = IS_POSTGRES
            ? "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING"
            : "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
        await dbRun(insertTokenQ, [id, token, expiresAt])

        const portalUrl = process.env.PORTAL_URL || `http://localhost:${process.env.PORT || 3000}`
        const resetLink = `${portalUrl}/reset-password?token=${token}`

        // Send email if user has an email address
        if (target.email) {
            sendPasswordResetEmail({ email: target.email, name: target.name, username: target.username, resetLink })
                .catch(err => console.warn('[TechSupport] Failed to send reset email:', err.message))
        }

        // Audit log
        await dbRun(
            "INSERT INTO audit_logs (user_id, action, details, action_type) VALUES (?, ?, ?, ?)",
            [actor.id, `portal_password_reset`, `Reset password for user ${target.username} (id=${id})`, 'UPDATE']
        ).catch(() => {})

        res.json({
            success: true,
            message: `Password reset link generated for ${target.name}`,
            resetLink,
            expiresAt,
            emailSent: !!target.email
        })
    } catch (error) {
        console.error('Portal password reset error:', error)
        res.status(500).json({ success: false, message: 'Failed to reset password' })
    }
})

// --- RECENT AUDIT LOGS (for this user's tech support actions) ---
router.get('/audit-log', requireAuth, requireAdminOrTechSupport, async (req, res) => {
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
