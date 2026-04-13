import { Worker } from 'bullmq'
import { syncWeeklyReports } from '../services/notion-sync.js'

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
}

console.log('Starting BullMQ Worker...')

if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    const worker = new Worker('portal-queue', async job => {
        switch(job.name) {
            case 'notion-sync':
                console.log(`[Worker] Executing notion-sync...`)
                return await syncWeeklyReports()

            case 'thinkific-sync':
                console.log(`[Worker] Executing thinkific-sync...`)
                const { forceRefresh } = await import('../services/thinkific.js')
                await forceRefresh()
                return true
                
            case 'async-export':
                console.log(`[Worker] Started async-export Job ID ${job.id}`)
                await new Promise(r => setTimeout(r, 5000))
                console.log(`[Worker] Completed async-export Job ID ${job.id}`)
                return { url: `/api/exports/download/${job.id}`, filename: `export_${job.id}.csv` }

            case 'checkpoint-generation':
                console.log(`[Worker] Executing checkpoint-generation (noop)...`)
                return true

            case 'email-reminders':
                console.log(`[Worker] Executing email-reminders (noop)...`)
                return true

            case 'batch-thinkific':
                console.log(`[Worker] Executing batch-thinkific for Job ID ${job.id}`)
                await new Promise(r => setTimeout(r, 3000))
                return { processed: job.data?.batch?.length || 0, errors: [] }

            default:
                throw new Error(`Job ${job.name} does not have a handler`)
        }
    }, { 
        connection: process.env.REDIS_URL || connection,
        concurrency: 5 
    })

    worker.on('completed', job => {
        console.log(`[Worker] Job ${job.id} (${job.name}) completed successfully`)
    })

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job.id} (${job.name}) failed with ${err.message}`)
    })
} else {
    console.log('[Worker] Bypassed (No Redis connection configured)')
}
