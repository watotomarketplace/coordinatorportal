import express from 'express'
import { dbAll } from '../db/init.js'
import { requireAuth } from '../middleware/rbac.js'

const router = express.Router()

// GET /api/contacts — all active users grouped by campus, for the contacts directory
router.get('/', requireAuth, async (req, res) => {
  try {
    const { campus, role, q } = req.query
    const where = ['u.active = 1']
    const params = []

    if (campus) { where.push('u.celebration_point = ?'); params.push(campus) }
    if (role)   { where.push('u.role = ?');              params.push(role) }
    if (q) {
      where.push('(LOWER(u.name) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ?)')
      const like = `%${q.toLowerCase()}%`
      params.push(like, like, like)
    }

    const users = await dbAll(`
      SELECT u.id, u.name, u.username, u.role, u.celebration_point,
             u.profile_image, u.email, u.phone
      FROM users u
      WHERE ${where.join(' AND ')}
        AND u.role IN ('Facilitator','CoFacilitator','Coordinator','Pastor','TechSupport','Admin')
      ORDER BY u.celebration_point, u.role, u.name
    `, params)

    res.json({ success: true, contacts: users })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
