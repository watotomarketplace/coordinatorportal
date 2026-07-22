import express from 'express'
import multer from 'multer'
import { parse as parseCsv } from 'csv-parse/sync'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAuth, requireAdmin, requireAdminOrTechSupport, requireGroupManager, applyCampusScope, CAMPUS_SCOPED_ROLES, GLOBAL_ROLES, userHasAnyRole } from '../middleware/rbac.js'
import { getStudentById, resolveStudentMap } from '../services/thinkific.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

const router = express.Router()

// Ensure all responses have proper Content-Type for JSON APIs
router.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json')
    next()
})

// --- Campus Code Mapping ---
const CAMPUS_CODES = {
    'Bbira': 'WBB', 'Bugolobi': 'WBG', 'Bweyogerere': 'WBW', 'Downtown': 'WDT',
    'Entebbe': 'WEN', 'Nakwero': 'WGN', 'Gulu': 'WGU', 'Jinja': 'WJJ',
    'Juba': 'WJB', 'Kansanga': 'WKA', 'Kyengera': 'WKY', 'Laminadera': 'WLM',
    'Lubowa': 'WLB', 'Mbarara': 'WMB', 'Mukono': 'WMK', 'Nansana': 'WNW',
    'Ntinda': 'WNT', 'Online': 'WON', 'Suubi': 'WSU'
}

// Generate next group code — fills gaps rather than always max+1
async function generateGroupCode(celebrationPoint) {
    const prefix = CAMPUS_CODES[celebrationPoint]
    if (!prefix) throw new Error(`Unknown celebration point: "${celebrationPoint}". Valid values: ${Object.keys(CAMPUS_CODES).join(', ')}`)
    const allCodes = await dbAll('SELECT group_code FROM formation_groups WHERE celebration_point = ?', [celebrationPoint])
    const usedNums = new Set(
        allCodes
            .map(r => { const m = r.group_code?.match(/(\d+)$/); return m ? parseInt(m[1], 10) : null })
            .filter(n => n !== null && !isNaN(n))
    )
    let nextNum = 1
    while (usedNums.has(nextNum)) nextNum++
    return `${prefix}${String(nextNum).padStart(2, '0')}`
}

// --- GET EXISTING CODES FOR A CAMPUS ---
// GET /api/formation-groups/codes?campus=Ntinda
router.get('/codes', requireAuth, async (req, res) => {
    try {
        const { campus } = req.query
        if (!campus) return res.status(400).json({ success: false, message: 'campus query param required' })
        const prefix = CAMPUS_CODES[campus]
        if (!prefix) return res.status(400).json({ success: false, message: `Unknown campus: "${campus}"` })
        const rows = await dbAll('SELECT group_code FROM formation_groups WHERE celebration_point = ? ORDER BY group_code', [campus])
        const codes = rows.map(r => r.group_code)
        const nums = codes.map(c => { const m = c.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 0 }).filter(n => n > 0)
        const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1
        res.json({ success: true, prefix, codes, nextNum })
    } catch (error) {
        console.error('GET /formation-groups/codes error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to fetch codes' })
    }
})

// --- NEXT CODE PREVIEW ---
// GET /api/formation-groups/next-code?campus=Lubowa
router.get('/next-code', requireAuth, async (req, res) => {
    const { campus } = req.query
    if (!campus) return res.status(400).json({ success: false, message: 'campus required' })
    try {
        const code = await generateGroupCode(campus)
        res.json({ success: true, code })
    } catch (err) {
        res.status(400).json({ success: false, message: err.message })
    }
})

