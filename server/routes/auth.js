import express from 'express'
import bcrypt from 'bcryptjs'
import { dbGet, dbAll, dbRun, saveDatabase } from '../db/init.js'

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body
        const username = (req.body.username || '').toLowerCase().trim()

        if (!username || !password) {
            return res.json({ success: false, message: 'Username and password required' })
        }

        const user = await dbGet('SELECT * FROM users WHERE LOWER(username) = ? AND active = 1', [username])

        if (!user) {
            return res.json({ success: false, message: 'Invalid credentials' })
        }

        const validPassword = bcrypt.compareSync(password, user.password)
        if (!validPassword) {
            return res.json({ success: false, message: 'Invalid credentials' })
        }

        // Parse roles from comma-separated string into array
        const rolesArray = user.roles
            ? user.roles.split(',').map(r => r.trim())
            : [user.role]

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            roles: rolesArray,
            secondary_roles: user.secondary_roles,
            celebration_point: user.celebration_point,
            profile_image: user.profile_image
        }

        res.json({
            success: true,
            user: req.session.user
        })
    } catch (error) {
        console.error('Login error:', error)
        res.json({ success: false, message: 'Server error' })
    }
})

// Logout
router.post('/logout', async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({ success: false, message: 'Logout failed' })
        }
        res.clearCookie('connect.sid')
        res.json({ success: true })
    })
})

// Check session
router.get('/session', async (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user })
    } else {
        res.json({ user: null })
    }
})

// Update Profile
router.put('/profile', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' })
        }

        const { id } = req.session.user
        const { name, password, profile_image } = req.body

        if (!name) {
            return res.json({ success: false, message: 'Name is required' })
        }

        // Update DB
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10)
            await dbRun(
                'UPDATE users SET name = ?, password = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, hashedPassword, profile_image || null, id]
            )
        } else {
            await dbRun(
                'UPDATE users SET name = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, profile_image || null, id]
            )
        }

        // Update Session
        req.session.user.name = name
        req.session.user.profile_image = profile_image || null

        // Return updated user
        res.json({ success: true, user: req.session.user })
    } catch (error) {
        console.error('Update profile error:', error)
        res.json({ success: false, message: 'Failed to update profile' })
    }
})

export default router
