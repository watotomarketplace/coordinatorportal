import express from 'express'
import { getStudentData, getChartData, getStats, forceRefresh, getPaginatedUsers } from '../services/thinkific.js'
import { getNotes, addNote, getGroupNotes, addGroupNote } from '../services/notes.js'
import { getStudentTags, getAllTags, addTag, removeTag, removeTagByName, TAG_COLORS } from '../services/tags.js'
import { logAudit } from '../services/audit.js'
import { requireAuth, applyCampusScope } from '../middleware/rbac.js'
import { dbAll } from '../db/init.js'

const router = express.Router()

// Map role to note_type for the comments system (PRD v2 Section 5.5)
const ROLE_NOTE_TYPE_MAP = {
    Admin: 'coordinator',        // Admin inherits all capabilities
    LeadershipTeam: 'coordinator',
    Pastor: 'pastoral',
    Coordinator: 'coordinator',
    Facilitator: 'facilitator_observation',
    TechSupport: 'tech_note'
}

// Get student data
router.get('/students', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const celebrationPoint = req.scopedCelebrationPoint

        const result = await getStudentData(celebrationPoint)
        let students = result.students || []

        // Facilitators: filter to only students in their assigned groups
        if (user.role === 'Facilitator') {
            const members = await dbAll(`
                SELECT fgm.student_id, fgm.student_name, fgm.student_email
                FROM formation_group_members fgm
                JOIN formation_groups fg ON fgm.formation_group_id = fg.id
                WHERE fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?
            `, [user.id, user.id])

            const memberIds = new Set(members.map(m => String(m.student_id)))
            const memberEmails = new Set(members.filter(m => m.student_email).map(m => m.student_email.toLowerCase()))

            students = students.filter(s => {
                // Match by student_id or by email
                if (s.id && memberIds.has(String(s.id))) return true
                if (s.email && memberEmails.has(s.email.toLowerCase())) return true
                return false
            })
        }

        const stats = getStats(students)
        const chartData = getChartData(students)

        res.json({
            success: true,
            students,
            stats,
            chartData,
            lastUpdated: result.lastUpdated
        })
    } catch (error) {
        console.error('Get students error:', error)
        res.json({ success: false, message: 'Failed to load student data' })
    }
})

// Get paginated users (Unified Endpoint)
router.get('/users', requireAuth, applyCampusScope, async (req, res) => {
    try {
        // Extract params
        const { page, limit, type, search, date, noCompany, source } = req.query

        const result = await getPaginatedUsers({
            page: page || 1,
            limit: limit || 50,
            type: type || 'enrolled',
            search: search || '',
            celebrationPoint: req.scopedCelebrationPoint || '',
            date: date || '',
            noCompany: noCompany === 'true',
            source: source || 'all',
            risk: req.query.risk || ''
        })

        res.json(result)

    } catch (error) {
        console.error('Get paginated users error:', error)
        res.status(500).json({ success: false, message: 'Failed to load users' })
    }
})

// Refresh data manually
router.post('/refresh', requireAuth, async (req, res) => {
    try {
        forceRefresh()
        res.json({ success: true, message: 'Data refresh started in background' })
    } catch (error) {
        res.json({ success: false, message: 'Refresh failed' })
    }
})

// --- NOTES ENDPOINTS ---

// Get notes for a student
router.get('/notes/:studentId', requireAuth, async (req, res) => {
    try {
        const { studentId } = req.params;
        const notes = await getNotes(studentId);
        res.json({ success: true, notes });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notes' });
    }
});

// Add a note (PRD v2: includes author_role and note_type)
router.post('/notes', requireAuth, async (req, res) => {
    try {
        const { studentId, groupId, content, celebrationPoint } = req.body;
        const user = req.session.user;

        if ((!studentId && !groupId) || !content) {
            return res.status(400).json({ success: false, message: 'Missing required fields (studentId or groupId, and content)' });
        }

        const noteType = ROLE_NOTE_TYPE_MAP[user.role] || 'coordinator'
        const cp = celebrationPoint || user.celebration_point || 'Unknown'

        if (groupId) {
            await addGroupNote(groupId, user.name, cp, content, user.role, noteType)
            logAudit(user.name, user.role, 'ADD_NOTE', `Added ${noteType} note to group ${groupId}`)
        } else {
            await addNote(studentId, user.name, cp, content, user.role, noteType)
            logAudit(user.name, user.role, 'ADD_NOTE', `Added ${noteType} note to student ${studentId}`)
        }

        res.json({ success: true, message: 'Note added' });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ success: false, message: 'Failed to add note' });
    }
});