// --- BULK CSV IMPORT ---
// POST /api/formation-groups/bulk  (multipart/form-data with field "file")
// CSV columns: group_code, campus_prefix (optional), facilitator_email (optional), co_facilitator_email (optional), cohort (optional)
router.post('/bulk', requireGroupManager, upload.single('file'), async (req, res) => {
    try {
        const user = req.session.user
        if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required (field: file)' })

        let rows
        try {
            rows = parseCsv(req.file.buffer.toString('utf-8'), {
                columns: true,
                skip_empty_lines: true,
                trim: true
            })
        } catch (parseErr) {
            return res.status(400).json({ success: false, message: `CSV parse error: ${parseErr.message}` })
        }

        if (!rows.length) return res.status(400).json({ success: false, message: 'CSV file is empty' })

        const results = []
        let created = 0, skipped = 0, errors = 0

        for (const row of rows) {
            const group_code = (row.group_code || '').trim().toUpperCase()
            if (!group_code) { results.push({ row, status: 'error', message: 'Missing group_code' }); errors++; continue }

            // Validate format: [A-Z]{3}\d+
            if (!/^[A-Z]{3}\d+$/.test(group_code)) {
                results.push({ group_code, status: 'error', message: 'Invalid code format (expected WXX##)' }); errors++; continue
            }

            // Derive celebration_point from code prefix
            const prefix = group_code.slice(0, 3)
            const campus = Object.entries(CAMPUS_CODES).find(([, v]) => v === prefix)?.[0]
            if (!campus) { results.push({ group_code, status: 'error', message: `Unknown prefix: ${prefix}` }); errors++; continue }

            // Campus-scoped users can only import for their own campus
            if (!userHasAnyRole(user, ['Admin']) && campus !== user.celebration_point) {
                results.push({ group_code, status: 'error', message: `Not your campus (${campus})` }); errors++; continue
            }

            // Check duplicate
            const existing = await dbGet('SELECT id FROM formation_groups WHERE group_code = ?', [group_code])
            if (existing) { results.push({ group_code, status: 'skipped', message: 'Already exists' }); skipped++; continue }

            // Resolve facilitator by email
            let facilitator_user_id = null
            let co_facilitator_user_id = null
            if (row.facilitator_email) {
                const fac = await dbGet('SELECT id FROM users WHERE email = ? OR username = ?', [row.facilitator_email.trim(), row.facilitator_email.trim()])
                if (fac) facilitator_user_id = fac.id
            }
            if (row.co_facilitator_email) {
                const cofac = await dbGet('SELECT id FROM users WHERE email = ? OR username = ?', [row.co_facilitator_email.trim(), row.co_facilitator_email.trim()])
                if (cofac) co_facilitator_user_id = cofac.id
            }

            try {
                await dbRun(
                    'INSERT INTO formation_groups (group_code, name, celebration_point, facilitator_user_id, co_facilitator_user_id, cohort, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
                    [group_code, group_code, campus, facilitator_user_id, co_facilitator_user_id, row.cohort || null]
                )
                results.push({ group_code, status: 'created', campus })
                created++
            } catch (insertErr) {
                results.push({ group_code, status: 'error', message: insertErr.message })
                errors++
            }
        }

        res.json({
            success: true,
            summary: { total: rows.length, created, skipped, errors },
            results
        })
    } catch (error) {
        console.error('POST /formation-groups/bulk error:', error.message)
        res.status(500).json({ success: false, message: 'Bulk import failed', detail: error.message })
    }
})

// --- LIST GROUPS ---
router.get('/', requireAuth, applyCampusScope, async (req, res) => {
    try {
        const user = req.session.user
        const currentWeekSetting = await dbGet("SELECT value FROM system_settings WHERE key = 'current_week'")
        const currentWeek = currentWeekSetting ? parseInt(currentWeekSetting.value, 10) : 0
        const targetWeek = currentWeek > 1 ? currentWeek - 1 : 0

        const overdueCheck = targetWeek > 0 ? `
            , (SELECT CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END FROM weekly_reports wr WHERE wr.formation_group_id = fg.id AND wr.week_number = ${targetWeek}) as is_overdue
        ` : ', 0 as is_overdue'

        let groups = []
        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            groups = await dbAll(`
                SELECT fg.*, u.name as facilitator_name, u2.name as co_facilitator_name,
                    (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                    ${overdueCheck}
                FROM formation_groups fg
                LEFT JOIN users u ON fg.facilitator_user_id = u.id
                LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
                WHERE (fg.facilitator_user_id = ? OR fg.co_facilitator_user_id = ?) AND fg.active = 1
                ORDER BY fg.group_code
            `, [user.id, user.id])
        } else {
            const campus = req.scopedCelebrationPoint
            const query = `
                SELECT fg.*, u.name as facilitator_name, u2.name as co_facilitator_name,
                    (SELECT COUNT(*) FROM formation_group_members WHERE formation_group_id = fg.id) as member_count
                    ${overdueCheck}
                FROM formation_groups fg
                LEFT JOIN users u ON fg.facilitator_user_id = u.id
                LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
                WHERE ${campus ? 'fg.celebration_point = ? AND ' : ''} fg.active = 1
                ORDER BY fg.group_code
            `
            groups = await dbAll(query, campus ? [campus] : [])
        }

        res.json({ success: true, groups })
    } catch (error) {
        console.error('GET /formation-groups error:', error.message, error.stack)
        res.status(500).json({ success: false, message: 'Failed to fetch groups', detail: error.message })
    }
})

