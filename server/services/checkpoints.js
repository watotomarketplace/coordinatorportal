/**
 * Discernment Checkpoint Generation Service
 * 
 * Aggregates weekly reports for each formation group at checkpoint weeks (4, 8, 13).
 * Produces summaries of attendance trends, engagement patterns, recurring themes,
 * formation evidence, and pastoral concerns for pastoral review.
 */
import { dbGet, dbAll, dbRun } from '../db/init.js'

// Week ranges for each checkpoint
const CHECKPOINT_RANGES = {
    4: { start: 1, end: 4 },
    8: { start: 5, end: 8 },
    13: { start: 9, end: 13 }
}

/**
 * Calculate attendance trend from a series of reports
 */
async function calcAttendanceTrend(reports) {
    if (reports.length === 0) return 'No data'
    const counts = reports.filter(r => r.attendance_count != null).map(r => r.attendance_count)
    if (counts.length < 2) return counts.length === 1 ? `Steady at ${counts[0]}` : 'No data'

    const first = counts.slice(0, Math.ceil(counts.length / 2))
    const second = counts.slice(Math.ceil(counts.length / 2))
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length

    if (avgSecond > avgFirst * 1.1) return `Increasing (avg ${Math.round(avg)})`
    if (avgSecond < avgFirst * 0.9) return `Decreasing (avg ${Math.round(avg)})`
    return `Stable (avg ${Math.round(avg)})`
}

/**
 * Calculate engagement trend from reports
 */
async function calcEngagementTrend(reports) {
    const levels = reports.filter(r => r.engagement_level).map(r => r.engagement_level)
    if (levels.length === 0) return 'No data'

    const counts = { high: 0, medium: 0, low: 0 }
    levels.forEach(l => { if (counts[l] !== undefined) counts[l]++ })

    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    const total = levels.length
    const pct = Math.round((dominant[1] / total) * 100)

    return `${dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1)} (${pct}% of ${total} weeks)`
}

/**
 * Extract recurring themes from reports
 */
async function extractRecurringThemes(reports) {
    const themes = reports
        .filter(r => r.key_themes)
        .map(r => r.key_themes)
    if (themes.length === 0) return 'No themes reported'
    return themes.join(' | ')
}

/**
 * Aggregate formation evidence
 */
async function aggregateFormationEvidence(reports) {
    const evidence = reports
        .filter(r => r.formation_evidence)
        .map(r => `Week ${r.week_number}: ${r.formation_evidence}`)
    if (evidence.length === 0) return 'No formation evidence reported'
    return evidence.join('\n')
}

/**
 * Aggregate pastoral concerns
 */
async function aggregateConcerns(reports) {
    const concerns = reports
        .filter(r => r.pastoral_concerns)
        .map(r => `Week ${r.week_number}: ${r.pastoral_concerns}`)
    if (concerns.length === 0) return 'No concerns flagged'
    return concerns.join('\n')
}

/**
 * Generate a checkpoint for a single formation group
 */
export async function generateCheckpoint(groupId, checkpointWeek) {
    const range = CHECKPOINT_RANGES[checkpointWeek]
    if (!range) throw new Error(`Invalid checkpoint week: ${checkpointWeek}`)

    // Check if checkpoint already exists
    const existing = await dbGet(
        'SELECT id FROM discernment_checkpoints WHERE formation_group_id = ? AND checkpoint_week = ?',
        [groupId, checkpointWeek]
    )
    if (existing) {
        return { skipped: true, id: existing.id, message: 'Checkpoint already exists' }
    }

    // Fetch reports in the week range for this group
    const reports = await dbAll(`
        SELECT * FROM weekly_reports 
        WHERE formation_group_id = ? AND week_number >= ? AND week_number <= ?
        ORDER BY week_number ASC
    `, [groupId, range.start, range.end])

    // Get group info
    const group = await dbGet(`
        SELECT fg.*, u.name as facilitator_name 
        FROM formation_groups fg 
        LEFT JOIN users u ON fg.facilitator_user_id = u.id 
        WHERE fg.id = ?
    `, [groupId])

    // Build summary
    const attendanceTrend = calcAttendanceTrend(reports)
    const engagementTrend = calcEngagementTrend(reports)
    const recurringThemes = extractRecurringThemes(reports)
    const formationEvidence = aggregateFormationEvidence(reports)
    const concernsSummary = aggregateConcerns(reports)

    const summary = `Checkpoint for ${group?.name || 'Unknown Group'} (${group?.group_code || '?'}) — ` +
        `Weeks ${range.start}–${range.end}: ${reports.length} report(s) submitted. ` +
        `Attendance: ${attendanceTrend}. Engagement: ${engagementTrend}.`

    // Insert checkpoint
    const result = await dbRun(`
        INSERT INTO discernment_checkpoints (
            formation_group_id, checkpoint_week, summary,
            attendance_trend, engagement_trend, recurring_themes,
            formation_evidence_summary, concerns_summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        groupId, checkpointWeek, summary,
        attendanceTrend, engagementTrend, recurringThemes,
        formationEvidence, concernsSummary
    ])

    return { skipped: false, id: result.lastInsertRowid, summary }
}

/**
 * Generate checkpoints for ALL active formation groups at a given checkpoint week
 */
export async function generateAllCheckpoints(checkpointWeek) {
    const groups = await dbAll('SELECT id, group_code FROM formation_groups WHERE active = 1')
    const results = { generated: 0, skipped: 0, errors: 0, details: [] }

    for (const group of groups) {
        try {
            const result = await generateCheckpoint(group.id, checkpointWeek)
            if (result.skipped) {
                results.skipped++
            } else {
                results.generated++
            }
            results.details.push({ group_code: group.group_code, ...result })
        } catch (err) {
            results.errors++
            results.details.push({ group_code: group.group_code, error: err.message })
        }
    }

    return results
}
