import express from 'express'
import { requireAuth } from '../middleware/rbac.js'
import { dbAll } from '../db/init.js'
import { searchStudents } from '../services/thinkific.js'

const router = express.Router()

function score(name, query) {
  const n = (name || '').toLowerCase()
  const q = query.toLowerCase()
  if (n === q) return 3
  if (n.startsWith(q)) return 2
  if (n.includes(q)) return 1
  return 0
}

router.get('/', requireAuth, async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q || q.length < 2) return res.json({ results: [] })

  const lower = q.toLowerCase()
  const results = []

  try {
    const studentMatches = searchStudents(q)
      .map(s => {
        const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim()
        return {
          id: s.id || s.user_id,
          type: 'student',
          name,
          subtitle: s.email || s.campus || '',
          _score: score(name, q),
        }
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 8)
    results.push(...studentMatches)
  } catch {}

  try {
    const groups = await dbAll(
      "SELECT id, group_code, name FROM formation_groups WHERE active=1 AND (LOWER(group_code) LIKE ? OR LOWER(name) LIKE ?) LIMIT 10",
      [`%${lower}%`, `%${lower}%`]
    )
    const groupMatches = groups
      .map(g => ({
        id: g.id,
        type: 'group',
        name: g.group_code,
        subtitle: g.name || g.group_code,
        _score: Math.max(score(g.group_code, q), score(g.name, q)),
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 5)
    results.push(...groupMatches)
  } catch {}

  res.json({ results: results.slice(0, 12).map(({ _score, ...r }) => r) })
})

export default router
