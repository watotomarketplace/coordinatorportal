import express from 'express'
import { dbGet, dbRun } from '../db/init.js'
import { requireAuth } from '../middleware/rbac.js'

const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await dbGet('SELECT preferences FROM users WHERE id = ?', [req.session.user.id])
        if (user && user.preferences) {
            let pref = {}
            try { pref = JSON.parse(user.preferences) } catch(e) {}
            res.json({ success: true, preferences: pref })
        } else {
            res.json({ success: true, preferences: {} })
        }
    } catch (error) {
        console.error('Get preferences error:', error)
        res.status(500).json({ success: false, message: 'Failed to get preferences' })
    }
})

router.put('/', requireAuth, async (req, res) => {
    try {
        const preferences = req.body
        await dbRun('UPDATE users SET preferences = ? WHERE id = ?', [JSON.stringify(preferences), req.session.user.id])
        res.json({ success: true, message: 'Preferences updated' })
    } catch (error) {
        console.error('Update preferences error:', error)
        res.status(500).json({ success: false, message: 'Failed to update preferences' })
    }
})

export default router
