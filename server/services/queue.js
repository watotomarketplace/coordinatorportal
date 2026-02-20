import { v4 as uuidv4 } from 'uuid';

class JobQueue {
    constructor() {
        this.jobs = new Map();
        this.handlers = new Map();
        this.isProcessing = false;
    }

    // Register a worker for a specific job type
    register(type, handler) {
        this.handlers.set(type, handler);
        console.log(`👷 Registered worker for job type: ${type}`);
    }

    // Add a job to the queue
    add(type, data) {
        const id = uuidv4();
        const job = {
            id,
            type,
            data,
            status: 'pending', // pending, processing, completed, failed
            progress: 0,
            result: null,
            error: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.jobs.set(id, job);

        // Trigger processing immediately (or could be setImmediate)
        this.processNext();

        return id;
    }

    // Get job status
    get(id) {
        return this.jobs.get(id);
    }

    // Update job progress
    updateProgress(id, progress) {
        const job = this.jobs.get(id);
        if (job) {
            job.progress = progress;
            job.updatedAt = new Date();
        }
    }

    // Internal processing loop
    async processNext() {
        if (this.isProcessing) return;

        // Find next pending job (FIFO)
        const pendingJob = Array.from(this.jobs.values())
            .sort((a, b) => a.createdAt - b.createdAt)
            .find(j => j.status === 'pending');

        if (!pendingJob) return;

        this.isProcessing = true;
        const job = pendingJob;
        const handler = this.handlers.get(job.type);

        if (!handler) {
            job.status = 'failed';
            job.error = `No handler for job type: ${job.type}`;
            job.updatedAt = new Date();
            this.isProcessing = false;
            return;
        }

        try {
            console.log(`🔄 Starting job ${job.id} (${job.type})`);
            job.status = 'processing';
            job.updatedAt = new Date();

            // Execute Handler
            // Handler receives (jobData, updateProgressFn)
            const result = await handler(job.data, (p) => this.updateProgress(job.id, p));

            job.status = 'completed';
            job.result = result;
            job.progress = 100;
            job.updatedAt = new Date();
            console.log(`✅ Job ${job.id} completed`);
        } catch (error) {
            console.error(`❌ Job ${job.id} failed:`, error);
            job.status = 'failed';
            job.error = error.message;
            job.updatedAt = new Date();
        } finally {
            this.isProcessing = false;
            // Process next job if any
            this.processNext();
        }
    }
}

// Singleton instance
export const queue = new JobQueue();
