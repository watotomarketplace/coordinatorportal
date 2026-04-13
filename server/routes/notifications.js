import express from 'express'
import { dbRun, dbAll, dbGet } from '../db/init.js'

const router = express.Router()

// Middleware to ensure auth
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    next()
}

// GET /api/notifications - Fetch unread/recent
router.get('/', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        // Fetch last 50 notifications for this user (or global ones if we implemented that, but for now specific)
        // We'll match by username since user_id might vary if we recreate users
        const sql = `
            SELECT * FROM notifications 
            WHERE username = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `
        const notifications = await dbAll(sql, [user.username])

        // Count unread
        const unreadCount = notifications.filter(n => n.is_read === 0).length

        res.json({ success: true, notifications, unreadCount })
    } catch (error) {
        console.error('Fetch notifications error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' })
    }
})

// POST /api/notifications/mark-read - Mark as read
router.post('/mark-read', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const { id, all } = req.body

        if (all) {
            await dbRun('UPDATE notifications SET is_read = 1 WHERE username = ?', [user.username])
        } else if (id) {
            await dbRun('UPDATE notifications SET is_read = 1 WHERE id = ? AND username = ?', [id, user.username])
        }

        res.json({ success: true })
    } catch (error) {
        console.error('Mark read error:', error)
        res.status(500).json({ success: false, message: 'Failed to update notifications' })
    }
})

// POST /api/notifications/test - Dev tool
router.post('/test', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const { type, title, message } = req.body

        await dbRun(`
            INSERT INTO notifications (username, type, title, message)
            VALUES (?, ?, ?, ?)
        `, [user.username, type || 'system', title || 'Test Notification', message || 'This is a test alert.'])

        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
