
import cron from 'node-cron'
import { dbAll, dbRun, dbGet } from '../db/init.js'
import { generateAllCheckpoints } from './checkpoints.js'
import { notifyOverdueReports, notifyCheckpointReady } from './notifications.js'
import { getCacheStatus, forceRefresh } from './thinkific.js'

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
    THINKIFIC_SYNC: '*/5 * * * *'    // Every 5 minutes
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
        const thinkificTask = cron.schedule(CRON_SCHEDULES.THINKIFIC_SYNC, async () => {
            console.log('⏰ Running fallback Thinkific sync...')
            try {
                await forceRefresh()
            } catch (error) {
                console.error('❌ Thinkific sync failed:', error)
            }
        })
        tasks.push(thinkificTask)
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
 * Check if the current week is a checkpoint week (4, 8, 13) and trigger generation
 */
async function checkAndGenerateCheckpoints() {
    // 1. Determine current academic week
    // For MVP, we will rely on a manual system setting or assume we increment from a start date.
    // Since strict calendar logic is complex, we will look for specific "Trigger" flags in settings 
    // or just run for ALL checkpoint weeks and let the generator skip existing ones.

    // Safest approach: Run for 4, 8, and 13. The generator checks for existence so it's idempotent.
    console.log('ℹ️  Triggering checkpoint generation for Weeks 4, 8, 13...')

    const results4 = generateAllCheckpoints(4)
    const results8 = generateAllCheckpoints(8)
    const results13 = generateAllCheckpoints(13)

    const totalGenerated = results4.generated + results8.generated + results13.generated
    if (totalGenerated > 0) {
        console.log(`✅ Automated Checkpoints Generated: ${totalGenerated}`)

        // Notify facilitators, coordinators, and admins
        for (const week of [4, 8, 13]) {
            const result = week === 4 ? results4 : week === 8 ? results8 : results13
            if (result.generated > 0) {
                notifyCheckpointReady(week, result.generated)
            }
        }
    } else {
        console.log('ℹ️  No new checkpoints needed.')
    }
}
