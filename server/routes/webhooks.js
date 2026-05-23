import express from 'express'
import crypto from 'crypto'
import { updateSingleStudent } from '../services/thinkific.js'
import { dbRun, dbGet, IS_POSTGRES } from '../db/init.js'
import { enqueueJob } from '../queue/index.js'

const router = express.Router()

function verifyThinkificSignature(rawBody, req) {
    const secret = process.env.THINKIFIC_WEBHOOK_SECRET
    if (!secret) {
        console.warn('⚠️ THINKIFIC_WEBHOOK_SECRET not set — skipping signature check')
        return true
    }
    const signature = req.headers['x-thinkific-hmac-sha256']
    if (!signature) return false
    const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(JSON.stringify(rawBody))
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64')
    try {
        return crypto.timingSafeEqual(Buffer.from(signature, 'base64'), Buffer.from(expected, 'base64'))
    } catch {
        return false
    }
}


router.post('/thinkific', async (req, res) => {
    // Always respond 200 immediately — Thinkific retries on non-200 or timeout
    res.status(200).json({ received: true })

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}))

    if (!verifyThinkificSignature(rawBody, req)) {
        console.warn('⚠️ Webhook: invalid HMAC signature — ignoring')
        return
    }

    let payload
    try {
        payload = JSON.parse(rawBody.toString())
    } catch {
        console.warn('⚠️ Webhook: could not parse body')
        return
    }

    const { type, resource } = payload
    if (!type) return
    console.log(`📡 Thinkific webhook: ${type}`)

    try {
        // Fix 9: Insert to webhook_incoming for audit trail and retry support
        let webhookId = null
        try {
            if (IS_POSTGRES) {
                const row = await dbGet(
                    'INSERT INTO webhook_incoming (event_type, payload) VALUES ($1, $2) RETURNING id',
                    [type, JSON.stringify(payload)]
                )
                webhookId = row?.id ?? null
            } else {
                const result = await dbRun(
                    'INSERT INTO webhook_incoming (event_type, payload) VALUES (?, ?)',
                    [type, JSON.stringify(payload)]
                )
                webhookId = result?.lastInsertRowid ?? null
            }
        } catch (e) {
            console.warn('⚠️ Could not save webhook to DB:', e.message)
        }

        // If Redis is available, enqueue for durable processing; otherwise process inline
        const hasRedis = !!(process.env.REDIS_URL || process.env.REDIS_HOST)
        if (hasRedis) {
            await enqueueJob('webhook-process', { webhookId, type, resource }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 }
            })
        } else {
            // Fix 2: inline processing with fromWebhook flag for synchronous cache write
            // Fix 10: user.created now inserts new student immediately via allowInsert
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
        }

        // Track last webhook event for Diagnostics page
        const settingsSql = IS_POSTGRES
            ? "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value"
            : "INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)"
        await dbRun(settingsSql, [
            'webhook_last_event',
            JSON.stringify({ type, userId: resource?.user_id || resource?.id, receivedAt: Date.now() })
        ])

    } catch (err) {
        console.error(`❌ Webhook handler error for ${type}:`, err.message)
    }
})

export default router
