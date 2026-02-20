import express from 'express'
import bcrypt from 'bcryptjs'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { requireAdminOrLeadership } from '../middleware/rbac.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const imagesDir = join(__dirname, '../../Profile Images')

const router = express.Router()

// Roles that require a celebration_point assignment (PRD v2 Section 2)
const CAMPUS_SCOPED_ROLES = ['Pastor', 'Coordinator', 'TechSupport', 'Facilitator']
const ALL_VALID_ROLES = ['Admin', 'LeadershipTeam', 'Pastor', 'Coordinator', 'Facilitator', 'TechSupport']

/**
 * Middleware: Admin OR TechSupport (for user management).
 * TechSupport can only manage Facilitator accounts at their campus.
 */
function requireUserManager(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    const role = req.session.user.role
    if (role !== 'Admin' && role !== 'TechSupport') {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

// Get all users
router.get('/users', requireUserManager, async (req, res) => {
    try {
        const currentUser = req.session.user
        let users = await dbAll('SELECT id, username, name, role, celebration_point, profile_image, active, created_at FROM users ORDER BY name')

        // TechSupport: filter to Facilitator accounts at their campus only
        if (currentUser.role === 'TechSupport') {
            users = users.filter(u =>
                u.role === 'Facilitator' &&
                u.celebration_point === currentUser.celebration_point
            )
        }

        res.json({ success: true, users })
    } catch (error) {
        console.error('Get users error:', error)
        res.json({ success: false, message: 'Failed to get users' })
    }
})

// Create user
router.post('/users', requireUserManager, async (req, res) => {
    try {
        const currentUser = req.session.user
        const { username, password, name, role, celebration_point } = req.body

        if (!username || !password || !name || !role) {
            return res.json({ success: false, message: 'All fields required' })
        }

        // Validate role
        if (!ALL_VALID_ROLES.includes(role)) {
            return res.json({ success: false, message: `Invalid role: ${role}` })
        }

        // TechSupport can only create Facilitator accounts
        if (currentUser.role === 'TechSupport' && role !== 'Facilitator') {
            return res.status(403).json({ success: false, message: 'Tech Support can only create Facilitator accounts' })
        }

        // Campus-scoped roles require a celebration_point
        if (CAMPUS_SCOPED_ROLES.includes(role) && !celebration_point) {
            return res.json({ success: false, message: `${role} must have a Celebration Point` })
        }

        // TechSupport: force their own campus
        const finalCelebrationPoint = (currentUser.role === 'TechSupport')
            ? currentUser.celebration_point
            : (celebration_point || null)

        // Check if username exists
        const existing = await dbGet('SELECT id FROM users WHERE username = ?', [username])
        if (existing) {
            return res.json({ success: false, message: 'Username already exists' })
        }

        // Random Profile Image Logic
        let selectedImage = req.body.profile_image
        if (!selectedImage) {
            try {
                const categories = readdirSync(imagesDir).filter(f => statSync(join(imagesDir, f)).isDirectory())
                if (categories.length > 0) {
                    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
                    const catPath = join(imagesDir, randomCategory)
                    const files = readdirSync(catPath).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
                    if (files.length > 0) {
                        const randomFile = files[Math.floor(Math.random() * files.length)]
                        selectedImage = `/profile-images/${encodeURIComponent(randomCategory)}/${encodeURIComponent(randomFile)}`
                    }
                }
            } catch (e) {
                console.error('Failed to pick random image:', e)
            }
        }

        const hashedPassword = bcrypt.hashSync(password, 10)

        const result = await dbRun(
            'INSERT INTO users (username, password, name, role, celebration_point, profile_image, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [username, hashedPassword, name, role, finalCelebrationPoint, selectedImage || null]
        )

        res.json({ success: true, userId: result.lastInsertRowid })
    } catch (error) {
        console.error('Create user error:', error)
        res.json({ success: false, message: 'Failed to create user' })
    }
})

// Update user
router.put('/users/:id', requireUserManager, async (req, res) => {
    try {
        const currentUser = req.session.user
        const { id } = req.params
        const { password, name, role, celebration_point } = req.body

        if (!name || !role) {
            return res.json({ success: false, message: 'Name and role required' })
        }

        // Validate role
        if (!ALL_VALID_ROLES.includes(role)) {
            return res.json({ success: false, message: `Invalid role: ${role}` })
        }

        // TechSupport can only edit Facilitator accounts
        if (currentUser.role === 'TechSupport') {
            const target = await dbGet('SELECT role, celebration_point FROM users WHERE id = ?', [id])
            if (!target || target.role !== 'Facilitator' || target.celebration_point !== currentUser.celebration_point) {
                return res.status(403).json({ success: false, message: 'Tech Support can only edit Facilitator accounts at their campus' })
            }
            if (role !== 'Facilitator') {
                return res.status(403).json({ success: false, message: 'Tech Support cannot change role away from Facilitator' })
            }
        }

        // Campus-scoped roles require a celebration_point
        if (CAMPUS_SCOPED_ROLES.includes(role) && !celebration_point) {
            return res.json({ success: false, message: `${role} must have a Celebration Point` })
        }

        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10)
            await dbRun(
                'UPDATE users SET password = ?, name = ?, role = ?, celebration_point = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, name, role, celebration_point || null, req.body.profile_image || null, id]
            )
        } else {
            await dbRun(
                'UPDATE users SET name = ?, role = ?, celebration_point = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, role, celebration_point || null, req.body.profile_image || null, id]
            )
        }

        res.json({ success: true })
    } catch (error) {
        console.error('Update user error:', error)
        res.json({ success: false, message: 'Failed to update user' })
    }
})

