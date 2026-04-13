import express from 'express'
import { dbGet, dbAll, dbRun } from '../db/init.js'
import { requireAdmin } from '../middleware/rbac.js'
import { restartAutoSync, getSyncStatus } from '../services/notion-sync.js'
import { Client as NotionClient } from '@notionhq/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
        const { notion_api_key, notion_database_id, notion_sync_interval } = req.body

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
        if (notion_database_id !== undefined) await upsert('notion_database_id', notion_database_id)
        if (notion_sync_interval !== undefined) await upsert('notion_sync_interval', String(notion_sync_interval))
        
        if (req.body.current_week !== undefined) {
            await upsert('current_week', String(req.body.current_week))
        }

        // Restart auto-sync with new settings
        restartAutoSync()

        res.json({ success: true, message: 'Settings updated.' })
    } catch (error) {
        console.error('Update settings error:', error)
        res.status(500).json({ success: false, message: 'Failed to update settings' })
    }
})

// --- ADD CELEBRATION POINT (Admin only) ---
router.post('/campuses', requireAdmin, async (req, res) => {
    try {
        const { campus } = req.body
        if (!campus || !campus.trim()) {
            return res.status(400).json({ success: false, message: 'Campus name is required' })
        }
        
        const newCampus = campus.trim()
        
        const serverPath = path.join(__dirname, '../constants/campuses.js')
        const clientPath = path.join(__dirname, '../../src/constants/campuses.js')
        
        for (const filePath of [serverPath, clientPath]) {
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8')
                // Basic insert before the last closing bracket
                if (!content.includes(`'${newCampus}'`) && !content.includes(`"${newCampus}"`)) {
                    content = content.replace(/\]\s*;/g, `,\n  '${newCampus}'\n];`)
                    fs.writeFileSync(filePath, content, 'utf8')
                }
            }
        }
        
        res.json({ success: true, message: 'Campus added successfully' })
    } catch (error) {
        console.error('Add campus error:', error)
        res.status(500).json({ success: false, message: 'Failed to add campus' })
    }
})

export default router