// --- GET GROUP DETAIL ---
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const group = await dbGet(`
            SELECT fg.*, u.name as facilitator_name, u2.name as co_facilitator_name
            FROM formation_groups fg
            LEFT JOIN users u ON fg.facilitator_user_id = u.id
            LEFT JOIN users u2 ON fg.co_facilitator_user_id = u2.id
            WHERE fg.id = ?
        `, [req.params.id])

        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

        // Access check — use Number() to guard against SQLite integer vs session string mismatch
        if ((user.role === 'Facilitator' || user.role === 'CoFacilitator') &&
            Number(group.facilitator_user_id) !== Number(user.id) &&
            Number(group.co_facilitator_user_id) !== Number(user.id)) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }

        let members = await dbAll(`
            SELECT fgm.student_id, fgm.student_name, fgm.student_email,
                (SELECT COUNT(*)
                    FROM session_attendance sa
                    JOIN group_sessions gs ON sa.session_id = gs.id
                    JOIN group_members gm ON sa.group_member_id = gm.id
                    WHERE gm.student_thinkific_id = fgm.student_id
                      AND gs.formation_group_id = fgm.formation_group_id
                      AND sa.attended = 1
                      AND gs.did_not_meet = 0
                ) as attended,
                (SELECT COUNT(*) FROM group_sessions gs WHERE gs.formation_group_id = fgm.formation_group_id AND gs.did_not_meet = 0) as total
            FROM formation_group_members fgm
            WHERE fgm.formation_group_id = ?
        `, [req.params.id])

        // Batched shared resolver (cache → user_id → student_id → enrollment-id
        // alias), keyed by the original roster id — one batch, not one query per
        // member. Returns progress + risk, so a cache miss no longer renders "—".
        const resolvedMembers = await resolveStudentMap(
            members.map(m => m.student_id), `group ${req.params.id}`
        )
        members = members.map(m => {
            const detail = resolvedMembers.get(String(m.student_id ?? '').trim()) || null
            const percentage = m.total > 0 ? Math.round((m.attended / m.total) * 100) : 0
            return { ...m, ...detail, percentage }
        })

        const reports = await dbAll(`
            SELECT id, week_number, attendance_count, engagement_level, submitted_at
            FROM weekly_reports WHERE formation_group_id = ? ORDER BY week_number DESC
        `, [req.params.id])

        res.json({ success: true, group, members, reports })
    } catch (error) {
        console.error('GET /formation-groups/:id error:', error.message, error.stack)
        res.status(500).json({ success: false, message: 'Failed to fetch group details', detail: error.message })
    }
})

