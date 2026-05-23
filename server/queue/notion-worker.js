import { Worker } from 'bullmq'
import { dbGet, dbRun, IS_POSTGRES } from '../db/init.js'
import { Client as NotionClient } from '@notionhq/client'

async function getNotionClient() {
    const apiKeyRow = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_api_key'")
    const apiKey = apiKeyRow?.value || process.env.NOTION_API_KEY
    if (!apiKey) throw new Error('Notion API key not configured')
    return new NotionClient({ auth: apiKey })
}

async function getNotionDatabaseId() {
    const row = await dbGet("SELECT value FROM system_settings WHERE key = 'notion_database_id'")
    const id = row?.value || process.env.NOTION_DB_ID
    if (!id) throw new Error('Notion database ID not configured')
    return id
}

async function handleNotionCreate(reportId) {
    const report = await dbGet('SELECT wr.*, fg.group_code, fg.celebration_point FROM weekly_reports wr LEFT JOIN formation_groups fg ON fg.id = wr.formation_group_id WHERE wr.id = ?', [reportId])
    if (!report) throw new Error(`Report ${reportId} not found`)

    if (report.notion_page_id) {
        console.log(`[notion-worker] Report ${reportId} already has Notion page ${report.notion_page_id} — skipping`)
        return
    }

    const notion = await getNotionClient()
    const databaseId = await getNotionDatabaseId()

    // Build the page body from report fields
    const bodyParts = []
    if (report.summary) bodyParts.push(`Summary: ${report.summary}`)
    if (report.highlights) bodyParts.push(`Highlights: ${report.highlights}`)
    if (report.prayer_requests) bodyParts.push(`Prayer Requests: ${report.prayer_requests}`)
    if (report.pastoral_concerns) bodyParts.push(`Pastoral Concerns: ${report.pastoral_concerns}`)
    if (bodyParts.length === 0) bodyParts.push('Submitted via WL101 Coordinator Portal')

    const children = bodyParts.map(text => ({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: text.substring(0, 2000) } }] }
    }))

    const page = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
            Name: { title: [{ text: { content: `${report.group_code || 'Unknown Group'} — Week ${report.week_number}` } }] }
        },
        children
    })

    const sql = IS_POSTGRES
        ? 'UPDATE weekly_reports SET notion_page_id=$1 WHERE id=$2'
        : 'UPDATE weekly_reports SET notion_page_id=? WHERE id=?'
    await dbRun(sql, [page.id, reportId])

    console.log(`✅ [notion-worker] Created Notion page ${page.id} for report ${reportId}`)
}

export function startNotionWorker() {
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) return null

    const connection = process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: null
    }

    const worker = new Worker('portal-queue', async (job) => {
        if (job.name !== 'notion-create') return
        await handleNotionCreate(job.data.reportId)
    }, {
        connection,
        concurrency: 2
    })

    worker.on('failed', (job, err) => {
        console.error(`[notion-worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message)
    })

    return worker
}
