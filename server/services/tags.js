import { getDatabase } from '../db/init.js'

async function dbAll(sql, params = []) {
    const db = getDatabase()
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    return results
}

async function dbRun(sql, params = []) {
    const db = getDatabase()
    db.run(sql, params)
    return { lastInsertRowId: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] }
}

// Predefined tag colors (macOS Finder-style)
export const TAG_COLORS = {
    red: '#ff3b30',
    orange: '#ff9500',
    yellow: '#ffcc00',
    green: '#34c759',
    blue: '#007aff',
    purple: '#af52de',
    gray: '#8e8e93'
}

/**
 * Get all tags for a specific student
 */
export async function getStudentTags(studentId) {
    return await dbAll(`
        SELECT * FROM student_tags
        WHERE student_id = ?
        ORDER BY created_at DESC
    `, [studentId])
}

/**
 * Get all tags across all students (for filter dropdowns)
 */
export async function getAllTags() {
    return await dbAll(`
        SELECT tag_name, color, COUNT(*) as count
        FROM student_tags
        GROUP BY tag_name, color
        ORDER BY count DESC
    `)
}

/**
 * Add a tag to a student
 */
export async function addTag(studentId, tagName, color = '#007aff', createdBy = null) {
    return await dbRun(`
        INSERT OR IGNORE INTO student_tags (student_id, tag_name, color, created_by)
        VALUES (?, ?, ?, ?)
    `, [studentId, tagName, color, createdBy])
}

/**
 * Remove a tag from a student
 */
export async function removeTag(id) {
    return await dbRun(`DELETE FROM student_tags WHERE id = ?`, [id])
}

/**
 * Remove a tag by student_id and tag_name
 */
export async function removeTagByName(studentId, tagName) {
    return await dbRun(`DELETE FROM student_tags WHERE student_id = ? AND tag_name = ?`, [studentId, tagName])
}

/**
 * Get students by tag name (for smart folders)
 */
export async function getStudentsByTag(tagName) {
    return (await dbAll(`
        SELECT DISTINCT st.student_id
        FROM student_tags st
        WHERE st.tag_name = ?
    `, [tagName])).map(r => r.student_id)
}
