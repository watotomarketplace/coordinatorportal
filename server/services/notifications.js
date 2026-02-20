
import { dbRun, dbAll, dbGet } from '../db/init.js'

/**
 * createNotification
 * Adds a notification to a specific user's inbox.
 * Resolves username from user_id so the route (which queries by username) can find it.
 */
export async function createNotification(userId, title, message, type = 'system') {
    const user = await dbGet('SELECT username FROM users WHERE id = ?', [userId])
    const username = user ? user.username : null

    return await dbRun(`
        INSERT INTO notifications (user_id, username, type, title, message, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `, [userId, username, type, title, message])
}

/**
 * notifyOverdueReports
 * Checks for groups that have NOT submitted a report for the previous week.
 */
export async function notifyOverdueReports() {
    console.log('🔔 Checking for overdue weekly reports...')

    const currentWeekSetting = await dbGet("SELECT value FROM system_settings WHERE key = 'current_week'")
    if (!currentWeekSetting) {
        console.warn('⚠️ Cannot check overdue reports: "current_week" setting not found.')
        return 0
    }

    const currentWeek = parseInt(currentWeekSetting.value, 10)
    if (isNaN(currentWeek) || currentWeek <= 1) return 0

    const targetWeek = currentWeek - 1

    const overdueGroups = await dbAll(`
        SELECT fg.id, fg.name, fg.group_code, fg.facilitator_user_id, u.name as facilitator_name
        FROM formation_groups fg
        LEFT JOIN users u ON fg.facilitator_user_id = u.id
        WHERE fg.active = 1
        AND NOT EXISTS (
            SELECT 1 FROM weekly_reports wr 
            WHERE wr.formation_group_id = fg.id 
            AND wr.week_number = ?
        )
    `, [targetWeek])

    console.log(`🔎 Found ${overdueGroups.length} groups missing reports for Week ${targetWeek}`)

    let notificationsSent = 0

    for (const group of overdueGroups) {
        if (!group.facilitator_user_id) continue
        try {
            createNotification(
                group.facilitator_user_id,
                'Overdue Weekly Report',
                `Reminder: The report for ${group.name} (Week ${targetWeek}) is overdue. Please submit it via Notion or the Dashboard.`,
                'alert'
            )
            notificationsSent++
        } catch (err) {
            console.error(`Failed to notify ${group.facilitator_name}:`, err)
        }
    }

    return notificationsSent
}

/**
 * notifyCheckpointReady
 * Notifies facilitators and coordinators when new checkpoints are generated.
 */
export async function notifyCheckpointReady(weekNumber, generatedCount) {
    if (generatedCount <= 0) return 0

    let sent = 0

    // Notify facilitators who have active groups
    const facilitators = await dbAll(`
        SELECT DISTINCT u.id, u.name
        FROM users u
        JOIN formation_groups fg ON fg.facilitator_user_id = u.id
        WHERE fg.active = 1 AND u.active = 1
    `)

    for (const f of facilitators) {
        try {
            createNotification(
                f.id,
                'Checkpoint Ready',
                `Discernment checkpoints for Week ${weekNumber} are now available. Please review your students' progress.`,
                'info'
            )
            sent++
        } catch (err) {
            console.error(`Failed to notify facilitator ${f.name}:`, err)
        }
    }

    // Notify coordinators and admins
    const coordinators = await dbAll(`
        SELECT id, name FROM users
        WHERE role IN ('Coordinator', 'Admin') AND active = 1
    `)

    for (const c of coordinators) {
        try {
            createNotification(
                c.id,
                'Checkpoints Generated',
                `${generatedCount} new discernment checkpoints generated for Week ${weekNumber}.`,
                'system'
            )
            sent++
        } catch (err) {
            console.error(`Failed to notify coordinator ${c.name}:`, err)
        }
    }

    return sent
}
