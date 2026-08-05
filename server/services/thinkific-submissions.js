/**
 * Thinkific Assignment Submissions — sync service (Gate 1).
 *
 * Pulls assignment submissions for the WL101 graded lesson(s) from the Thinkific
 * GraphQL API and mirrors them into thinkific_submissions so coordinators can
 * review + pass/fail. Re-sync preserves portal review fields.
 *
 * GraphQL only (access-token). Endpoint/schema: see thinkific-auth.js.
 */
import { dbGet, dbAll, dbRun, IS_POSTGRES } from '../db/init.js'
import { thinkificGraphQL } from './thinkific-auth.js'

const COURSE_NAME_FALLBACK = 'Watoto Leadership 101'

// Named, shallow (depth/cost-safe) query: one assignment lesson's submissions.
const SUBMISSIONS_QUERY = `query WL101Submissions($id: ID!, $after: String) {
  lesson(id: $id) {
    id
    title
    content {
      __typename
      ... on AssignmentContent {
        id
        submissions(first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            status
            createdAt
            reviewedAt
            user { id gid firstName lastName email }
            file { name url size rawSize }
          }
        }
      }
    }
  }
}`

// Extract the numeric Thinkific user id from either a plain id or a gid://… value.
function numericUserId(user) {
    if (!user) return ''
    const raw = String(user.id ?? '')
    if (/^\d+$/.test(raw)) return raw
    const fromGid = String(user.gid ?? user.id ?? '').match(/(\d+)\s*$/)
    return fromGid ? fromGid[1] : raw
}

