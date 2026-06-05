import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAuth } from '../middleware/rbac.js'

const router = express.Router()

// Roles that can manage tasks
const TASK_ROLES = ['Admin', 'LeadershipTeam', 'Pastor', 'Coordinator', 'TechSupport']

function canManageTasks(user) {
  return TASK_ROLES.includes(user.role)
}

// GET /api/tasks — list tasks visible to current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.session.user
    if (!canManageTasks(user)) return res.json({ success: true, tasks: [] })

    const { status, priority, assigned_to, limit = 100 } = req.query
    const where = []
    const params = []

    // Non-admins only see tasks they created or are assigned to
    if (user.role !== 'Admin' && user.role !== 'LeadershipTeam') {
      where.push('(t.created_by = ? OR t.assigned_to = ?)')
      params.push(user.id, user.id)
    }
    if (status)      { where.push('t.status = ?');      params.push(status) }
    if (priority)    { where.push('t.priority = ?');    params.push(priority) }
    if (assigned_to) { where.push('t.assigned_to = ?'); params.push(assigned_to) }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const tasks = await dbAll(`
      SELECT t.*,
             u.name  AS assigned_to_name,
             u2.name AS created_by_name
      FROM tasks t
      LEFT JOIN users u  ON u.id  = t.assigned_to
      LEFT JOIN users u2 ON u2.id = t.created_by
      ${whereClause}
      ORDER BY
        CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
      LIMIT ?
    `, [...params, Number(limit)])

    res.json({ success: true, tasks })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/tasks/pending-count — lightweight badge count for dashboard widget
router.get('/pending-count', requireAuth, async (req, res) => {
  try {
    const user = req.session.user
    if (!canManageTasks(user)) return res.json({ success: true, count: 0 })

    let row
    if (user.role === 'Admin' || user.role === 'LeadershipTeam') {
      row = await dbGet("SELECT COUNT(*) AS cnt FROM tasks WHERE status IN ('pending','in_progress')")
    } else {
      row = await dbGet(
        "SELECT COUNT(*) AS cnt FROM tasks WHERE status IN ('pending','in_progress') AND (created_by = ? OR assigned_to = ?)",
        [user.id, user.id]
      )
    }
    res.json({ success: true, count: row?.cnt || 0 })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/tasks — create a task
router.post('/', requireAuth, async (req, res) => {
  try {
    const user = req.session.user
    if (!canManageTasks(user)) return res.status(403).json({ success: false, message: 'Forbidden' })

    const { title, description, assigned_to, related_type, related_id, due_date, priority, tags } = req.body
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' })

    await dbRun(
      `INSERT INTO tasks (title, description, assigned_to, related_type, related_id, due_date, priority, tags, created_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        title.trim(),
        description || null,
        assigned_to || null,
        related_type || null,
        related_id || null,
        due_date || null,
        priority || 'medium',
        JSON.stringify(tags || []),
        user.id,
      ]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PATCH /api/tasks/:id — update status, priority, or fields
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = req.session.user
    if (!canManageTasks(user)) return res.status(403).json({ success: false, message: 'Forbidden' })

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

    // Only creator or admin can edit
    if (user.role !== 'Admin' && Number(task.created_by) !== Number(user.id) && Number(task.assigned_to) !== Number(user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const allowed = ['title', 'description', 'assigned_to', 'related_type', 'related_id', 'due_date', 'priority', 'tags', 'status']
    const sets = []
    const params = []
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = ?`)
        params.push(key === 'tags' ? JSON.stringify(req.body[key]) : req.body[key])
      }
    }
    if (!sets.length) return res.json({ success: true })
    sets.push('updated_at = CURRENT_TIMESTAMP')
    params.push(req.params.id)

    await dbRun(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, params)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/tasks/:id — delete a task (creator or Admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = req.session.user
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

    if (user.role !== 'Admin' && Number(task.created_by) !== Number(user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    await dbRun('DELETE FROM tasks WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
