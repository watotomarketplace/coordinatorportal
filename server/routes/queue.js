import express from 'express'
import { requireAuth, requireAdmin } from '../middleware/rbac.js'
import { portalQueue } from '../queue/index.js'

const router = express.Router()

router.get('/status', requireAuth, requireAdmin, async (req, res) => {
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        return res.json({ success: true, active: 0, waiting: 0, failed: 0, disabled: true })
    }

    try {
        const [active, waiting, failed, completed, delayed] = await Promise.all([
            portalQueue.getActiveCount(),
            portalQueue.getWaitingCount(),
            portalQueue.getFailedCount(),
            portalQueue.getCompletedCount(),
            portalQueue.getDelayedCount()
        ])

        const activeJobs = await portalQueue.getActive()
        const recentFailed = await portalQueue.getFailed(0, 5)

        res.json({
            success: true,
            counts: { active, waiting, failed, completed, delayed },
            activeJobs: activeJobs.map(j => ({ id: j.id, name: j.name, progress: j.progress })),
            recentFailed: recentFailed.map(j => ({ id: j.id, name: j.name, error: j.failedReason }))
        })
    } catch (e) {
        console.error('Queue Status Error:', e)
        res.status(500).json({ success: false, message: 'Failed to access BullMQ metrics' })
    }
})

// Optional helper for frontend to check specific job progress (for Async Exports / Batch jobs)
router.get('/job/:id', requireAuth, async (req, res) => {
    try {
        if (!process.env.REDIS_URL && !process.env.REDIS_HOST) return res.json({ success: true, state: 'completed' })
        
        const job = await portalQueue.getJob(req.params.id)
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' })

        const state = await job.getState()
        res.json({
            success: true,
            id: job.id,
            state,
            progress: job.progress,
            result: job.returnvalue,
            failedReason: job.failedReason
        })
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to find job' })
    }
})

export default router
