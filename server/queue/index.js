import { Queue } from 'bullmq'

const connection = {
    // BullMQ expects an object, but if REDIS_URL exists it overrides host/port naturally if parsed,
    // Alternatively pass maxRetriesPerRequest: null, which is REQUIRED for BullMQ
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
}

// Instantiate queue only if we have a Redis URL or Host
let portalQueue = null
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    portalQueue = new Queue('portal-queue', { 
        connection: process.env.REDIS_URL || connection 
    })
} else {
    portalQueue = {
        add: async () => console.log('[Queue Mock] job bypassed (No Redis)'),
        getActiveCount: async () => 0,
        getWaitingCount: async () => 0,
        getFailedCount: async () => 0,
        getCompletedCount: async () => 0,
        getDelayedCount: async () => 0,
        getActive: async () => [],
        getFailed: async () => [],
        getJob: async () => null
    }
}
export { portalQueue }

/**
 * Enqueue a background task.
 * @param {string} jobName 
 * @param {object} payload 
 * @param {object} opts optional BullMQ options (delay, repeat, etc.)
 */
export async function enqueueJob(jobName, payload, opts = {}) {
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        console.log(`[Queue Mock] Enqueueing ${jobName} bypassed (No Redis Configured)`)
        return null
    }

    try {
        const job = await portalQueue.add(jobName, payload, opts)
        return job.id
    } catch (e) {
        console.error(`Failed to enqueue job ${jobName}:`, e.message)
        return null
    }
}

/**
 * Initializes CRON / repeating jobs
 */
export async function initializeCronJobs() {
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) return

    console.log('Initializing BullMQ CRON jobs...')
    
    // Notion Sync: Every 3 minutes
    await portalQueue.add('notion-sync', {}, {
        repeat: { pattern: '*/3 * * * *' },
        jobId: 'cron-notion-sync', // deterministic ID prevents duplicates
        removeOnComplete: 10,
        removeOnFail: 50
    })

    // Thinkific Sync: Every 5 minutes
    await portalQueue.add('thinkific-sync', {}, {
        repeat: { pattern: '*/5 * * * *' },
        jobId: 'cron-thinkific-sync',
        removeOnComplete: 10,
        removeOnFail: 50
    })

    // Email Reminders: Friday at 6:00 PM
    await portalQueue.add('email-reminders', {}, {
        repeat: { pattern: '0 18 * * 5' },
        jobId: 'cron-email-reminders',
        removeOnComplete: 5
    })

    // Checkpoint Generation: Every Sunday night at 23:00 (Weekly, checks internally if it's week 4, 8, 13)
    await portalQueue.add('checkpoint-generation', {}, {
        repeat: { pattern: '0 23 * * 0' },
        jobId: 'cron-checkpoint-generation',
        removeOnComplete: 5
    })
}
