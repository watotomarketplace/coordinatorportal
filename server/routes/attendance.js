import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { getPaginatedUsers } from '../services/thinkific.js'

const router = express.Router()

// Auth guard
router.use((req, res, next) => {
    if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    next()
})

// Access check helper
async function checkGroupAccess(user, groupId, requireWrite = false) {
    if (user.role === 'Admin') return true
    const group = await dbGet('SELECT facilitator_user_id, celebration_point FROM formation_groups WHERE id = ?', [groupId])
    if (!group) return false
    if (requireWrite) {
        if (user.role === 'Facilitator') return group.facilitator_user_id === user.id
        if (user.role === 'Coordinator') return group.celebration_point === user.celebration_point
        return false
    }
    if (['LeadershipTeam', 'TechSupport'].includes(user.role)) return true
    if (user.role === 'Facilitator') return group.facilitator_user_id === user.id
    if (['Coordinator', 'Pastor'].includes(user.role)) return group.celebration_point === user.celebration_point
    return false
}

// Auto-sync group_members from formation_group_members + Thinkific cache.
// Called every time the member list is fetched so the attendance roster
// always mirrors the actual group roster without any manual add/remove UI.
async function syncMembersFromFormationGroup(groupId) {
    // Get formation group's student roster — now includes student_name/email stored at add-time
    const fgMembers = await dbAll(
        'SELECT student_id, student_name, student_email FROM formation_group_members WHERE formation_group_id = ?',
        [groupId]
    )
    if (!fgMembers.length) return

    // Build Thinkific cache map as fallback for students added before name storage was added
    let thinkificMap = {}
    const fgWithoutName = fgMembers.filter(fm => !fm.student_name)
    if (fgWithoutName.length) {
        try {
            const group = await dbGet('SELECT celebration_point FROM formation_groups WHERE id = ?', [groupId])
            const resp = await getPaginatedUsers({
                search: '', celebrationPoint: group?.celebration_point || '', limit: 2000, type: 'all'
            })
            for (const u of (resp.users || [])) {
                const name = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim()
                thinkificMap[String(u.userId)] = { name, email: u.email || '' }
            }
        } catch (e) {
            console.warn('Thinkific fallback lookup failed:', e.message)
        }
    }

    // Upsert each formation group member into group_members
    for (const fm of fgMembers) {
        const sid = String(fm.student_id)
        // Use stored name first; fall back to Thinkific cache; last resort show ID
        const fallback = thinkificMap[sid] || { name: `Student ${sid}`, email: '' }
        const name = fm.student_name || fallback.name
        const email = fm.student_email || fallback.email

        const existing = await dbGet(
            'SELECT id FROM group_members WHERE formation_group_id = ? AND student_thinkific_id = ?',
            [groupId, sid]
        )
        if (!existing) {
            await dbRun(
                'INSERT INTO group_members (formation_group_id, student_thinkific_id, student_name, student_email, active) VALUES (?, ?, ?, ?, 1)',
                [groupId, sid, name, email]
            )
        } else {
            await dbRun(
                'UPDATE group_members SET student_name = ?, student_email = ?, active = 1 WHERE id = ?',
                [name, email, existing.id]
            )
        }
    }

    // Soft-deactivate members removed from the formation group
    const fgIds = new Set(fgMembers.map(fm => String(fm.student_id)))
    const gmAll = await dbAll(
        'SELECT id, student_thinkific_id FROM group_members WHERE formation_group_id = ? AND active = 1',
        [groupId]
    )
    for (const gm of gmAll) {
        if (gm.student_thinkific_id && !fgIds.has(String(gm.student_thinkific_id))) {
            await dbRun('UPDATE group_members SET active = 0 WHERE id = ?', [gm.id])
        }
    }
}

