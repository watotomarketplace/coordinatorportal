import express from 'express'
import bcrypt from 'bcryptjs'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { requireAdminOrLeadership } from '../middleware/rbac.js'
import { sendLoginEmail, isEmailConfigured } from '../services/email.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const imagesDir = join(__dirname, '../../Profile Images')

const router = express.Router()

// Roles that require a celebration_point assignment (PRD v2 Section 2)
const CAMPUS_SCOPED_ROLES = ['Pastor', 'Coordinator', 'TechSupport', 'CoFacilitator', 'Facilitator']
const ALL_VALID_ROLES = ['Admin', 'LeadershipTeam', 'Pastor', 'Coordinator', 'CoFacilitator', 'Facilitator', 'TechSupport']

// Helper: parse roles from comma-separated string or array
function parseRoles(input) {
    if (!input) return []
    if (Array.isArray(input)) return input.filter(r => ALL_VALID_ROLES.includes(r))
    return input.split(',').map(r => r.trim()).filter(r => ALL_VALID_ROLES.includes(r))
}

// Helper: check if a user has any of the specified roles
function userHasAnyRole(user, roleList) {
    const userRoles = parseRoles(user.roles || user.role)
    return userRoles.some(r => roleList.includes(r))
}

function requireUserManager(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    if (!userHasAnyRole(req.session.user, ['Admin', 'TechSupport', 'Pastor', 'Coordinator'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

// Get all users
router.get('/users', requireUserManager, async (req, res) => {
    try {
        const currentUser = req.session.user
        let users = await dbAll('SELECT id, username, name, role, roles, secondary_roles, celebration_point, profile_image, active, created_at FROM users ORDER BY name')

        // Filter based on role restrictions
        const currentRoles = parseRoles(currentUser.roles || currentUser.role)
        const isGlobal = currentRoles.some(r => ['Admin', 'LeadershipTeam'].includes(r))

        if (!isGlobal) {
            const isPastor = currentRoles.includes('Pastor')
            if (isPastor) {
                users = users.filter(u => {
                    const uRoles = parseRoles(u.roles || u.role)
                    return (uRoles.includes('Facilitator') || uRoles.includes('Coordinator')) &&
                        u.celebration_point === currentUser.celebration_point
                })
            } else {
                // TechSupport / Coordinator — can only see Facilitators/CoFacilitators at their campus
                users = users.filter(u => {
                    const uRoles = parseRoles(u.roles || u.role)
                    return (uRoles.includes('Facilitator') || uRoles.includes('CoFacilitator')) &&
                        u.celebration_point === currentUser.celebration_point
                })
            }
        }

        // Parse roles into arrays for the frontend
        users = users.map(u => ({
            ...u,
            roles: u.roles ? u.roles.split(',').map(r => r.trim()) : [u.role],
            secondary_roles: (() => { try { return JSON.parse(u.secondary_roles || '[]') } catch { return [] } })()
        }))

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
        const { password, name, celebration_point } = req.body
        // Normalize username to lowercase
        const username = (req.body.username || '').toLowerCase().trim()
        // Support both single role and roles array/string
        const rolesInput = req.body.roles || req.body.role
        const rolesList = parseRoles(rolesInput)
        const primaryRole = rolesList[0] || req.body.role

        if (!username || !password || !name || rolesList.length === 0) {
            return res.json({ success: false, message: 'All fields required (including at least one role)' })
        }

        // Validate all roles
        for (const r of rolesList) {
            if (!ALL_VALID_ROLES.includes(r)) {
                return res.json({ success: false, message: `Invalid role: ${r}` })
            }
        }

        // Validate creation permissions based on current user's roles
        const curRoles = parseRoles(currentUser.roles || currentUser.role)
        const curIsAdmin = curRoles.includes('Admin')
        const curIsPastor = curRoles.includes('Pastor')
        const curIsCoordOrTech = curRoles.some(r => ['TechSupport', 'Coordinator'].includes(r))

        if (!curIsAdmin) {
            if (curIsCoordOrTech && !curIsPastor && !rolesList.every(r => r === 'Facilitator' || r === 'CoFacilitator')) {
                return res.status(403).json({ success: false, message: 'You can only create Facilitator or Co-Facilitator accounts' })
            }
            if (curIsPastor && !rolesList.every(r => ['Facilitator', 'Coordinator'].includes(r))) {
                return res.status(403).json({ success: false, message: 'Pastors can only create Coordinator or Facilitator accounts' })
            }
        }

        // Non-Admins: force their own campus
        const curIsCampusScoped = curRoles.some(r => ['TechSupport', 'Pastor', 'Coordinator'].includes(r))
        const finalCelebrationPoint = (!curIsAdmin && curIsCampusScoped)
            ? currentUser.celebration_point
            : (celebration_point || null)

        // Campus-scoped roles require a celebration_point
        const needsCampus = rolesList.some(r => CAMPUS_SCOPED_ROLES.includes(r))
        if (needsCampus && !finalCelebrationPoint) {
            return res.json({ success: false, message: 'Campus-scoped roles must have a Celebration Point' })
        }

        // Check if username exists (case-insensitive)
        const existing = await dbGet('SELECT id FROM users WHERE LOWER(username) = ?', [username])
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
        const rolesString = rolesList.join(',')

        // Secondary roles: filter out Admin and the primary role, max 3
        const secondaryRoles = (req.body.secondary_roles || [])
            .filter(r => ALL_VALID_ROLES.includes(r) && r !== 'Admin' && r !== primaryRole)
            .slice(0, 3)

        const result = await dbRun(
            'INSERT INTO users (username, password, name, role, roles, secondary_roles, celebration_point, profile_image, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
            [username, hashedPassword, name, primaryRole, rolesString, JSON.stringify(secondaryRoles), finalCelebrationPoint, selectedImage || null]
        )

        res.json({ success: true, userId: result.lastInsertRowid })
    } catch (error) {
        console.error('Create user error:', error)
        res.json({ success: false, message: 'Failed to create user' })
    }
})

// ─── Bulk Create Users ───────────────────────────────────────
// Helper: pick a random profile image from the Profile Images directory
function pickRandomProfileImage() {
    try {
        const categories = readdirSync(imagesDir).filter(f => statSync(join(imagesDir, f)).isDirectory())
        if (categories.length === 0) return null
        const cat = categories[Math.floor(Math.random() * categories.length)]
        const catPath = join(imagesDir, cat)
        const files = readdirSync(catPath).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
        if (files.length === 0) return null
        const file = files[Math.floor(Math.random() * files.length)]
        return `/profile-images/${encodeURIComponent(cat)}/${encodeURIComponent(file)}`
    } catch { return null }
}

router.post('/users/bulk', requireUserManager, async (req, res) => {
    try {
        const currentUser = req.session.user
        const { users, sendEmails } = req.body

        if (!Array.isArray(users) || users.length === 0) {
            return res.json({ success: false, message: 'No users provided' })
        }
        if (users.length > 200) {
            return res.json({ success: false, message: 'Maximum 200 users per batch' })
        }

        // Permissions of the current user
        const curRoles = parseRoles(currentUser.roles || currentUser.role)
        const curIsAdmin = curRoles.includes('Admin')
        const curIsPastor = curRoles.includes('Pastor')
        const curIsCoordOrTech = curRoles.some(r => ['TechSupport', 'Coordinator'].includes(r))
        const curIsCampusScoped = curRoles.some(r => ['TechSupport', 'Pastor', 'Coordinator'].includes(r))

        const results = []
        let created = 0, skipped = 0, failed = 0, emailed = 0

        for (const u of users) {
            const username = (u.username || '').toLowerCase().trim()
            const name = (u.name || '').trim()
            const password = (u.password || '').trim()
            const email = (u.email || '').trim()
            const rolesList = parseRoles(u.role || u.roles)
            const primaryRole = rolesList[0]

            // Validate required fields
            if (!username || !password || !name || rolesList.length === 0) {
                results.push({ username: username || '(empty)', status: 'failed', error: 'Missing required fields (name, username, password, role)' })
                failed++
                continue
            }

            // Validate roles
            const invalidRole = rolesList.find(r => !ALL_VALID_ROLES.includes(r))
            if (invalidRole) {
                results.push({ username, status: 'failed', error: `Invalid role: ${invalidRole}` })
                failed++
                continue
            }

            // Permission checks
            if (!curIsAdmin) {
                if (curIsCoordOrTech && !curIsPastor && !rolesList.every(r => r === 'Facilitator' || r === 'CoFacilitator')) {
                    results.push({ username, status: 'failed', error: 'You can only create Facilitator or Co-Facilitator accounts' })
                    failed++
                    continue
                }
                if (curIsPastor && !rolesList.every(r => ['Facilitator', 'Coordinator'].includes(r))) {
                    results.push({ username, status: 'failed', error: 'Can only create Coordinator/Facilitator accounts' })
                    failed++
                    continue
                }
            }

            // Campus scoping
            const celebrationPoint = (!curIsAdmin && curIsCampusScoped)
                ? currentUser.celebration_point
                : (u.celebration_point || '').trim() || null
            const needsCampus = rolesList.some(r => CAMPUS_SCOPED_ROLES.includes(r))
            if (needsCampus && !celebrationPoint) {
                results.push({ username, status: 'failed', error: 'Campus-scoped role requires celebration_point' })
                failed++
                continue
            }

            // Check duplicate
            const existing = await dbGet('SELECT id FROM users WHERE LOWER(username) = ?', [username])
            if (existing) {
                results.push({ username, status: 'skipped', error: 'Username already exists' })
                skipped++
                continue
            }

            // Create the user
            try {
                const hashedPassword = bcrypt.hashSync(password, 10)
                const rolesString = rolesList.join(',')
                const profileImage = pickRandomProfileImage()

                await dbRun(
                    'INSERT INTO users (username, password, name, role, roles, celebration_point, profile_image, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                    [username, hashedPassword, name, primaryRole, rolesString, celebrationPoint, profileImage]
                )

                let emailResult = null
                if (sendEmails && email) {
                    emailResult = await sendLoginEmail({
                        email, name, username, password, role: primaryRole, celebrationPoint
                    })
                    if (emailResult.sent) emailed++
                }

                results.push({
                    username, status: 'created', role: primaryRole,
                    emailSent: emailResult ? emailResult.sent : false
                })
                created++
            } catch (err) {
                results.push({ username, status: 'failed', error: err.message })
                failed++
            }
        }

        res.json({
            success: true,
            summary: { total: users.length, created, skipped, failed, emailed },
            emailConfigured: isEmailConfigured(),
            results
        })
    } catch (error) {
        console.error('Bulk create error:', error)
        res.json({ success: false, message: 'Bulk creation failed: ' + error.message })
    }
})

// Update user
router.put('/users/:id', requireUserManager, async (req, res) => {
    try {
        const currentUser = req.session.user
        const { id } = req.params
        const { password, name, celebration_point } = req.body
        const rolesInput = req.body.roles || req.body.role
        const rolesList = parseRoles(rolesInput)
        const primaryRole = rolesList[0] || req.body.role

        if (!name || rolesList.length === 0) {
            return res.json({ success: false, message: 'Name and at least one role required' })
        }

        // Validate all roles
        for (const r of rolesList) {
            if (!ALL_VALID_ROLES.includes(r)) {
                return res.json({ success: false, message: `Invalid role: ${r}` })
            }
        }

        // Restrict edits based on current user's roles
        const curRoles = parseRoles(currentUser.roles || currentUser.role)
        const curIsAdmin = curRoles.includes('Admin')
        const curIsPastor = curRoles.includes('Pastor')
        const curIsCoordOrTech = curRoles.some(r => ['TechSupport', 'Coordinator'].includes(r))

        if (!curIsAdmin) {
            const target = await dbGet('SELECT role, roles, celebration_point FROM users WHERE id = ?', [id])
            const tgtRoles = parseRoles(target?.roles || target?.role)

            if (curIsCoordOrTech && !curIsPastor) {
                if (!target || !tgtRoles.some(r => r === 'Facilitator' || r === 'CoFacilitator') || target.celebration_point !== currentUser.celebration_point) {
                    return res.status(403).json({ success: false, message: 'You can only edit Facilitator/Co-Facilitator accounts at your campus' })
                }
                if (!rolesList.every(r => r === 'Facilitator' || r === 'CoFacilitator')) {
                    return res.status(403).json({ success: false, message: 'Cannot change role away from Facilitator/Co-Facilitator' })
                }
            } else if (curIsPastor) {
                if (!target || !tgtRoles.some(r => ['Facilitator', 'Coordinator'].includes(r)) || target.celebration_point !== currentUser.celebration_point) {
                    return res.status(403).json({ success: false, message: 'You can only edit Facilitator or Coordinator accounts at your campus' })
                }
                if (!rolesList.every(r => ['Facilitator', 'Coordinator'].includes(r))) {
                    return res.status(403).json({ success: false, message: 'Cannot elevate role outside of Facilitator/Coordinator' })
                }
            }
        }

        // Non-Admins: force their own campus scopes
        const curIsCampusScoped = curRoles.some(r => ['TechSupport', 'Pastor', 'Coordinator'].includes(r))
        const finalCelebrationPoint = (!curIsAdmin && curIsCampusScoped)
            ? currentUser.celebration_point
            : (celebration_point || null)
        
        // Campus-scoped roles require a celebration_point
        const needsCampus = rolesList.some(r => CAMPUS_SCOPED_ROLES.includes(r))
        if (needsCampus && !finalCelebrationPoint) {
            return res.json({ success: false, message: 'Campus-scoped roles must have a Celebration Point' })
        }

        const rolesString = rolesList.join(',')

        // Secondary roles: filter out Admin and the primary role, max 3
        const secondaryRoles = (req.body.secondary_roles || [])
            .filter(r => ALL_VALID_ROLES.includes(r) && r !== 'Admin' && r !== primaryRole)
            .slice(0, 3)

        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10)
            await dbRun(
                'UPDATE users SET password = ?, name = ?, role = ?, roles = ?, secondary_roles = ?, celebration_point = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, name, primaryRole, rolesString, JSON.stringify(secondaryRoles), finalCelebrationPoint, req.body.profile_image || null, id]
            )
        } else {
            await dbRun(
                'UPDATE users SET name = ?, role = ?, roles = ?, secondary_roles = ?, celebration_point = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, primaryRole, rolesString, JSON.stringify(secondaryRoles), finalCelebrationPoint, req.body.profile_image || null, id]
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

        // Restrict deactivation based on role
        if (['TechSupport', 'Coordinator'].includes(currentUser.role)) {
            const target = await dbGet('SELECT role, celebration_point FROM users WHERE id = ?', [id])
            if (!target || !['Facilitator', 'CoFacilitator'].includes(target.role) || target.celebration_point !== currentUser.celebration_point) {
                return res.status(403).json({ success: false, message: 'You can only deactivate Facilitator/Co-Facilitator accounts at your campus' })
            }
        } else if (currentUser.role === 'Pastor') {
            const target = await dbGet('SELECT role, celebration_point FROM users WHERE id = ?', [id])
            if (!target || !['Facilitator', 'CoFacilitator', 'Coordinator'].includes(target.role) || target.celebration_point !== currentUser.celebration_point) {
                return res.status(403).json({ success: false, message: 'You can only deactivate Facilitator, Co-Facilitator, or Coordinator accounts at your campus' })
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

        // Non-Admins cannot permanently delete users, only deactivate
        if (currentUser.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Only Admins can permanently delete users. Please use deactivation instead.' })
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
