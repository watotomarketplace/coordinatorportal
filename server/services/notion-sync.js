/**
 * Notion Sync Service — Syncs weekly reports from a Notion database into SQLite.
 * 
 * Designed to work when Notion credentials are configured via Admin Settings UI.
 * Gracefully degrades when no credentials are available.
 */
import { dbGet, dbAll, dbRun } from '../db/init.js'

// --- State ---
let syncInterval = null
let lastSyncStatus = {
    lastSyncTime: null,
    status: 'idle',       // 'idle' | 'syncing' | 'success' | 'error' | 'disabled'
    message: '',
    recordsSynced: 0
}

// --- Helpers ---
async function getNotionConfig() {
    const apiKey = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_api_key'")
    const dbId = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_db_id'")
    const interval = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_sync_interval'")

    if (!apiKey?.value || !dbId?.value) return null

    return {
        apiKey: apiKey.value,
        databaseId: dbId.value,
        syncIntervalMinutes: parseInt(interval?.value || '15', 10)
    }
}

// --- Map Notion properties to weekly_reports columns ---
async function mapNotionPageToReport(page) {
    const props = page.properties || {}

    // Helper to extract property values (supports various Notion property types)
    const getText = (prop) => {
        if (!prop) return null
        if (prop.type === 'rich_text') return prop.rich_text?.map(t => t.plain_text).join('') || null
        if (prop.type === 'title') return prop.title?.map(t => t.plain_text).join('') || null
        if (prop.type === 'url') return prop.url || null
        return null
    }
    const getNumber = (prop) => {
        if (!prop) return null
        if (prop.type === 'number') return prop.number
        return null
    }
    const getSelect = (prop) => {
        if (!prop) return null
        if (prop.type === 'select') return prop.select?.name || null
        return null
    }
    const getDate = (prop) => {
        if (!prop) return null
        if (prop.type === 'date') return prop.date?.start || null
        return null
    }

    return {
        notion_page_id: page.id,
        group_code: getText(props['Group Code']) || getText(props['group_code']),
        week_number: getNumber(props['Week Number']) || getNumber(props['week_number']) || getNumber(props['Week']),
        module_number: getNumber(props['Module Number']) || getNumber(props['module_number']) || getNumber(props['Module']),
        lesson_number: getNumber(props['Lesson Number']) || getNumber(props['lesson_number']) || getNumber(props['Lesson']),
        attendance_count: getNumber(props['Attendance']) || getNumber(props['attendance_count']),
        engagement_level: (getSelect(props['Engagement Level']) || getSelect(props['engagement_level']) || '').toLowerCase() || null,
        key_themes: getText(props['Key Themes']) || getText(props['key_themes']),
        formation_evidence: getText(props['Formation Evidence']) || getText(props['formation_evidence']),
        pastoral_concerns: getText(props['Pastoral Concerns']) || getText(props['pastoral_concerns']),
        questions_to_escalate: getText(props['Questions to Escalate']) || getText(props['questions_to_escalate']),
        session_adjustments: getText(props['Session Adjustments']) || getText(props['session_adjustments']),
        submitted_at: getDate(props['Submitted']) || getDate(props['submitted_at']) || page.created_time
    }
}

