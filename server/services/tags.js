import { dbRun, dbAll, IS_POSTGRES } from '../db/init.js'

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
    const sql = IS_POSTGRES
        ? `INSERT INTO student_tags (student_id, tag_name, color, created_by)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (student_id, tag_name) DO NOTHING`
        : `INSERT OR IGNORE INTO student_tags (student_id, tag_name, color, created_by)
           VALUES (?, ?, ?, ?)`
    
    return await dbRun(sql, [studentId, tagName, color, createdBy])
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