// Get notes for a formation group
router.get('/notes/group/:groupId', requireAuth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const notes = await getGroupNotes(groupId);
        res.json({ success: true, notes });
    } catch (error) {
        console.error('Get group notes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch group notes' });
    }
});

// ═══════════════════════════════════════════════════════
// STUDENT TAGS (macOS Finder-style Tagging)
// ═══════════════════════════════════════════════════════
router.get('/tags', requireAuth, async (req, res) => {
    try {
        const tags = getAllTags()
        res.json({ success: true, tags, colors: TAG_COLORS })
    } catch (error) {
        console.error('Get all tags error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch tags' })
    }
})

router.get('/tags/:studentId', requireAuth, async (req, res) => {
    try {
        const tags = getStudentTags(req.params.studentId)
        res.json({ success: true, tags })
    } catch (error) {
        console.error('Get student tags error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch student tags' })
    }
})

router.post('/tags', requireAuth, async (req, res) => {
    try {
        const { studentId, tagName, color } = req.body
        if (!studentId || !tagName) {
            return res.status(400).json({ success: false, message: 'studentId and tagName required' })
        }
        addTag(studentId, tagName.trim(), color || '#007aff', req.user?.name)
        res.json({ success: true })
    } catch (error) {
        console.error('Add tag error:', error)
        res.status(500).json({ success: false, message: 'Failed to add tag' })
    }
})

router.delete('/tags/:id', requireAuth, async (req, res) => {
    try {
        removeTag(req.params.id)
        res.json({ success: true })
    } catch (error) {
        console.error('Remove tag error:', error)
        res.status(500).json({ success: false, message: 'Failed to remove tag' })
    }
})

// ═══════════════════════════════════════════════════════
// UNIFIED SEARCH (Spotlight Search)
// Search across students, groups, notes in one call
// ═══════════════════════════════════════════════════════
router.get('/search', requireAuth, async (req, res) => {
    try {
        const { q } = req.query
        if (!q || q.trim().length < 2) {
            return res.json({ success: true, results: { students: [], groups: [], notes: [] } })
        }

        const term = `%${q.trim()}%`
        const { dbAll } = await import('../db/init.js')

        // Search students
        const students = (await dbAll(`
            SELECT id, first_name, last_name, email, celebration_point, percentage_completed,
                   risk_score, days_since_last_sign_in
            FROM students
            WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
            ORDER BY first_name
            LIMIT 8
        `, [term, term, term])).map(s => ({
            ...s,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            type: 'student'
        }))

        // Search formation groups
        const groups = (await dbAll(`
            SELECT fg.id, fg.name, fg.group_code, fg.celebration_point, fg.active,
                   u.name as facilitator_name,
                   (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
            FROM formation_groups fg
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            WHERE fg.name LIKE ? OR fg.group_code LIKE ? OR fg.celebration_point LIKE ?
            ORDER BY fg.name
            LIMIT 6
        `, [term, term, term])).map(g => ({ ...g, type: 'group' }))

        // Search notes
        const notes = (await dbAll(`
            SELECT id, student_id, group_id, author_name, content, created_at
            FROM notes
            WHERE content LIKE ? OR author_name LIKE ?
            ORDER BY created_at DESC
            LIMIT 5
        `, [term, term])).map(n => ({ ...n, type: 'note' }))

        res.json({
            success: true,
            results: { students, groups, notes }
        })
    } catch (error) {
        console.error('Unified search error:', error)
        res.status(500).json({ success: false, message: 'Search failed' })
    }
})

export default router