// Deactivate user
router.delete('/users/:id', requireUserManager, async (req, res) => {
    try {
        const currentUser = req.session.user
        const { id } = req.params

        // TechSupport can only deactivate Facilitator accounts at their campus
        if (currentUser.role === 'TechSupport') {
            const target = await dbGet('SELECT role, celebration_point FROM users WHERE id = ?', [id])
            if (!target || target.role !== 'Facilitator' || target.celebration_point !== currentUser.celebration_point) {
                return res.status(403).json({ success: false, message: 'Tech Support can only deactivate Facilitator accounts at their campus' })
            }
        }

        // Protect Admin
        const target = await dbGet('SELECT username FROM users WHERE id = ?', [id])
        if (target && target.username.toLowerCase() === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot deactivate the root Admin user' })
        }

        await dbRun('UPDATE users SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id])
        res.json({ success: true })
    } catch (error) {
        console.error('Deactivate user error:', error)
        res.json({ success: false, message: 'Failed to deactivate user' })
    }
})

// Permanent Delete user
router.delete('/users/:id/permanent', requireUserManager, async (req, res) => {
    try {
        const currentUser = req.session.user
        const { id } = req.params

        // TechSupport cannot permanently delete users, only deactivate
        if (currentUser.role === 'TechSupport') {
            return res.status(403).json({ success: false, message: 'Tech Support cannot permanently delete users' })
        }

        // Protect Admin
        const target = await dbGet('SELECT username FROM users WHERE id = ?', [id])
        if (target && target.username.toLowerCase() === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete the root Admin user' })
        }

        // Check if user has dependent data that requires soft-delete instead

        // 1. Formation Groups (Facilitator)
        const groupCount = (await dbGet('SELECT COUNT(*) as count FROM formation_groups WHERE facilitator_user_id = ?', [id]))?.count || 0
        if (groupCount > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete user: They are assigned as facilitator to formation groups.' })
        }

        // 2. Weekly Reports (Facilitator)
        const reportCount = (await dbGet('SELECT COUNT(*) as count FROM weekly_reports WHERE facilitator_user_id = ?', [id]))?.count || 0
        if (reportCount > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete user: They have submitted weekly reports.' })
        }

        // 3. Discernment Checkpoints (Reviewer)
        const checkpointCount = (await dbGet('SELECT COUNT(*) as count FROM discernment_checkpoints WHERE reviewed_by = ?', [id]))?.count || 0
        if (checkpointCount > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete user: They have reviewed discernment checkpoints.' })
        }

        await dbRun('DELETE FROM users WHERE id = ?', [id])
        res.json({ success: true })
    } catch (error) {
        console.error('Delete user error:', error)
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ success: false, message: 'Cannot delete user: Database constraint violation (associated data).' })
        }
        res.json({ success: false, message: 'Failed to delete user: ' + error.message })
    }
})

// --- AUDIT LOGS ENDPOINT ---

router.get('/audit', requireAdminOrLeadership, async (req, res) => {
    try {
        const logs = await dbAll('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100')
        res.json({ success: true, logs })
    } catch (error) {
        console.error('Get audit logs error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' })
    }
})

export default router
