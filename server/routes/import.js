import express from 'express'
import { getStudentData, getUnenrolledUsers, enrollUser, createUser, updateUser } from '../services/thinkific.js'
import { queue } from '../services/queue.js'
import { requireCanImport } from '../middleware/rbac.js'

const router = express.Router()

// Helper: Normalize strings for comparison
const cleanEmail = (email) => String(email || '').toLowerCase().trim()
const normalizeCompany = (company) => {
    // Basic normalization - full logic is in thinkific.js but we just need consistent string for comparison if needed
    // Actually we will assume the input CSV has "Celebration Point" which maps to Company
    return String(company || '').trim()
}

// POST /api/import/analyze
// Body: { users: [ { firstName, lastName, email, celebrationPoint, ... } ] }
router.post('/analyze', requireCanImport, async (req, res) => {
    try {
        const { users } = req.body
        if (!users || !Array.isArray(users)) return res.status(400).json({ success: false, message: 'Invalid data format' })

        // Get current system state
        // We need ALL users to check against. 
        // getStudentData returns Enrolled. getUnenrolledUsers returns Unenrolled.
        // We need both.
        const [enrolledRes, unenrolledRes] = await Promise.all([
            getStudentData(null), // Get all, no filtering yet
            getUnenrolledUsers(null)
        ])

        const enrolledMap = new Map(enrolledRes.students.map(s => [cleanEmail(s.email), s]))
        const unenrolledMap = new Map(unenrolledRes.users.map(u => [cleanEmail(u.email), u]))

        const analysis = users.map(row => {
            const email = cleanEmail(row.email)
            const name = `${row.firstName} ${row.lastName}`.trim()

            // Check Enrolled
            if (enrolledMap.has(email)) {
                return { ...row, status: 'ENROLLED', message: 'Already enrolled' }
            }

            // Check Unenrolled (Exists in Thinkific but not in course)
            if (unenrolledMap.has(email)) {
                const existing = unenrolledMap.get(email)
                // Check if Celebration Point matches
                // If row has CP and existing is Unknown or different, we might want to update
                const rowCP = normalizeCompany(row.celebrationPoint)
                const existingCP = existing.celebration_point

                if (rowCP && existingCP !== rowCP) {
                    return {
                        ...row,
                        userId: existing.userId,
                        status: 'MISSING_INFO',
                        message: `Exists but different CP (${existingCP} -> ${rowCP})`,
                        action: 'UPDATE_AND_ENROLL'
                    }
                }

                return {
                    ...row,
                    userId: existing.userId,
                    status: 'UNENROLLED',
                    message: 'Exists in Thinkific',
                    action: 'ENROLL'
                }
            }

            // New User
            return {
                ...row,
                status: 'NEW',
                message: 'Will be created',
                action: 'CREATE_AND_ENROLL'
            }
        })

        res.json({ success: true, analysis })
    } catch (error) {
        console.error('Analyze error:', error)
        res.status(500).json({ success: false, message: 'Analysis failed' })
    }
})

// Worker Logic
queue.register('import', async (data, updateProgress) => {
    const { operations } = data
    const results = []
    let completed = 0
    const total = operations.length

    for (const op of operations) {
        let result = { email: op.email, success: false, message: '' }

        try {
            if (op.action === 'ENROLL') {
                const res = await enrollUser(op.userId)
                result.success = res.success
                result.message = res.message || 'Enrolled'
            }
            else if (op.action === 'UPDATE_AND_ENROLL') {
                const upd = await updateUser(op.userId, { company: op.celebrationPoint })
                if (upd.success) {
                    const res = await enrollUser(op.userId)
                    result.success = res.success
                    result.message = res.message || 'Updated & Enrolled'
                } else {
                    result.message = 'Update failed'
                }
            }
            else if (op.action === 'CREATE_AND_ENROLL') {
                const create = await createUser(op.firstName, op.lastName, op.email, op.celebrationPoint, 'Watoto123!')
                if (create.success) {
                    const res = await enrollUser(create.user.id)
                    result.success = res.success
                    result.message = res.message || 'Created & Enrolled'
                } else {
                    result.message = create.message || 'Creation failed'
                }
            } else {
                result.message = 'Unknown action'
            }
        } catch (e) {
            result.message = e.message
        }

        results.push(result)
        completed++

        // Update Progress
        const percent = Math.round((completed / total) * 100)
        updateProgress(percent)

        // Rate limit delay (1s)
        await new Promise(r => setTimeout(r, 1000))
    }

    return results
})

// POST /api/import/execute
// Body: { operations: [ ... ] }
router.post('/execute', requireCanImport, async (req, res) => {
    try {
        const { operations } = req.body
        if (!operations || !Array.isArray(operations)) return res.status(400).json({ success: false, message: 'Invalid operations' })

        // Add to queue
        const jobId = queue.add('import', { operations })

        res.json({ success: true, jobId, message: 'Import queued' })

    } catch (error) {
        console.error('Execute error:', error)
        res.status(500).json({ success: false, message: 'Execution failed' })
    }
})

// GET /api/import/status/:id
router.get('/status/:id', requireCanImport, async (req, res) => {
    const jobId = req.params.id
    const job = queue.get(jobId)

    if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' })
    }

    res.json({
        success: true,
        status: job.status,
        progress: job.progress,
        result: job.result, // Will be null until completed
        error: job.error
    })
})

export default router
