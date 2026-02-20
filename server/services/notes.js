import { dbRun, dbAll } from '../db/init.js'

export async function getNotes(studentId) {
    return await dbAll(`
        SELECT * FROM notes 
        WHERE student_id = ? 
        ORDER BY created_at DESC
    `, [studentId])
}

export async function addNote(studentId, authorName, celebrationPoint, content, authorRole = null, noteType = 'coordinator') {
    return await dbRun(`
        INSERT INTO notes (student_id, author_name, celebration_point, content, author_role, note_type)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [studentId, authorName, celebrationPoint, content, authorRole, noteType])
}

export async function getNotesByCelebrationPoint(celebrationPoint) {
    return await dbAll(`
        SELECT * FROM notes 
        WHERE celebration_point = ? 
        ORDER BY created_at DESC
    `, [celebrationPoint])
}

export async function getGroupNotes(groupId) {
    return await dbAll(`
        SELECT * FROM notes 
        WHERE group_id = ? 
        ORDER BY created_at DESC
    `, [groupId])
}

export async function addGroupNote(groupId, authorName, celebrationPoint, content, authorRole = null, noteType = 'coordinator') {
    return await dbRun(`
        INSERT INTO notes (group_id, author_name, celebration_point, content, author_role, note_type)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [groupId, authorName, celebrationPoint, content, authorRole, noteType])
}
