import { Worker } from 'bullmq'
import { dbRun, IS_POSTGRES } from '../db/init.js'
import { updateSingleStudent, scheduleDebounceRefresh } from '../services/thinkific.js'

async function processWebhookJob({ webhookId, type, resource }) {
    try {
        if (type === 'enrollment.created' || type === 'enrollment.updated') {
            if (resource?.user_id) {
                await updateSingleStudent(resource.user_id, resource, null, { fromWebhook: true })
            }
        } else if (type === 'user.updated') {
            if (resource?.id) {
                await updateSingleStudent(resource.id, null, resource, { fromWebhook: true })
            }
        } else if (type === 'user.created') {
            if (resource?.id) {
                await updateSingleStudent(resource.id, null, resource, { fromWebhook: true, allowInsert: true })
            }
        }

        if (webhookId) {
            const sql = IS_POSTGRES
                ? 'UPDATE webhook_incoming SET status=$1, processed_at=NOW(), attempts=attempts+1 WHERE id=$2'
                : 'UPDATE webhook_incoming SET status=?, processed_at=CURRENT_TIMESTAMP, attempts=attempts+1 WHERE id=?'
            await dbRun(sql, ['processed', webhookId])
        }
    } catch (err) {
        if (webhookId) {
            const sql = IS_POSTGRES
                ? 'UPDATE webhook_incoming SET status=$1, attempts=attempts+1 WHERE id=$2'
                : 'UPDATE webhook_incoming SET status=?, attempts=attempts+1 WHERE id=?'
            await dbRun(sql, ['failed', webhookId]).catch(() => {})
        }
        throw err
    }
}

export function startWebhookWorker() {
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) return null

    const connection = process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: null
    }

    const worker = new Worker('portal-queue', async (job) => {
        if (job.name !== 'webhook-process') return
        await processWebhookJob(job.data)
    }, { connection, concurrency: 1 })

    worker.on('failed', (job, err) => {
        console.error(`[webhook-worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message)
    })

    return worker
}
