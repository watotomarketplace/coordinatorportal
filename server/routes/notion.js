import express from 'express'
import { requireAdmin } from '../middleware/rbac.js'
import { getSyncStatus, syncWeeklyReports, restartAutoSync } from '../services/notion-sync.js'
import { Client as NotionClient } from '@notionhq/client'
import { dbGet, dbRun } from '../db/init.js'

const router = express.Router()

// GET /api/notion/status
router.get('/status', requireAdmin, async (req, res) => {
    try {
        const status = await getSyncStatus()
        res.json({ success: true, status })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

// POST /api/notion/sync
router.post('/sync', requireAdmin, async (req, res) => {
    try {
        // Run sync manually (in background to avoid timeout)
        syncWeeklyReports().catch(e => console.error("Manual Notion Sync Error:", e))
        res.json({ success: true, message: 'Sync started in background.' })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

// POST /api/notion/test
router.post('/test', requireAdmin, async (req, res) => {
    try {
        let { apiKey, dbId } = req.body
        
        if (!apiKey || !dbId) {
            const currentApiKey = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_api_key'")
            const currentDbId = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_database_id'")
            apiKey = apiKey || currentApiKey?.value
            dbId = dbId || currentDbId?.value
        }

        const notion = new NotionClient({ auth: apiKey })

        // Try querying the database (just 1 page to test)
        const response = await notion.databases.query({
            database_id: dbId,
            page_size: 1
        })

        const propertyNames = response.results.length > 0
            ? Object.keys(response.results[0].properties)
            : []

        res.json({
            success: true,
            message: `Connected! Database has ${response.results.length > 0 ? 'entries' : 'no entries yet'}.`,
            totalResults: response.results.length,
            properties: propertyNames
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message || 'Failed to connect to Notion'
        })
    }
})

export default router
