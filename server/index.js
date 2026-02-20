import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import cors from 'cors'
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
import checkpointRoutes from './routes/checkpoints.js'
import formationDashboardRoutes from './routes/formation-dashboard.js'
import techSupportRoutes from './routes/tech-support.js'
import exportRoutes from './routes/exports.js'
import { initDatabase } from './db/init.js'
import { preWarmCache } from './services/thinkific.js'
import { startAutoSync } from './services/notion-sync.js'
import { initScheduler } from './services/scheduler.js'
import compression from 'compression'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

    // Initialize database, then start services that depend on it
    ; (async () => {
        await initDatabase()

        // Pre-warm Thinkific cache — loads disk cache instantly, refreshes in background if stale
        preWarmCache()

        // Start Notion auto-sync (gracefully disabled if credentials not configured)
        startAutoSync()

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
app.use('/api/checkpoints', checkpointRoutes)
app.use('/api/formation-dashboard', formationDashboardRoutes)
app.use('/api/tech-support', techSupportRoutes)
app.use('/api/exports', exportRoutes)
app.use('/api/public', imageRoutes)

// Health check
app.get('/api/health', async (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '../dist')))
    app.get('*', async (req, res) => {
        res.sendFile(join(__dirname, '../dist/index.html'))
    })
}

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