// --- Core Sync Function ---
export async function syncWeeklyReports() {
    const config = getNotionConfig()
    if (!config) {
        lastSyncStatus = { lastSyncTime: null, status: 'disabled', message: 'Notion credentials not configured', recordsSynced: 0 }
        return lastSyncStatus
    }

    lastSyncStatus.status = 'syncing'
    lastSyncStatus.message = 'Sync in progress...'

    try {
        // Dynamic import — only loads when actually syncing
        const { Client } = await import('@notionhq/client')
        const notion = new Client({ auth: config.apiKey })

        // Build filter: incremental sync using last sync time
        const filter = {}
        if (lastSyncStatus.lastSyncTime) {
            filter.filter = {
                timestamp: 'last_edited_time',
                last_edited_time: { after: lastSyncStatus.lastSyncTime }
            }
        }

        // Paginated query
        let allPages = []
        let hasMore = true
        let startCursor = undefined

        while (hasMore) {
            const response = await notion.databases.query({
                database_id: config.databaseId,
                start_cursor: startCursor,
                page_size: 100,
                ...filter
            })
            allPages.push(...response.results)
            hasMore = response.has_more
            startCursor = response.next_cursor
        }

        let synced = 0
        for (const page of allPages) {
            try {
                const report = mapNotionPageToReport(page)

                // Resolve formation_group_id from group_code
                let groupId = null
                if (report.group_code) {
                    const group = await dbGet('SELECT id FROM formation_groups WHERE group_code = ?', [report.group_code])
                    groupId = group?.id || null
                }

                if (!groupId) {
                    console.warn(`⚠️ Notion sync: Could not resolve group for page ${page.id} (code: ${report.group_code})`)
                    continue
                }

                // Resolve facilitator from formation_group
                const group = await dbGet('SELECT facilitator_user_id FROM formation_groups WHERE id = ?', [groupId])

                // Validate engagement_level
                const validEngagement = ['high', 'medium', 'low'].includes(report.engagement_level) ? report.engagement_level : null

                // Upsert by notion_page_id
                const existing = await dbGet('SELECT id FROM weekly_reports WHERE notion_page_id = ?', [report.notion_page_id])
                if (existing) {
                    await dbRun(`UPDATE weekly_reports SET
                        formation_group_id = ?, facilitator_user_id = ?, week_number = ?,
                        module_number = ?, lesson_number = ?, attendance_count = ?,
                        engagement_level = ?, key_themes = ?, formation_evidence = ?,
                        pastoral_concerns = ?, questions_to_escalate = ?, session_adjustments = ?,
                        submitted_at = ?, synced_at = CURRENT_TIMESTAMP
                        WHERE notion_page_id = ?`, [
                        groupId, group?.facilitator_user_id, report.week_number,
                        report.module_number, report.lesson_number, report.attendance_count,
                        validEngagement, report.key_themes, report.formation_evidence,
                        report.pastoral_concerns, report.questions_to_escalate, report.session_adjustments,
                        report.submitted_at, report.notion_page_id
                    ])
                } else {
                    await dbRun(`INSERT INTO weekly_reports (
                        formation_group_id, facilitator_user_id, week_number,
                        module_number, lesson_number, attendance_count,
                        engagement_level, key_themes, formation_evidence,
                        pastoral_concerns, questions_to_escalate, session_adjustments,
                        notion_page_id, submitted_at, synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [
                        groupId, group?.facilitator_user_id, report.week_number,
                        report.module_number, report.lesson_number, report.attendance_count,
                        validEngagement, report.key_themes, report.formation_evidence,
                        report.pastoral_concerns, report.questions_to_escalate, report.session_adjustments,
                        report.notion_page_id, report.submitted_at
                    ])
                }
                synced++
            } catch (pageErr) {
                console.error(`❌ Notion sync: Error processing page ${page.id}:`, pageErr.message)
            }
        }

        lastSyncStatus = {
            lastSyncTime: new Date().toISOString(),
            status: 'success',
            message: `Synced ${synced} report(s) from ${allPages.length} Notion page(s)`,
            recordsSynced: synced
        }
        console.log(`✅ Notion sync complete: ${lastSyncStatus.message}`)
    } catch (error) {
        // Handle rate limiting
        if (error.status === 429) {
            const retryAfter = error.headers?.['retry-after'] || 30
            lastSyncStatus = {
                lastSyncTime: lastSyncStatus.lastSyncTime,
                status: 'error',
                message: `Rate limited. Retrying after ${retryAfter}s`,
                recordsSynced: 0
            }
            console.warn(`⚠️ Notion rate limited. Retry after ${retryAfter}s`)
        } else {
            lastSyncStatus = {
                lastSyncTime: lastSyncStatus.lastSyncTime,
                status: 'error',
                message: error.message || 'Unknown error during sync',
                recordsSynced: 0
            }
            console.error('❌ Notion sync error:', error.message)
        }
    }

    return lastSyncStatus
}

// --- Auto-sync management ---
export async function startAutoSync() {
    const config = getNotionConfig()
    if (!config) {
        console.log('ℹ️ Notion sync disabled — credentials not configured')
        lastSyncStatus = { lastSyncTime: null, status: 'disabled', message: 'Notion credentials not configured', recordsSynced: 0 }
        return
    }

    stopAutoSync()
    const intervalMs = config.syncIntervalMinutes * 60 * 1000
    console.log(`🔄 Notion auto-sync started (every ${config.syncIntervalMinutes} minutes)`)

    // Initial sync
    syncWeeklyReports()

    syncInterval = setInterval(() => {
        syncWeeklyReports()
    }, intervalMs)
}

export async function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval)
        syncInterval = null
    }
}

export async function restartAutoSync() {
    stopAutoSync()
    startAutoSync()
}

export async function getSyncStatus() {
    const config = getNotionConfig()
    return {
        ...lastSyncStatus,
        configured: !!config,
        syncIntervalMinutes: config?.syncIntervalMinutes || 15
    }
}