// --- CREATE GROUP ---
router.post('/', requireGroupManager, async (req, res) => {
    try {
        const user = req.session.user
        const { celebration_point, cohort, facilitator_user_id, co_facilitator_user_id, group_number } = req.body
        if (!celebration_point) return res.status(400).json({ success: false, message: 'celebration_point required' })

        // Campus-scoped roles can only create groups for their own campus
        const isCampusScoped = !userHasAnyRole(user, ['Admin'])
        if (isCampusScoped && celebration_point !== user.celebration_point) {
            return res.status(403).json({ success: false, message: `You can only create groups for your campus (${user.celebration_point})` })
        }

        let group_code
        if (group_number != null && group_number !== '') {
            const prefix = CAMPUS_CODES[celebration_point]
            if (!prefix) return res.status(400).json({ success: false, message: `Unknown campus: "${celebration_point}"` })
            const num = parseInt(group_number, 10)
            if (isNaN(num) || num < 1) return res.status(400).json({ success: false, message: 'group_number must be a positive integer' })
            group_code = `${prefix}${String(num).padStart(2, '0')}`
            const duplicate = await dbGet('SELECT id FROM formation_groups WHERE group_code = ?', [group_code])
            if (duplicate) return res.status(400).json({ success: false, message: `Group code ${group_code} already exists` })
        } else {
            group_code = await generateGroupCode(celebration_point)
        }

        const result = await dbRun(
            'INSERT INTO formation_groups (group_code, name, celebration_point, facilitator_user_id, co_facilitator_user_id, cohort, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [group_code, group_code, celebration_point, facilitator_user_id || null, co_facilitator_user_id || null, cohort || null]
        )
        res.json({ success: true, group_code, id: result.lastID ?? result })
    } catch (error) {
        console.error('POST /formation-groups error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to create group', detail: error.message })
    }
})

// --- UPDATE GROUP ---
router.put('/:id', requireGroupManager, async (req, res) => {
    try {
        const user = req.session.user
        const { id } = req.params
        const { group_code, celebration_point, facilitator_user_id, co_facilitator_user_id, cohort, active } = req.body

        // Campus-scoped roles can only edit groups in their own campus
        const isCampusScoped = !userHasAnyRole(user, ['Admin'])
        if (isCampusScoped) {
            const existing = await dbGet('SELECT celebration_point FROM formation_groups WHERE id = ?', [id])
            if (!existing) return res.status(404).json({ success: false, message: 'Group not found' })
            if (existing.celebration_point !== user.celebration_point) {
                return res.status(403).json({ success: false, message: `You can only edit groups for your campus (${user.celebration_point})` })
            }
        }

        await dbRun(`
            UPDATE formation_groups
            SET group_code = ?, name = ?, celebration_point = ?,
                facilitator_user_id = ?, co_facilitator_user_id = ?, cohort = ?, active = ?
            WHERE id = ?
        `, [group_code, group_code, celebration_point, facilitator_user_id || null, co_facilitator_user_id || null, cohort, active ?? 1, id])
        res.json({ success: true })
    } catch (error) {
        console.error('PUT /formation-groups/:id error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to update group' })
    }
})

// --- ADD MEMBER ---
// POST /api/formation-groups/:id/members
router.post('/:id/members', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        const groupId = req.params.id

        // Facilitators may only add to their own groups
        if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
            const group = await dbGet('SELECT facilitator_user_id, co_facilitator_user_id FROM formation_groups WHERE id = ?', [groupId])
            if (!group || (Number(group.facilitator_user_id) !== Number(user.id) && Number(group.co_facilitator_user_id) !== Number(user.id))) {
                return res.status(403).json({ success: false, message: 'Access denied' })
            }
        }

        const { student_id, student_name, student_email } = req.body
        if (!student_id) return res.status(400).json({ success: false, message: 'student_id required' })

        // Store the CANONICAL Thinkific user id. Historically this stored whatever
        // the client sent, which was usually an ENROLLMENT id — the reason ~97% of
        // members could never be matched to thinkific_students. Resolve through the
        // shared resolver (which understands enrollment-id aliases) and persist the
        // canonical user id for NEW members. Existing rows are never rewritten; the
        // alias table keeps them resolvable.
        const resolvedNew = await resolveStudentMap([student_id], `add-member group ${groupId}`)
        const canonical = resolvedNew.get(String(student_id).trim())?.userId
        const storedId = canonical ? String(canonical) : String(student_id)
        if (canonical && storedId !== String(student_id)) {
            console.log(`[formation-groups] add-member: translated ${student_id} → canonical user id ${storedId}`)
        }

        // Prevent duplicate membership (check both the raw and canonical id)
        const existing = await dbGet(
            'SELECT id FROM formation_group_members WHERE formation_group_id = ? AND (student_id = ? OR student_id = ?)',
            [groupId, storedId, String(student_id)]
        )
        if (existing) return res.status(400).json({ success: false, message: 'Student is already in this group' })

        await dbRun(
            'INSERT INTO formation_group_members (formation_group_id, student_id, student_name, student_email) VALUES (?, ?, ?, ?)',
            [groupId, storedId, student_name || '', student_email || '']
        )
        res.json({ success: true })
    } catch (error) {
        console.error('POST /formation-groups/:id/members error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to add member' })
    }
})

