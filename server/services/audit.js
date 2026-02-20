import { dbRun, dbAll } from '../db/init.js'

export async function logAudit(user_name, role, action, details) {
    try {
        await dbRun(`
            INSERT INTO audit_logs (user_name, role, action, details)
            VALUES (?, ?, ?, ?)
        `, [user_name, role, action, details])
    } catch (error) {
        console.error('Audit Log Error:', error)
    }
}

export async function getAuditLogs(limit = 100) {
    return await dbAll(`
        SELECT * FROM audit_logs 
        ORDER BY timestamp DESC 
        LIMIT ?
    `, [limit])
}
