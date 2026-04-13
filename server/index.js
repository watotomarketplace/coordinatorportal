import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import cors from 'cors'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import authRoutes from './routes/auth.js'
import dataRoutes from './routes/data.js'
import adminRoutes from './routes/admin.js'
import imageRoutes from './routes/images.js'
import thinkificRoutes from './routes/thinkific.js'
import importRoutes from './routes/import.js'
import notificationRoutes from './routes/notifications.js'
import formationGroupRoutes from './routes/formation-groups.js'
import weeklyReportRoutes from './routes/weekly-reports.js'
import settingsRoutes from './routes/settings.js'
import notionRoutes from './routes/notion.js'
import checkpointRoutes from './routes/checkpoints.js'
import formationDashboardRoutes from './routes/formation-dashboard.js'
import attendanceRoutes from './routes/attendance.js'
import techSupportRoutes from './routes/tech-support.js'
import exportRoutes from './routes/exports.js'
import diagnosticRoutes from './routes/diagnostics.js'
import userPreferencesRoutes from './routes/user-preferences.js'
import dashboardSummaryRoutes from './routes/dashboard-summary.js'
import { initDatabase } from './db/init.js'
import { preWarmCache, getCacheStatus } from './services/thinkific.js'
import { initScheduler } from './services/scheduler.js'
import { initializeCronJobs } from './queue/index.js'
import queueRoutes from './routes/queue.js'
import webhookRoutes from './routes/webhooks.js'
import compression from 'compression'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

    // Initialize database, then start services that depend on it
    ; (async () => {
        await initDatabase()

        // Pre-warm Thinkific cache — loads disk cache instantly, refreshes in background if stale
        await preWarmCache()
        console.log(`[Thinkific] Cache contains ${getCacheStatus().cacheSize} students`);

        // Start Queue-based Background Jobs (replaces direct startAutoSync)
        await initializeCronJobs()

        // Start Scheduler (Cron Jobs)
        initScheduler()
    })()

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

// Enable GZIP compression
app.use(compression())

// Serve Profile Images
app.use('/profile-images', express.static(join(__dirname, '../Profile Images')))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.set('trust proxy', 1) // Trust Render's reverse proxy for secure cookies

app.use(session({
    secret: process.env.SESSION_SECRET || 'watoto-dashboard-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: (parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 60) * 60 * 1000
    }
}))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/thinkific', thinkificRoutes)
app.use('/api/import', importRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/formation-groups', formationGroupRoutes)
app.use('/api/reports', weeklyReportRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/notion', notionRoutes)
app.use('/api/checkpoints', checkpointRoutes)
app.use('/api/formation-dashboard', formationDashboardRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/tech-support', techSupportRoutes)
app.use('/api/exports', exportRoutes)
app.use('/api/diagnostics', diagnosticRoutes)
app.use('/api/user/preferences', userPreferencesRoutes)
app.use('/api/queue', queueRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/public', imageRoutes)
app.use('/api/dashboard', dashboardSummaryRoutes)

// Health check
// Health check endpoint explicitly mapped
app.get('/api/health', (req, res) => {
    let cacheStale = true
    try {
        const CACHE_FILE = join(__dirname, 'db/cache.json')
        if (fs.existsSync(CACHE_FILE)) {
            const stats = fs.statSync(CACHE_FILE)
            cacheStale = Date.now() - new Date(stats.mtime).getTime() > (30 * 60 * 1000)
        }
    } catch (e) {}
    res.json({
        status: cacheStale ? 'degraded' : 'healthy',
        timestamp: new Date().toISOString(),
        cache_stale: cacheStale,
        uptime: process.uptime()
    })
})

// Serve static files (pre-built React frontend)
app.use(express.static(join(__dirname, '../dist')))
app.get('*', async (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'))
})

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 GLOBAL API ERROR caught by Express:');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('Request URL:', req.originalUrl);
    console.error('Request Body:', req.body);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📊 Dashboard API available at http://localhost:${PORT}/api`)
})
