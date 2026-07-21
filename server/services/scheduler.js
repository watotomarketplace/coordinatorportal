
import cron from 'node-cron'
import { dbAll, dbRun, dbGet } from '../db/init.js'
import { generateAllCheckpoints } from './checkpoints.js'
import { notifyOverdueReports, notifyCheckpointReady } from './notifications.js'
import { getCacheStatus, forceRefresh } from './thinkific.js'
import { syncSubmissions } from './thinkific-submissions.js'

/**
 * Scheduler Service
 * Handles automated background tasks:
 * 1. Overdue Report Notifications (Daily)
 * 2. Discernment Checkpoint Generation (Weekly)
 */

// --- Configuration ---
const CRON_SCHEDULES = {
    OVERDUE_CHECK: '0 9 * * *',      // Daily at 9:00 AM
    CHECKPOINT_GEN: '0 4 * * 1',     // Weekly on Monday at 4:00 AM
    THINKIFIC_SYNC: '*/5 * * * *',   // Every 5 minutes
    SUBMISSIONS_SYNC: '*/30 * * * *' // Every 30 minutes (Gate 1 assignment submissions)
}

let tasks = []

/**
 * Initialize all scheduled tasks
 */
export async function initScheduler() {
    console.log('⏰ Initializing Scheduler...')

    // 1. Overdue Report Check
    const overdueTask = cron.schedule(CRON_SCHEDULES.OVERDUE_CHECK, async () => {
        console.log('⏰ Running automated overdue report check...')
        try {
            await checkOverdueReports()
        } catch (error) {
            console.error('❌ Overdue report check failed:', error)
        }
    })
    tasks.push(overdueTask)

    // 2. Checkpoint Generation
    const checkpointTask = cron.schedule(CRON_SCHEDULES.CHECKPOINT_GEN, async () => {
        console.log('⏰ Running automated checkpoint generation check...')
        try {
            await checkAndGenerateCheckpoints()
        } catch (error) {
            console.error('❌ Checkpoint generation failed:', error)
        }
    })
    tasks.push(checkpointTask)

    // 3. Fallback Thinkific Background Sync (if Redis isn't configured)
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        console.log('⏰ Adding fallback node-cron Thinkific Sync (every 5 mins)')
        let consecutiveFailures = 0
        let isSyncRunning = false
        const thinkificTask = cron.schedule(CRON_SCHEDULES.THINKIFIC_SYNC, () => {
            // Fire-and-forget: do not await inside the cron callback to avoid blocking
            // the event loop and causing subsequent cron ticks to be skipped.
            if (isSyncRunning) {
                console.log('⏰ Cron: Thinkific sync already running, skipping tick')
                return
            }
            isSyncRunning = true
            console.log('⏰ Cron: Thinkific sync starting')
            setImmediate(async () => {
                try {
                    await forceRefresh()
                    if (consecutiveFailures > 0) {
                        console.log(`✅ Thinkific sync recovered after ${consecutiveFailures} failure(s)`)
                    }
                    consecutiveFailures = 0
                    await dbRun(
                        "INSERT OR REPLACE INTO system_settings (key, value) VALUES ('cron_thinkific_last_success', ?)",
                        [new Date().toISOString()]
                    )
                } catch (error) {
                    consecutiveFailures++
                    console.error(`❌ Cron sync failed (${consecutiveFailures} consecutive):`, error.message)
                    await dbRun(
                        "INSERT OR REPLACE INTO system_settings (key, value) VALUES ('cron_thinkific_last_error', ?)",
                        [JSON.stringify({ message: error.message, failures: consecutiveFailures, at: new Date().toISOString() })]
                    ).catch(() => {})
                    if (consecutiveFailures >= 3) {
                        console.error(`🚨 ALERT: Thinkific sync has failed ${consecutiveFailures} times in a row — check API credentials and connectivity`)
                    }
                } finally {
                    isSyncRunning = false
                }
            })
        })
        tasks.push(thinkificTask)

        // 4. Fallback Thinkific Submissions Sync (Gate 1) — node-cron when no Redis.
        // BullMQ handles this as a repeatable when Redis is present (see queue.js).
        console.log('⏰ Adding fallback node-cron Submissions Sync (every 30 mins)')
        let subsRunning = false
        const submissionsTask = cron.schedule(CRON_SCHEDULES.SUBMISSIONS_SYNC, () => {
            if (subsRunning) { console.log('⏰ Cron: submissions sync already running, skipping tick'); return }
            subsRunning = true
            setImmediate(async () => {
                try {
                    const r = await syncSubmissions()
                    if (!r.success) console.warn('⚠️ Cron submissions sync error:', r.error)
                } catch (e) {
                    console.error('❌ Cron submissions sync failed:', e.message)
                } finally { subsRunning = false }
            })
        })
        tasks.push(submissionsTask)
    }

    console.log(`✅ Scheduler initialized with ${tasks.length} active tasks.`)
}

/**
 * Check for overdue reports and create notifications
 */
async function checkOverdueReports() {
    try {
        const count = await notifyOverdueReports()
        if (count > 0) {
            console.log(`🔔 Sent ${count} overdue report notifications.`)
        }
    } catch (error) {
        console.error('❌ Error checking overdue reports:', error)
    }
}

/**
 * Check if the current week is a checkpoint week (4, 8, 13, 16) and trigger generation
 */
async function checkAndGenerateCheckpoints() {
    console.log('ℹ️  Triggering checkpoint generation for Weeks 4, 8, 13, 16...')

    const checkpointWeeks = [4, 8, 13, 16]
    const results = await Promise.all(checkpointWeeks.map(w => generateAllCheckpoints(w)))

    let totalGenerated = 0
    for (let i = 0; i < checkpointWeeks.length; i++) {
        totalGenerated += results[i].generated
    }

    if (totalGenerated > 0) {
        console.log(`✅ Automated Checkpoints Generated: ${totalGenerated}`)
        for (let i = 0; i < checkpointWeeks.length; i++) {
            if (results[i].generated > 0) {
                notifyCheckpointReady(checkpointWeeks[i], results[i].generated)
            }
        }
    } else {
        console.log('ℹ️  No new checkpoints needed.')
    }
}