async function getAssignmentLessonIds() {
    let row = null
    try { row = await dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_assignment_lesson_ids'") } catch (_) {}
    return String(row?.value || process.env.THINKIFIC_ASSIGNMENT_LESSON_IDS || '76382279')
        .split(',').map(s => s.trim()).filter(Boolean)
}

// Build a userId → celebration_point map ONCE per sync (avoids an unindexed
// full-table scan per submission).
async function loadCampusMap() {
    const map = new Map()
    try {
        const rows = await dbAll('SELECT student_id, thinkific_user_id, celebration_point FROM thinkific_students')
        for (const r of rows) {
            if (r.celebration_point) {
                if (r.thinkific_user_id) map.set(String(r.thinkific_user_id), r.celebration_point)
                if (r.student_id) map.set(String(r.student_id), r.celebration_point)
            }
        }
    } catch (_) {}
    return map
}

// Upsert one submission, preserving portal_review_status / reviewed_* / review_note.
async function upsertSubmission(s, lessonName, campusByUser) {
    const uid = numericUserId(s.user)
    const campus = campusByUser.get(String(uid)) || null

    const name = [s.user?.firstName, s.user?.lastName].filter(Boolean).join(' ').trim() || null
    const email = (s.user?.email || '').trim() || null
    const cols = {
        thinkific_submission_id: String(s.id),
        thinkific_user_id: uid,
        student_id: uid,
        student_name: name,
        student_email: email,
        lesson_id: String(s.__lessonId || ''),
        lesson_name: lessonName || null,
        course_name: COURSE_NAME_FALLBACK,
        file_name: s.file?.name || null,
        file_url: s.file?.url || null,
        file_size: Number.isFinite(s.file?.rawSize) ? s.file.rawSize : null,
        submitted_at: s.createdAt || null,
        thinkific_status: s.status || null,
        celebration_point: campus,
    }

    const existing = await dbGet('SELECT id FROM thinkific_submissions WHERE thinkific_submission_id = ?', [cols.thinkific_submission_id])
    if (existing) {
        // Update Thinkific-sourced fields ONLY — never touch portal review columns.
        await dbRun(
            `UPDATE thinkific_submissions SET
                thinkific_user_id=?, student_id=?, student_name=?, student_email=?,
                lesson_id=?, lesson_name=?, course_name=?, file_name=?, file_url=?, file_size=?,
                submitted_at=?, thinkific_status=?, celebration_point=?, synced_at=CURRENT_TIMESTAMP
             WHERE thinkific_submission_id=?`,
            [cols.thinkific_user_id, cols.student_id, cols.student_name, cols.student_email,
             cols.lesson_id, cols.lesson_name, cols.course_name, cols.file_name, cols.file_url, cols.file_size,
             cols.submitted_at, cols.thinkific_status, cols.celebration_point, cols.thinkific_submission_id]
        )
        return 'updated'
    }
    await dbRun(
        `INSERT INTO thinkific_submissions
            (thinkific_submission_id, thinkific_user_id, student_id, student_name, student_email,
             lesson_id, lesson_name, course_name, file_name, file_url, file_size,
             submitted_at, thinkific_status, portal_review_status, celebration_point, synced_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unreviewed', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [cols.thinkific_submission_id, cols.thinkific_user_id, cols.student_id, cols.student_name, cols.student_email,
         cols.lesson_id, cols.lesson_name, cols.course_name, cols.file_name, cols.file_url, cols.file_size,
         cols.submitted_at, cols.thinkific_status, cols.celebration_point]
    )
    return 'inserted'
}

/**
 * Sync all assignment submissions for the configured lesson(s).
 * @returns {object} { success, lessons, inserted, updated, total, error? }
 */
export async function syncSubmissions() {
    const lessonIds = await getAssignmentLessonIds()
    let inserted = 0, updated = 0, total = 0
    const lessonsSeen = []
    try {
        const campusByUser = await loadCampusMap()
        for (const lessonId of lessonIds) {
            let after = null, hasNext = true, lessonName = null, page = 0
            while (hasNext) {
                const data = await thinkificGraphQL(SUBMISSIONS_QUERY, { id: lessonId, after }, { label: 'submissions-sync' })
                const lesson = data?.lesson
                lessonName = lesson?.title || lessonName
                const content = lesson?.content
                if (!content || content.__typename !== 'AssignmentContent') {
                    console.warn(`[submissions] lesson ${lessonId} is not an assignment — skipping`)
                    break
                }
                const conn = content.submissions
                for (const node of (conn?.nodes || [])) {
                    node.__lessonId = lessonId
                    const r = await upsertSubmission(node, lessonName, campusByUser)
                    r === 'inserted' ? inserted++ : updated++
                    total++
                }
                hasNext = !!conn?.pageInfo?.hasNextPage
                after = conn?.pageInfo?.endCursor || null
                if ((++page % 5) === 0 || !hasNext) console.log(`[submissions] lesson ${lessonId}: page ${page}, ${total} processed so far`)
                if (page > 200) { console.warn('[submissions] 200-page safety stop'); break }
            }
            lessonsSeen.push({ lessonId, lessonName })
        }
        console.log(`✅ Submissions sync: ${inserted} new, ${updated} updated (${total} total) across ${lessonsSeen.length} lesson(s)`)
        return { success: true, lessons: lessonsSeen, inserted, updated, total }
    } catch (e) {
        console.error('❌ Submissions sync failed:', e.message)
        return { success: false, error: e.message, inserted, updated, total }
    }
}

// Lightweight read-only probe used by the in-app diagnostic endpoint (the
// Render-friendly equivalent of the CLI spike). Never mutates. Never returns the token.
export async function probeSubmissions() {
    const lessonIds = await getAssignmentLessonIds()
    const out = { auth_mode: null, endpoint: 'https://api.thinkific.com/beta/graphql', lessons: [], can_list: false, can_read_file: false, approve_available: true, error: null }
    try {
        const { getThinkificAuthMode } = await import('./thinkific-auth.js')
        out.auth_mode = await getThinkificAuthMode()
        for (const lessonId of lessonIds) {
            const data = await thinkificGraphQL(SUBMISSIONS_QUERY, { id: lessonId, after: null }, { label: 'submissions-probe' })
            const content = data?.lesson?.content
            const nodes = content?.submissions?.nodes || []
            if (nodes.length) out.can_list = true
            if (nodes[0]?.file?.url) out.can_read_file = true
            out.lessons.push({
                lessonId,
                lessonName: data?.lesson?.title,
                isAssignment: content?.__typename === 'AssignmentContent',
                sampleCount: nodes.length,
                hasNextPage: !!content?.submissions?.pageInfo?.hasNextPage,
                statuses: [...new Set(nodes.map(n => n.status))],
            })
        }
        return out
    } catch (e) {
        out.error = e.message
        return out
    }
}

/**
 * Read-only: page every configured assignment lesson and return the LIVE
 * Thinkific status per submission id. Used by the status-mirror diagnostic to
 * compare against the stored thinkific_status. No writes; never returns a token.
 * @returns {Promise<Map<string, {status, reviewedAt, userName, email, lessonName, userId}>>}
 */
export async function fetchLiveSubmissions() {
    const lessonIds = await getAssignmentLessonIds()
    const map = new Map()
    for (const lessonId of lessonIds) {
        let after = null, hasNext = true, lessonName = null, page = 0
        while (hasNext) {
            const data = await thinkificGraphQL(SUBMISSIONS_QUERY, { id: lessonId, after }, { label: 'submissions-status-check' })
            const content = data?.lesson?.content
            lessonName = data?.lesson?.title || lessonName
            if (!content || content.__typename !== 'AssignmentContent') break
            const conn = content.submissions
            for (const n of (conn?.nodes || [])) {
                map.set(String(n.id), {
                    status: n.status || null,
                    reviewedAt: n.reviewedAt || null,
                    userName: `${n.user?.firstName || ''} ${n.user?.lastName || ''}`.trim() || null,
                    email: n.user?.email || null,
                    userId: numericUserId(n.user),
                    lessonName,
                    fileName: n.file?.name || null,
                    fileUrl: n.file?.url || null,
                    submittedAt: n.createdAt || null,
                })
            }
            hasNext = !!conn?.pageInfo?.hasNextPage
            after = conn?.pageInfo?.endCursor || null
            if (++page > 200) break
        }
    }
    return map
}
