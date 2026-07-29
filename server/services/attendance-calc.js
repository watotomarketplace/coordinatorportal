/**
 * Shared attendance calculation — the ONE definition of "sessions attended".
 *
 * WHY THIS EXISTS
 * The graduation roster used to count DISTINCT group_sessions.week_number while
 * the Attendance / Formation-Groups pages counted sessions attended. Because
 * week_number is unreliable in production (many sessions carry the same label,
 * e.g. several all marked "Wk 1"), DISTINCT collapsed them and silently
 * discarded attendance: a participant present at all 16 sessions whose sessions
 * carried only weeks {1, 15, 16} scored 3/16 and failed the 13/16 criterion.
 *
 * We therefore count DISTINCT SESSIONS attended (gs.id), excluding sessions
 * flagged did_not_meet = 1, and cap the result at total_weeks so a group that
 * met more often than the programme length can never display 17/16.
 *
 * TRADE-OFF (deliberate): if a group genuinely met twice in one calendar week,
 * session-counting credits both meetings. That is far safer than the previous
 * behaviour, which discarded ~13 weeks of attendance for everyone.
 *
 * TODO(WL101): week-based counting can return once group_sessions.week_number
 * is trustworthy. week_number is NOT repaired here — that is a data decision.
 */
import { dbAll, IS_POSTGRES } from '../db/init.js'

export const TOTAL_WEEKS = 16
export const REQUIRED_WEEKS = 13

// SQLite spells the scalar minimum MIN(a,b); Postgres spells it LEAST(a,b).
export const capExpr = (expr, n) => IS_POSTGRES ? `LEAST(${expr}, ${n})` : `MIN(${expr}, ${n})`

/** Clamp an attendance count into 0..cap. */
export function capAttendance(value, cap = TOTAL_WEEKS) {
    const n = Number(value) || 0
    return Math.max(0, Math.min(cap, n))
}

/**
 * Sessions attended per participant for one group, keyed by
 * group_members.student_thinkific_id.
 *
 * @returns {Promise<Map<string, number>>} student_thinkific_id → capped count
 */
export async function getAttendedSessionsByGroup(groupId, cap = TOTAL_WEEKS) {
    const rows = await dbAll(
        `SELECT gm.student_thinkific_id AS sid,
                COUNT(DISTINCT CASE WHEN sa.attended = 1 AND gs.did_not_meet = 0
                                    THEN gs.id END) AS attended_sessions
         FROM group_members gm
         LEFT JOIN session_attendance sa ON sa.group_member_id = gm.id
         LEFT JOIN group_sessions   gs ON gs.id = sa.session_id
         WHERE gm.formation_group_id = ? AND gm.active = 1
         GROUP BY gm.student_thinkific_id`,
        [groupId]
    )
    const map = new Map()
    for (const r of rows) {
        map.set(String(r.sid ?? '').trim(), capAttendance(r.attended_sessions, cap))
    }
    return map
}

/** Total sessions the group actually held (excludes did_not_meet). */
export async function getHeldSessionCount(groupId) {
    const rows = await dbAll(
        'SELECT COUNT(*) AS n FROM group_sessions WHERE formation_group_id = ? AND did_not_meet = 0',
        [groupId]
    )
    return parseInt(rows?.[0]?.n ?? 0, 10)
}
