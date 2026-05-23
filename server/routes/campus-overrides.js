import express from 'express'
import { requireAuth, requireAdmin } from '../middleware/rbac.js'
import { userHasAnyRole } from '../middleware/rbac.js'
import { dbAll, dbRun, IS_POSTGRES } from '../db/init.js'
import { updateStudentCampus } from '../services/thinkific.js'

const router = express.Router()

const VALID_CAMPUSES = [
    'Bbira', 'Bugolobi', 'Bweyogerere', 'Downtown', 'Entebbe', 'Nakwero',
    'Gulu', 'Jinja', 'Juba', 'Kansanga', 'Kyengera', 'Laminadera', 'Lubowa',
    'Mbarara', 'Mukono', 'Nansana', 'Ntinda', 'Online', 'Suubi'
]

// GET /api/campus-overrides — readable by Admin, TechSupport, Pastor, Coordinator
router.get('/', requireAuth, async (req, res) => {
    const user = req.session.user
    if (!userHasAnyRole(user, ['Admin', 'TechSupport', 'Pastor', 'Coordinator'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    try {
        const overrides = await dbAll('SELECT * FROM student_campus_overrides ORDER BY assigned_at DESC')
        res.json({ success: true, overrides })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

// POST /api/campus-overrides — only Admin, TechSupport, Pastor can assign
router.post('/', requireAuth, async (req, res) => {
    const user = req.session.user
    if (!userHasAnyRole(user, ['Admin', 'TechSupport', 'Pastor'])) {
        return res.status(403).json({ success: false, message: 'Only Admin, TechSupport, and Pastor can assign campus' })
    }

    const { thinkific_user_id, campus, note } = req.body
    if (!thinkific_user_id || !campus) {
        return res.status(400).json({ success: false, message: 'thinkific_user_id and campus are required' })
    }
    if (!VALID_CAMPUSES.includes(campus)) {
        return res.status(400).json({ success: false, message: `Invalid campus. Must be one of: ${VALID_CAMPUSES.join(', ')}` })
    }

    // Pastors and TechSupport are campus-scoped — cannot assign to a different campus
    if (!userHasAnyRole(user, ['Admin']) && campus !== user.celebration_point) {
        return res.status(403).json({ success: false, message: `You can only assign students to ${user.celebration_point}` })
    }

    try {
        const upsert = IS_POSTGRES
            ? `INSERT INTO student_campus_overrides (thinkific_user_id, campus, assigned_by_user_id, note, assigned_at)
               VALUES ($1, $2, $3, $4, NOW())
               ON CONFLICT(thinkific_user_id) DO UPDATE SET campus=EXCLUDED.campus, assigned_by_user_id=EXCLUDED.assigned_by_user_id, note=EXCLUDED.note, assigned_at=NOW()`
            : `INSERT OR REPLACE INTO student_campus_overrides (thinkific_user_id, campus, assigned_by_user_id, note, assigned_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
        await dbRun(upsert, [String(thinkific_user_id), campus, user.id, note || null])

        // Write audit log
        try {
            await dbRun(
                'INSERT INTO audit_logs (user_name, role, action, details, target_type) VALUES (?, ?, ?, ?, ?)',
                [user.name || user.username, user.role, 'CAMPUS_ASSIGN', JSON.stringify({ campus, note, thinkific_user_id }), 'student']
            )
        } catch (_) {}

        // Apply immediately to in-memory cache
        await updateStudentCampus(String(thinkific_user_id), campus)

        res.json({ success: true, thinkific_user_id, campus })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

// DELETE /api/campus-overrides/:thinkificUserId — Admin only
router.delete('/:thinkificUserId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const sql = IS_POSTGRES
            ? 'DELETE FROM student_campus_overrides WHERE thinkific_user_id=$1'
            : 'DELETE FROM student_campus_overrides WHERE thinkific_user_id=?'
        await dbRun(sql, [req.params.thinkificUserId])
        res.json({ success: true })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

export default router
