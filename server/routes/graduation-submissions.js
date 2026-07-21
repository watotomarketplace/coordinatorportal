/**
 * Gate 1 — Thinkific Assignment Submission Review.
 *
 * Coordinators/Admins review uploaded portfolio files mirrored from Thinkific and
 * pass/fail them. A PASS fires an irreversible APPROVE back to Thinkific (completes
 * the course → certificate). The portal never issues certificates itself.
 */
import express from 'express'
import axios from 'axios'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import {
    requireAuth, applyCampusScope, requireGraduationApprover,
    requireSubmissionReviewer, userHasAnyRole
} from '../middleware/rbac.js'
import { syncSubmissions, probeSubmissions } from '../services/thinkific-submissions.js'
import { approveSubmission, rejectSubmission } from '../services/thinkific-writeback.js'
import { getAccessToken } from '../services/thinkific-auth.js'

const router = express.Router()

function canSeeSubmission(user, sub) {
    if (userHasAnyRole(user, ['Admin', 'LeadershipTeam'])) return true
    return sub.celebration_point && sub.celebration_point === user.celebration_point
}

// ─── POST /sync — Admin/Coordinator pull latest submissions from Thinkific ──
router.post('/sync', requireAuth, requireSubmissionReviewer, async (req, res) => {
    const result = await syncSubmissions()
    res.status(result.success ? 200 : 502).json(result)
})

// ─── POST /spike — Admin-only in-app discovery (Render-friendly, read-only) ──
// Replaces the CLI spike when running on Render. Never returns the token.
router.post('/spike', requireAuth, async (req, res) => {
    if (!userHasAnyRole(req.session.user, ['Admin'])) {
        return res.status(403).json({ success: false, message: 'Admin only' })
    }
    const result = await probeSubmissions()
    res.json({ success: !result.error, ...result })
})

// ─── GET /?campus=&status= — scoped review queue ───────────────────────────
router.get('/', requireAuth, requireGraduationApprover, applyCampusScope, async (req, res) => {
    try {
        const conditions = []
        const params = []
        if (req.scopedCelebrationPoint) { conditions.push('celebration_point = ?'); params.push(req.scopedCelebrationPoint) }
        if (req.query.status) { conditions.push('portal_review_status = ?'); params.push(req.query.status) }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
        const rows = await dbAll(
            `SELECT id, thinkific_submission_id, thinkific_user_id, student_name, student_email,
                    lesson_name, course_name, file_name, file_size, submitted_at,
                    thinkific_status, portal_review_status, review_note, reviewed_at, celebration_point
             FROM thinkific_submissions ${where}
             ORDER BY (portal_review_status = 'unreviewed') DESC, submitted_at DESC`,
            params
        )
        res.json({ success: true, submissions: rows })
    } catch (e) {
        console.error('[submissions] list error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

// ─── GET /:id/file — server streams the file (never exposes the raw URL) ────
router.get('/:id/file', requireAuth, requireGraduationApprover, async (req, res) => {
    try {
        const sub = await dbGet('SELECT * FROM thinkific_submissions WHERE id = ?', [req.params.id])
        if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' })
        if (!canSeeSubmission(req.session.user, sub)) return res.status(403).json({ success: false, message: 'Access denied' })
        if (!sub.file_url) return res.status(404).json({ success: false, message: 'No file on this submission' })

        // Fetch server-side. CDN URLs are usually public; retry with Bearer if gated.
        const token = await getAccessToken()
        async function fetchStream(useAuth) {
            return axios.get(sub.file_url, {
                responseType: 'stream', timeout: 120000, validateStatus: () => true,
                headers: useAuth && token ? { 'Authorization': `Bearer ${token}` } : {},
            })
        }
        let upstream = await fetchStream(false)
        if (upstream.status === 401 || upstream.status === 403) upstream = await fetchStream(true)
        if (upstream.status >= 400) return res.status(502).json({ success: false, message: `Upstream ${upstream.status}` })

        if (upstream.headers['content-type']) res.setHeader('Content-Type', upstream.headers['content-type'])
        if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length'])
        const safeName = (sub.file_name || 'submission').replace(/[^\w.\-]+/g, '_')
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`)
        upstream.data.pipe(res)
    } catch (e) {
        console.error('[submissions] file stream error:', e.message)
        if (!res.headersSent) res.status(500).json({ success: false, message: e.message })
    }
})

// ─── POST /:id/review — pass→approve / fail→reject (Coordinator/Admin) ──────
router.post('/:id/review', requireAuth, requireSubmissionReviewer, async (req, res) => {
    try {
        const { decision, note } = req.body || {}
        if (!['pass', 'fail'].includes(decision)) {
            return res.status(400).json({ success: false, message: "decision must be 'pass' or 'fail'" })
        }
        const sub = await dbGet('SELECT * FROM thinkific_submissions WHERE id = ?', [req.params.id])
        if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' })
        if (!canSeeSubmission(req.session.user, sub)) return res.status(403).json({ success: false, message: 'Access denied' })

        // Double-fire guard: never re-approve an already-passed/approved submission.
        if (sub.portal_review_status === 'passed' || sub.thinkific_status === 'APPROVED') {
            return res.status(409).json({ success: false, message: 'Already approved on Thinkific — cannot be repeated' })
        }

        const actor = req.session.user
        const result = decision === 'pass'
            ? await approveSubmission(sub.thinkific_submission_id, actor)
            : await rejectSubmission(sub.thinkific_submission_id, actor, note)

        if (!result.success) {
            return res.status(502).json({ success: false, message: `Thinkific write-back failed: ${result.error}` })
        }

        await dbRun(
            `UPDATE thinkific_submissions SET
                portal_review_status = ?, thinkific_status = ?, reviewed_by_user_id = ?,
                reviewed_at = CURRENT_TIMESTAMP, review_note = ?
             WHERE id = ?`,
            [decision === 'pass' ? 'passed' : 'failed', decision === 'pass' ? 'APPROVED' : 'REJECTED',
             actor.id, note || null, sub.id]
        )
        res.json({ success: true, id: sub.id, decision })
    } catch (e) {
        console.error('[submissions] review error:', e.message)
        res.status(500).json({ success: false, message: e.message })
    }
})

export default router
