/**
 * scripts/spike-thinkific-submissions.js
 *
 * PHASE 0 SPIKE — Thinkific Assignment Submissions API discovery.
 *
 * Purpose: verify, BEFORE building Gate 1 (submission review → certificate),
 * whether the Thinkific API this account can reach exposes:
 *   (1) LIST assignment submissions for the WL101 course
 *   (2) READ a submission's uploaded file (url/metadata)
 *   (3) APPROVE a submission (write-back that completes the course)
 *
 * SAFETY: This script NEVER writes to Thinkific. Approve is IRREVERSIBLE, so
 * the approve capability is only DRY-RUN printed (method/URL/headers/body).
 *
 * Usage (from project root):
 *   node scripts/spike-thinkific-submissions.js
 *
 * Credentials are loaded exactly like the app: system_settings first, then env
 * (THINKIFIC_API_KEY / THINKIFIC_SUBDOMAIN via .env). The DB step is best-effort —
 * if the DB can't init locally, we fall back to env so the spike still runs.
 */
import 'dotenv/config'
import axios from 'axios'

// ── WL101 course identity (from thinkific.js: enrollUser courseId) ──
const WL101_COURSE_ID = 3300782
const WL101_COURSE_NAME_MATCH = ['leadership 101', 'wl101', 'watoto leadership']

// ── Credential loading: system_settings → env (mirrors thinkific-common.js) ──
async function loadCredentials() {
    // Best-effort DB read; fall back to env if the local DB can't be initialised.
    try {
        const { initDatabase } = await import('../server/db/init.js')
        await initDatabase()
        const { getThinkificCredentials } = await import('../server/services/thinkific-common.js')
        const creds = await getThinkificCredentials()
        if (creds.apiKey && creds.subdomain) {
            console.log('🔑 Credentials source: system_settings (with env fallback)')
            return creds
        }
    } catch (e) {
        console.warn('⚠️  DB credential path unavailable, using env only:', e.message)
    }
    return {
        apiKey: process.env.THINKIFIC_API_KEY || '',
        subdomain: process.env.THINKIFIC_SUBDOMAIN || ''
    }
}

function mask(v) {
    if (!v) return '(empty)'
    if (v.length <= 6) return '***'
    return v.slice(0, 3) + '…' + v.slice(-3)
}

// Pretty-print a short slice of any response body for diagnostics.
function preview(data, max = 600) {
    let s
    try { s = typeof data === 'string' ? data : JSON.stringify(data) }
    catch { s = String(data) }
    return s.length > max ? s.slice(0, max) + ' …[truncated]' : s
}

// Extract a list array from Thinkific's varying envelope shapes.
function extractItems(data) {
    if (Array.isArray(data)) return data
    return data?.items || data?.data || data?.results || null
}

async function probe(label, { method = 'get', url, headers, params, note }) {
    process.stdout.write(`\n── PROBE: ${label}\n   ${method.toUpperCase()} ${url}\n`)
    if (params) process.stdout.write(`   params: ${JSON.stringify(params)}\n`)
    if (note) process.stdout.write(`   note: ${note}\n`)
    try {
        const res = await axios.request({
            method, url, headers, params,
            timeout: 30000,
            validateStatus: () => true // never throw — we want to see every status
        })
        const items = extractItems(res.data)
        console.log(`   → HTTP ${res.status}`)
        if (res.status >= 200 && res.status < 300) {
            if (items) {
                console.log(`   ✅ list-shaped response, ${items.length} item(s)`)
                if (items.length) console.log(`   sample[0]: ${preview(items[0])}`)
            } else {
                console.log(`   ✅ object response: ${preview(res.data)}`)
            }
            return { ok: true, status: res.status, items, data: res.data }
        }
        // Non-2xx: surface the exact diagnostic (401 auth, 403 scope, 404 wrong path)
        const hint = res.status === 401 ? 'AUTH — key/subdomain rejected or wrong auth scheme'
            : res.status === 403 ? 'FORBIDDEN — key lacks scope/permission for this resource'
            : res.status === 404 ? 'NOT FOUND — endpoint path does not exist on this API'
            : ''
        console.log(`   ❌ ${hint}`)
        console.log(`   body: ${preview(res.data)}`)
        return { ok: false, status: res.status, data: res.data }
    } catch (e) {
        console.log(`   ❌ transport error: ${e.code || ''} ${e.message}`)
        return { ok: false, error: e.message }
    }
}

