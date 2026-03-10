import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAdmin } from '../middleware/rbac.js'
import { restartAutoSync, getSyncStatus } from '../services/notion-sync.js'
import { Client as NotionClient } from '@notionhq/client'

const router = express.Router()

// --- GET ALL SETTINGS (Admin only) ---
router.get('/', requireAdmin, async (req, res) => {
    try {
        const settings = await dbAll('SELECT key, value, updated_at FROM system_settings')
        // Convert array to object, masking sensitive values
        const result = {}
        for (const s of settings) {
            if (s.key === 'notion_api_key' && s.value) {
                result[s.key] = s.value.substring(0, 8) + '••••••••'
            } else {
                result[s.key] = s.value
            }
        }
        result._raw_updated = settings.reduce((acc, s) => { acc[s.key] = s.updated_at; return acc }, {})
        res.json({ success: true, settings: result })
    } catch (error) {
        console.error('Get settings error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch settings' })
    }
})

// --- UPDATE SETTINGS (Admin only) ---
router.put('/', requireAdmin, async (req, res) => {
    try {
        const { notion_api_key, notion_db_id, notion_sync_interval } = req.body

        const upsert = async (key, value) => {
            if (value === undefined) return
            const existing = await dbGet('SELECT key FROM system_settings WHERE key = ?', [key])
            if (existing) {
                await dbRun('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key])
            } else {
                await dbRun('INSERT INTO system_settings (key, value) VALUES (?, ?)', [key, value])
            }
        }

        if (notion_api_key !== undefined) await upsert('notion_api_key', notion_api_key)
        if (notion_db_id !== undefined) await upsert('notion_db_id', notion_db_id)
        if (notion_sync_interval !== undefined) await upsert('notion_sync_interval', String(notion_sync_interval))

        // Restart auto-sync with new settings
        restartAutoSync()

        res.json({ success: true, message: 'Settings updated. Notion sync restarted.' })
    } catch (error) {
        console.error('Update settings error:', error)
        res.status(500).json({ success: false, message: 'Failed to update settings' })
    }
})

// --- TEST NOTION CONNECTION (Admin only) ---
router.post('/test-notion', requireAdmin, async (req, res) => {
    try {
        const apiKey = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_api_key'")
        const dbId = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_db_id'")

        const effectiveApiKey = apiKey?.value || process.env.NOTION_API_KEY
        const effectiveDbId   = dbId?.value   || process.env.NOTION_DB_ID

        if (!effectiveApiKey || !effectiveDbId) {
            return res.json({ success: false, message: 'Notion credentials not configured' })
        }

        const notion = new NotionClient({ auth: effectiveApiKey })

        // Try querying the database (just 1 page to test)
        const response = await notion.databases.query({
            database_id: effectiveDbId,
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
