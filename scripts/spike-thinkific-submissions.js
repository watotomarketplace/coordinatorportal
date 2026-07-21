/**
 * scripts/spike-thinkific-submissions.js
 *
 * PHASE 0 SPIKE — Thinkific Assignment Submissions (GraphQL).
 *
 * Confirmed 21 Jul 2026: the NEW API Access Token (Bearer) unlocks Thinkific's
 * GraphQL API, which DOES expose assignment submissions + an approve/reject
 * mutation. (The legacy REST v1 key does NOT — it 404s.)
 *
 * This CLI runs the same read-only discovery the in-app admin endpoint runs
 * (POST /api/graduation/submissions/spike) — use that on Render where you can't
 * run a CLI. Both share server/services/thinkific-auth.js + thinkific-submissions.js.
 *
 * SAFETY: read-only. It LISTS submissions and DRY-RUNS the approve mutation
 * (prints what it would send) — it never mutates. Approval is irreversible.
 *
 * Usage (local):  node scripts/spike-thinkific-submissions.js
 * Auth: reads THINKIFIC_API_ACCESS_TOKEN from .env (or system_settings). Never
 * printed. GraphQL endpoint: https://api.thinkific.com/beta/graphql
 */
import 'dotenv/config'
import { probeSubmissions } from '../server/services/thinkific-submissions.js'

async function main() {
    console.log('════════════════════════════════════════════════════════════')
    console.log(' PHASE 0 SPIKE — Thinkific Assignment Submissions (GraphQL)')
    console.log('════════════════════════════════════════════════════════════\n')

    const r = await probeSubmissions()

    console.log(`auth mode:        ${r.auth_mode || '(unknown)'}   ${r.auth_mode === 'access-token' ? '(new Bearer token)' : '(legacy — GraphQL will NOT work)'}`)
    console.log(`endpoint:         ${r.endpoint}`)
    if (r.error) console.log(`error:            ${r.error}`)
    console.log('')
    for (const l of (r.lessons || [])) {
        console.log(`lesson ${l.lessonId} — "${l.lessonName}"`)
        console.log(`  isAssignment:   ${l.isAssignment}`)
        console.log(`  sample count:   ${l.sampleCount}  (hasNextPage: ${l.hasNextPage})`)
        console.log(`  statuses seen:  ${(l.statuses || []).join(', ') || '(none)'}`)
    }

    console.log('\n─── CAPABILITY RESULTS ───')
    console.log(` LIST submissions:   ${r.can_list ? 'PASS' : 'FAIL'}`)
    console.log(` READ file url:      ${r.can_read_file ? 'PASS' : 'UNKNOWN'}`)
    console.log(` APPROVE available:  ${r.approve_available ? 'YES (mutation updateAssignmentSubmissionStatus)' : 'NO'} — DRY-RUN ONLY`)

    console.log('\n─── APPROVE DRY RUN (nothing sent — irreversible) ───')
    console.log(' POST https://api.thinkific.com/beta/graphql   Authorization: Bearer <token>')
    console.log(' mutation ReviewSubmission($input: UpdateAssignmentSubmissionStatusInput!) {')
    console.log('   updateAssignmentSubmissionStatus(input: $input) { clientMutationId } }')
    console.log(' variables: { input: { submissionId: "<id>", status: "APPROVED" } }')
    console.log('   → status APPROVED completes the course and issues the certificate. Cannot be undone.')

    console.log('\n─── NOTES ───')
    console.log(' • Submissions sit in PENDING until reviewed → auto-approve is OFF (good).')
    console.log(' • Confirm auto-approve stays OFF on the WL101 assignment lesson in Thinkific.')
    console.log(' • On Render, trigger the in-app equivalent: POST /api/graduation/submissions/spike (Admin).')

    process.exit(r.error ? 1 : 0)
}

main().catch(e => { console.error('❌ Spike crashed:', e.message); process.exit(1) })