// --- REMOVE MEMBER ---
// DELETE /api/formation-groups/:id/members/:studentId
router.delete('/:id/members/:studentId', requireAuth, async (req, res) => {
    try {
        const user = req.session.user
        // Only Admin, Coordinator, TechSupport may remove members
        const canRemove = ['Admin', 'Coordinator', 'TechSupport'].some(r => user.role === r ||
            (user.secondary_roles && JSON.parse(user.secondary_roles || '[]').includes(r)))
        if (!canRemove) return res.status(403).json({ success: false, message: 'Access denied' })

        await dbRun(
            'DELETE FROM formation_group_members WHERE formation_group_id = ? AND student_id = ?',
            [req.params.id, String(req.params.studentId)]
        )
        res.json({ success: true })
    } catch (error) {
        console.error('DELETE /formation-groups/:id/members/:studentId error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to remove member' })
    }
})

// --- GET COMMENTS ---
router.get('/:id/comments', requireAuth, async (req, res) => {
    try {
        const comments = await dbAll(`
            SELECT gc.id, gc.content, gc.created_at, u.name as author_name, u.profile_image
            FROM group_comments gc
            JOIN users u ON gc.user_id = u.id
            WHERE gc.formation_group_id = ?
            ORDER BY gc.created_at DESC
        `, [req.params.id])
        res.json({ success: true, comments })
    } catch (error) {
        console.error('GET /formation-groups/:id/comments error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to fetch comments' })
    }
})

// --- FIX GROUP CODE (Admin only) ---
// PUT /api/formation-groups/:id/fix-code
router.put('/:id/fix-code', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const { new_code, reactivate } = req.body
        if (!new_code) return res.status(400).json({ success: false, message: 'new_code required' })

        const raw = new_code.trim().toUpperCase()
        const match = raw.match(/^([A-Z]{3})(\d+)$/)
        if (!match) return res.status(400).json({ success: false, message: 'Code must be 3-letter campus prefix + number (e.g. WLB06)' })

        const normalised = `${match[1]}${String(parseInt(match[2], 10)).padStart(2, '0')}`

        const conflict = await dbGet('SELECT id FROM formation_groups WHERE group_code = ? AND id != ?', [normalised, id])
        if (conflict) return res.status(400).json({ success: false, message: `${normalised} is already taken by another group` })

        const group = await dbGet('SELECT group_code, active FROM formation_groups WHERE id = ?', [id])
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

        await dbRun(
            'UPDATE formation_groups SET group_code = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [normalised, normalised, id]
        )

        if (reactivate && !group.active) {
            await dbRun('UPDATE formation_groups SET active = 1 WHERE id = ?', [id])
        }

        try {
            await dbRun(
                `INSERT INTO audit_logs (user_id, action, target_type, target_id, details, created_at) VALUES (?, 'GROUP_CODE_FIX', 'formation_group', ?, ?, CURRENT_TIMESTAMP)`,
                [req.session.user.id, id, JSON.stringify({ old_code: group.group_code, new_code: normalised })]
            )
        } catch (_) {}

        res.json({ success: true, new_code: normalised, message: `Group code updated to ${normalised}` })
    } catch (error) {
        console.error('PUT /formation-groups/:id/fix-code error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to fix group code' })
    }
})

// --- ADD COMMENT ---
router.post('/:id/comments', requireAuth, async (req, res) => {
    try {
        const { content } = req.body
        if (!content || !content.trim()) return res.status(400).json({ success: false, message: 'Content required' })
        const user = req.session.user
        await dbRun(
            'INSERT INTO group_comments (formation_group_id, user_id, content) VALUES (?, ?, ?)',
            [req.params.id, user.id, content.trim()]
        )
        res.json({ success: true })
    } catch (error) {
        console.error('POST /formation-groups/:id/comments error:', error.message)
        res.status(500).json({ success: false, message: 'Failed to add comment' })
    }
})

export default router