async function main() {
    console.log('════════════════════════════════════════════════════════════')
    console.log(' PHASE 0 SPIKE — Thinkific Assignment Submissions API')
    console.log('════════════════════════════════════════════════════════════')

    const { apiKey, subdomain } = await loadCredentials()
    console.log(`\nSubdomain: ${subdomain || '(empty)'}`)
    console.log(`API key:   ${mask(apiKey)}`)
    console.log(`WL101 course_id: ${WL101_COURSE_ID}`)
    if (!apiKey || !subdomain) {
        console.error('\n❌ Missing Thinkific credentials — set THINKIFIC_API_KEY & THINKIFIC_SUBDOMAIN in .env, or in system_settings. Aborting.')
        process.exit(1)
    }

    // v1 public API — the auth scheme the app already uses successfully.
    const V1_BASE = 'https://api.thinkific.com/api/public/v1'
    const v1Headers = {
        'X-Auth-API-Key': apiKey,
        'X-Auth-Subdomain': subdomain,
        'Content-Type': 'application/json'
    }
    // v2 API — newer surface; typically OAuth Bearer. We try the v1 key as Bearer
    // AND as X-Auth headers so the human sees exactly which (if any) is accepted.
    const V2_BASE = 'https://api.thinkific.com/v2'
    const v2BearerHeaders = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }

    // Sanity check: confirm base v1 auth works at all (known-good endpoint).
    const sanity = await probe('v1 sanity /users (auth check)', {
        url: `${V1_BASE}/users`, headers: v1Headers, params: { page: 1, limit: 1 }
    })

    console.log('\n============================================================')
    console.log(' CAPABILITY 1 — LIST assignment submissions')
    console.log('============================================================')
    console.log('Probing candidate endpoints (edit CANDIDATES below to add more):')

    // Candidate LIST endpoints. Thinkific has historically NOT exposed assignment
    // submissions on public v1; these probes establish ground truth for this account.
    const listCandidates = [
        // v1 public API guesses
        { label: 'v1 /assignment_submissions', url: `${V1_BASE}/assignment_submissions`, headers: v1Headers, params: { page: 1, limit: 5 } },
        { label: 'v1 /assignment_submissions?course_id', url: `${V1_BASE}/assignment_submissions`, headers: v1Headers, params: { page: 1, limit: 5, course_id: WL101_COURSE_ID } },
        { label: 'v1 /assignments', url: `${V1_BASE}/assignments`, headers: v1Headers, params: { page: 1, limit: 5 } },
        { label: 'v1 /submissions', url: `${V1_BASE}/submissions`, headers: v1Headers, params: { page: 1, limit: 5 } },
        // v2 API guesses (Bearer auth)
        { label: 'v2 /assignment_submissions (Bearer)', url: `${V2_BASE}/assignment_submissions`, headers: v2BearerHeaders, note: 'v2 usually needs an OAuth token, not the v1 API key — 401 here just tells us OAuth is required' },
        { label: 'v2 /submissions (Bearer)', url: `${V2_BASE}/submissions`, headers: v2BearerHeaders },
    ]

    let listResult = null
    let listEndpoint = null
    for (const c of listCandidates) {
        const r = await probe(c.label, c)
        if (r.ok && r.items) { listResult = r; listEndpoint = c; break }
    }

    // If we got a list, describe the shape of one submission in detail.
    let sampleSubmission = null
    if (listResult && listResult.items?.length) {
        sampleSubmission = listResult.items[0]
        console.log('\n── SAMPLE SUBMISSION SHAPE ──')
        console.log(`   endpoint: ${listEndpoint.url}`)
        console.log(`   keys: ${Object.keys(sampleSubmission).join(', ')}`)
        console.log(`   id:        ${sampleSubmission.id ?? sampleSubmission.submission_id ?? '(none)'}`)
        console.log(`   user id:   ${sampleSubmission.user_id ?? sampleSubmission.student_id ?? '(none)'}`)
        console.log(`   lesson:    ${sampleSubmission.lesson_id ?? sampleSubmission.content_id ?? '(none)'} / ${sampleSubmission.lesson_name ?? sampleSubmission.content_name ?? '(none)'}`)
        console.log(`   status:    ${sampleSubmission.status ?? sampleSubmission.review_status ?? '(none)'}`)
        console.log(`   file:      ${sampleSubmission.file_url ?? sampleSubmission.file_name ?? sampleSubmission.attachment_url ?? '(none)'}`)
        console.log(`   full json: ${preview(sampleSubmission, 1200)}`)
    }

    console.log('\n============================================================')
    console.log(' CAPABILITY 2 — READ submission file')
    console.log('============================================================')
    let readOk = false
    if (sampleSubmission) {
        const fileUrl = sampleSubmission.file_url || sampleSubmission.attachment_url || sampleSubmission.download_url
        if (fileUrl) {
            console.log(`   file URL present on submission: ${fileUrl}`)
            console.log('   NOTE: production must stream this server-side with creds; not fetched here.')
            readOk = true
        } else {
            console.log('   ⚠️  No file URL field on the sample submission — a per-submission GET may be needed.')
            console.log('   Candidate: GET ' + (listEndpoint?.url || `${V1_BASE}/assignment_submissions`) + '/{id}')
        }
    } else {
        console.log('   ⏭  Skipped — no submissions listed, cannot inspect a file.')
    }

    console.log('\n============================================================')
    console.log(' CAPABILITY 3 — APPROVE submission (DRY RUN ONLY)')
    console.log('============================================================')
    console.log(' ⚠️  APPROVAL IS IRREVERSIBLE — this script sends NOTHING.')
    const sampleId = sampleSubmission?.id ?? sampleSubmission?.submission_id ?? '{SUBMISSION_ID}'
    const approveBase = listEndpoint?.url || `${V1_BASE}/assignment_submissions`
    // Mask secrets before printing — this output gets pasted into chats/tickets.
    const printableHeaders = { ...(listEndpoint?.headers || v1Headers) }
    if (printableHeaders['X-Auth-API-Key']) printableHeaders['X-Auth-API-Key'] = mask(printableHeaders['X-Auth-API-Key'])
    if (printableHeaders['Authorization']) printableHeaders['Authorization'] = 'Bearer ' + mask(apiKey)
    console.log('\n Exact request Gate 1 WOULD send on a pass (dry run):')
    console.log(`   method:  PUT`)
    console.log(`   url:     ${approveBase}/${sampleId}`)
    console.log(`   headers: ${JSON.stringify(printableHeaders)}`)
    console.log(`   body:    ${JSON.stringify({ status: 'approved' })}`)
    console.log('\n Alternative approve shapes to try if the above 404s/422s:')
    console.log(`   POST ${approveBase}/${sampleId}/approve   body: {}`)
    console.log(`   PUT  ${approveBase}/${sampleId}            body: { review_status: "approved" }`)

    // ── Summary ──
    console.log('\n════════════════════════════════════════════════════════════')
    console.log(' RESULTS — PASS/FAIL per capability')
    console.log('════════════════════════════════════════════════════════════')
    console.log(` v1 auth (sanity /users):   ${sanity.ok ? 'PASS' : 'FAIL (HTTP ' + (sanity.status ?? '—') + ')'}`)
    console.log(` LIST submissions:          ${listResult ? 'PASS via ' + listEndpoint.label : 'FAIL — no candidate endpoint returned a list'}`)
    console.log(`   endpoint:                ${listEndpoint ? listEndpoint.url : '(none found — endpoint/auth unknown)'}`)
    console.log(`   auth observed:           ${listEndpoint ? (listEndpoint.headers['X-Auth-API-Key'] ? 'X-Auth-API-Key + X-Auth-Subdomain (v1)' : 'Authorization: Bearer (v2)') : '(n/a)'}`)
    console.log(` READ file:                 ${readOk ? 'PASS (file URL on submission)' : 'UNKNOWN — needs a listed submission first'}`)
    console.log(` APPROVE available:         DRY-RUN ONLY (never tested live — irreversible)`)

    console.log('\n────────────────────────────────────────────────────────────')
    console.log(' NEXT STEPS FOR THE HUMAN:')
    console.log('  1. Paste this entire output back to Claude Code.')
    console.log('  2. Confirm AUTO-APPROVE is OFF on the WL101 assignment lesson in Thinkific.')
    console.log('  3. If every LIST probe failed, tell us which Thinkific API/plan you have')
    console.log('     (assignment submissions may require the v2 API + an OAuth app token).')
    console.log('  Gate 1 (Phases 3–4) is BLOCKED until LIST + APPROVE are confirmed.')
    console.log('  Gate 2 (graduation verification) does NOT depend on this — Phase 1 proceeds now.')
    console.log('────────────────────────────────────────────────────────────')

    process.exit(0)
}

main().catch(e => {
    console.error('\n❌ Spike crashed:', e)
    process.exit(1)
})
