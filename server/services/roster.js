/**
 * Group roster resolution.
 *
 * Turns a set of formation group ids into resolved student records, using the
 * single shared resolver in thinkific.js. Used by the Dashboard and Students
 * read paths so a Facilitator/CoFacilitator sees exactly their group's members
 * — never their whole campus, and never everyone.
 *
 * The roster lives in formation_group_members; group_members (attendance) is
 * auto-synced from it. We read both and de-duplicate so a member recorded in
 * only one table is still found. Both are the facilitator's own group, so this
 * widens nothing.
 */
import { dbAll } from '../db/init.js'
import { resolveStudents } from './thinkific.js'

// Distinct member ids across both roster tables for the given group ids.
export async function getGroupMemberIds(groupIds) {
    const ids = (groupIds || []).map(Number).filter(Number.isFinite)
    if (!ids.length) return []
    const placeholders = ids.map(() => '?').join(',')
    const out = new Set()

    try {
        const rows = await dbAll(
            `SELECT student_id AS sid FROM formation_group_members WHERE formation_group_id IN (${placeholders})`,
            ids
        )
        for (const r of rows) if (r?.sid != null) out.add(String(r.sid).trim())
    } catch (e) {
        console.warn('[roster] formation_group_members lookup failed:', e.message)
    }

    try {
        const rows = await dbAll(
            `SELECT student_thinkific_id AS sid FROM group_members WHERE formation_group_id IN (${placeholders}) AND active = 1`,
            ids
        )
        for (const r of rows) if (r?.sid != null) out.add(String(r.sid).trim())
    } catch (e) {
        console.warn('[roster] group_members lookup failed:', e.message)
    }

    return [...out].filter(Boolean)
}

/**
 * Resolved student records for the given group ids.
 * An empty roster returns [] — callers must render an honest empty state and
 * must NOT fall back to campus-wide or global student lists.
 */
export async function getGroupRosterStudents(groupIds, context = 'group-scope') {
    const ids = await getGroupMemberIds(groupIds)
    if (!ids.length) return []
    return resolveStudents(ids, context)
}