// 1. List active members (auto-syncs roster from formation group first)
router.get('/group/:groupId/members', async (req, res) => {
    try {
        const { groupId } = req.params
        if (!(await checkGroupAccess(req.session.user, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        await syncMembersFromFormationGroup(groupId)
        const members = await dbAll(
            'SELECT * FROM group_members WHERE formation_group_id = ? AND active = 1 ORDER BY student_name',
            [groupId]
        )
        res.json({ success: true, members })
    } catch (error) {
        console.error('Get members error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch members' })
    }
})

// 2. List all sessions for a group
router.get('/group/:groupId/sessions', async (req, res) => {
    try {
        const { groupId } = req.params
        if (!(await checkGroupAccess(req.session.user, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        const sessions = await dbAll(
            'SELECT * FROM group_sessions WHERE formation_group_id = ? ORDER BY session_date DESC',
            [groupId]
        )
        const memberCount = await dbGet(
            'SELECT COUNT(*) as count FROM group_members WHERE formation_group_id = ? AND active = 1',
            [groupId]
        )
        for (const s of sessions) {
            const count = await dbGet(
                'SELECT COUNT(*) as count FROM session_attendance WHERE session_id = ? AND attended = 1',
                [s.id]
            )
            s.attendance_count = count?.count || 0
            s.member_count = memberCount?.count || 0
        }
        res.json({ success: true, sessions })
    } catch (error) {
        console.error('Get sessions error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch sessions' })
    }
})

// 3. Create a new session
router.post('/group/:groupId/sessions', async (req, res) => {
    try {
        const { groupId } = req.params
        const { session_date, week_number, notes, did_not_meet } = req.body
        if (!(await checkGroupAccess(req.session.user, groupId, true))) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        const result = await dbRun(
            'INSERT INTO group_sessions (formation_group_id, session_date, week_number, facilitator_user_id, notes, did_not_meet) VALUES (?, ?, ?, ?, ?, ?)',
            [groupId, session_date, week_number || null, req.session.user.id, notes || null, did_not_meet ? 1 : 0]
        )
        res.json({ success: true, sessionId: result.lastInsertRowid })
    } catch (error) {
        console.error('Create session error:', error)
        res.status(500).json({ success: false, message: 'Failed to create session' })
    }
})

// 4. Get session + attendance list
router.get('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params
        const session = await dbGet('SELECT * FROM group_sessions WHERE id = ?', [sessionId])
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' })
        if (!(await checkGroupAccess(req.session.user, session.formation_group_id))) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        const attendance = await dbAll(
            `SELECT sa.*, gm.student_name, gm.student_email
             FROM session_attendance sa
             JOIN group_members gm ON sa.group_member_id = gm.id
             WHERE sa.session_id = ?`,
            [sessionId]
        )
        res.json({ success: true, session, attendance })
    } catch (error) {
        console.error('Get session detail error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch session details' })
    }
})

// 5. Submit check-in attendance (upsert) + backfill weekly_reports
router.post('/sessions/:sessionId/checkin', async (req, res) => {
    try {
        const { sessionId } = req.params
        const { attendance } = req.body // [{ group_member_id, attended, note }]
        const session = await dbGet('SELECT * FROM group_sessions WHERE id = ?', [sessionId])
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' })
        if (!(await checkGroupAccess(req.session.user, session.formation_group_id, true))) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        let attendedCount = 0
        for (const record of attendance) {
            await dbRun(
                `INSERT INTO session_attendance (session_id, group_member_id, attended, note)
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT(session_id, group_member_id) DO UPDATE SET
                    attended=excluded.attended, note=excluded.note`,
                [sessionId, record.group_member_id, record.attended ? 1 : 0, record.note || null]
            )
            if (record.attended) attendedCount++
        }
        // Backfill weekly_reports.attendance_count
        if (session.week_number) {
            await dbRun(
                `UPDATE weekly_reports SET attendance_count = ?
                 WHERE formation_group_id = ? AND week_number = ?`,
                [attendedCount, session.formation_group_id, session.week_number]
            )
        }
        res.json({ success: true, attendedCount })
    } catch (error) {
        console.error('Checkin error:', error)
        res.status(500).json({ success: false, message: 'Failed to save check-in' })
    }
})

// 6. Attendance summary per member (with streak + history)
router.get('/group/:groupId/summary', async (req, res) => {
    try {
        const { groupId } = req.params
        if (!(await checkGroupAccess(req.session.user, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' })
        }
        const totalSessionsRow = await dbGet(
            'SELECT COUNT(*) as total FROM group_sessions WHERE formation_group_id = ? AND did_not_meet = 0',
            [groupId]
        )
        const totalSessions = totalSessionsRow?.total || 0
        const members = await dbAll(
            'SELECT id, student_name, student_email FROM group_members WHERE formation_group_id = ? AND active = 1',
            [groupId]
        )
        const summaries = []
        for (const m of members) {
            const att = await dbAll(
                `SELECT sa.attended, gs.session_date
                 FROM session_attendance sa
                 JOIN group_sessions gs ON sa.session_id = gs.id
                 WHERE sa.group_member_id = ? AND gs.did_not_meet = 0
                 ORDER BY gs.session_date ASC`,
                [m.id]
            )
            const attended = att.filter(a => a.attended === 1).length
            const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0
            let streak = 0
            for (let i = att.length - 1; i >= 0; i--) {
                if (att[i].attended === 1) streak++
                else break
            }
            summaries.push({
                memberId: m.id,
                name: m.student_name,
                email: m.student_email,
                sessionsAttended: attended,
                totalSessions,
                percentage,
                currentStreak: streak,
                history: att
            })
        }
        res.json({ success: true, summaries })
    } catch (error) {
        console.error('Summary error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch summary' })
    }
})

export default router
