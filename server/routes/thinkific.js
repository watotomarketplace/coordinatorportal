import express from 'express'
import { getUnenrolledUsers, enrollUser, getCacheStatus, testConnection, forceRefresh, rawTestConnection, searchStudents } from '../services/thinkific.js'
import { requireAuth, applyCampusScope } from '../middleware/rbac.js'

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

// GET /api/thinkific/search
router.get('/search', requireAuth, applyCampusScope, (req, res) => {
    try {
        const { q } = req.query
        const celebrationPoint = req.scopedCelebrationPoint
        const results = searchStudents(q, celebrationPoint)
        res.json({ success: true, users: results })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

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


// ─── ADMIN TOOLS ──────────────────────────────────────────────────────────

// GET /api/thinkific/status
router.get('/status', requireAdmin, (req, res) => {
    try {
        const port = process.env.PORT || 3000
        const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhooks/thinkific`
        res.json({ success: true, ...getCacheStatus(), webhookUrl })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

// POST /api/thinkific/test
router.post('/test', requireAdmin, async (req, res) => {
    try {
        const { apiKey, subdomain } = req.body
        const result = await testConnection(apiKey, subdomain)
        res.json(result)
    } catch (e) {
        res.json({ success: false, message: e.message })
    }
})

// POST /api/thinkific/refresh (Alias for backward compatibility)
router.post('/refresh', requireAdmin, (req, res) => {
    try {
        forceRefresh()
        res.json({ success: true, message: "Cache refresh triggered in background" })
    } catch (e) {
        res.json({ success: false, message: e.message })
    }
})

// POST /api/thinkific/force-refresh
router.post('/force-refresh', requireAdmin, (req, res) => {
    try {
        forceRefresh()
        res.json({ success: true, message: "Cache refresh forced in background" })
    } catch (e) {
        res.json({ success: false, message: e.message })
    }
})

// GET /api/thinkific/raw-test
router.get('/raw-test', requireAdmin, async (req, res) => {
    try {
        const payload = await rawTestConnection()
        res.json(payload)
    } catch (e) {
        res.json({ success: false, ...e })
    }
})

export default router
