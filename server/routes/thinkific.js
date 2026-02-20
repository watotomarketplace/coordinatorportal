import express from 'express'
import { getUnenrolledUsers, enrollUser } from '../services/thinkific.js'

const router = express.Router()

// Middleware to ensure admin access
function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    if (req.session.user.role !== 'Admin' && req.session.user.role !== 'Coordinator') {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

// GET /api/thinkific/unenrolled
// Returns users who have a Company but are not enrolled in the target course
router.get('/unenrolled', requireAdmin, async (req, res) => {
    try {
        const userPoint = req.session.user.role === 'Coordinator' ? req.session.user.celebration_point : null
        const result = await getUnenrolledUsers(userPoint)
        res.json({ success: true, ...result })
    } catch (error) {
        console.error('Get unenrolled users error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch unenrolled users' })
    }
})

// POST /api/thinkific/enroll
// Enrolls a user in the default course
router.post('/enroll', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.body
        if (!userId) return res.status(400).json({ success: false, message: 'User ID required' })

        const result = await enrollUser(userId)
        if (result.success) {
            res.json({ success: true, enrollment: result.enrollment })
        } else {
            res.status(400).json({ success: false, message: result.message })
        }
    } catch (error) {
        console.error('Enrollment error:', error)
        res.status(500).json({ success: false, message: 'Enrollment failed' })
    }
})

export default router
