import express from 'express'
import { processWebhookPayload } from '../services/thinkific.js'
import { dbRun } from '../db/init.js'

const router = express.Router()

router.post('/thinkific', async (req, res) => {
    try {
        // Thinkific sends the topic in a specific header
        const topic = req.headers['x-thinkific-topic']
        if (!topic) return res.status(400).send('Missing Topic Header')

        const payload = req.body

        // Log the webhook to audit logs
        try {
            await dbRun(
                'INSERT INTO audit_logs (user_name, role, action, details, target_type) VALUES (?, ?, ?, ?, ?)',
                ['System', 'System', 'thinkific_webhook_received', `Topic: ${topic}`, 'Webhook']
            )
        } catch (e) {
            console.error('Failed to log webhook', e)
        }

        // Return 200 immediately to acknowledge receipt
        res.status(200).send('OK')

        // Process in the background if it's one we care about
        const watchedTopics = ['enrollment.created', 'user.signup', 'course.progress.updated']
        if (watchedTopics.includes(topic)) {
            processWebhookPayload(topic, payload).catch(e => console.error('Webhook processing failed:', e))
        }

    } catch (err) {
        console.error('Webhook error:', err)
        // Since we already might have sent a 200, checking res.headersSent is polite but typically it crashes before sending.
        if (!res.headersSent) res.status(500).send('Error')
    }
})

export default router
