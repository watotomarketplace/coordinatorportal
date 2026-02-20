/**
 * Thinkific Write-Back Service
 * 
 * Enables Tech Support to update participant data on Thinkific:
 * - Name changes (first_name, last_name) via PUT /users/{id}
 * - Password reset via the Thinkific API
 * 
 * All actions are audit-logged.
 */
import axios from 'axios'
import { dbRun, dbGet } from '../db/init.js'

function createClient() {
    return axios.create({
        baseURL: 'https://api.thinkific.com/api/public/v1',
        headers: {
            'X-Auth-API-Key': process.env.THINKIFIC_API_KEY,
            'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN,
            'Content-Type': 'application/json'
        },
        timeout: 15000
    })
}

/**
 * Update a participant's name on Thinkific
 * @param {number} thinkificUserId - Thinkific user ID
 * @param {object} nameData - { first_name, last_name }
 * @param {object} actor - { id, name, role } performing the action
 * @returns {object} { success, user, error }
 */
export async function updateUserName(thinkificUserId, nameData, actor) {
    const client = createClient()

    try {
        // Fetch current user data first (for audit trail)
        const currentRes = await client.get(`/users/${thinkificUserId}`)
        const currentUser = currentRes.data

        const updatePayload = {}
        if (nameData.first_name !== undefined) updatePayload.first_name = nameData.first_name
        if (nameData.last_name !== undefined) updatePayload.last_name = nameData.last_name

        const res = await client.put(`/users/${thinkificUserId}`, updatePayload)

        // Audit log
        await dbRun(`
            INSERT INTO audit_logs (user_id, user_name, role, action, target_type, target_id, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            actor.id,
            actor.name,
            actor.role,
            'thinkific_name_update',
            'student',
            thinkificUserId,
            JSON.stringify({
                actor_name: actor.name,
                actor_role: actor.role,
                previous: { first_name: currentUser.first_name, last_name: currentUser.last_name },
                updated: updatePayload,
                thinkific_email: currentUser.email
            })
        ])

        return {
            success: true,
            user: res.data,
            previous: { first_name: currentUser.first_name, last_name: currentUser.last_name }
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || error.message

        // Log failed attempt too
        await dbRun(`
            INSERT INTO audit_logs (user_id, user_name, role, action, target_type, target_id, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            actor.id,
            actor.name,
            actor.role,
            'thinkific_name_update_failed',
            'student',
            thinkificUserId,
            JSON.stringify({
                actor_name: actor.name,
                actor_role: actor.role,
                attempted: nameData,
                error: errMsg,
                status: error.response?.status,
                data: error.response?.data
            })
        ])

        return { success: false, error: errMsg }
    }
}

/**
 * Trigger password reset for a participant on Thinkific.
 * Thinkific API doesn't have a direct password reset endpoint,
 * so we use the "update user" endpoint to set a temporary password,
 * OR we can trigger the forgot-password flow.
 * 
 * Strategy: PUT /users/{id} with a generated temp password, then
 * email the user or show the temp password to Tech Support.
 */
export async function resetUserPassword(thinkificUserId, actor) {
    const client = createClient()

    try {
        // Fetch current user info
        const currentRes = await client.get(`/users/${thinkificUserId}`)
        const currentUser = currentRes.data

        // Generate a temporary password
        const tempPassword = generateTempPassword()

        // Update via Thinkific API
        await client.put(`/users/${thinkificUserId}`, {
            password: tempPassword,
            password_confirmation: tempPassword
        })

        // Audit log
        await dbRun(`
            INSERT INTO audit_logs (user_id, user_name, role, action, target_type, target_id, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            actor.id,
            actor.name,
            actor.role,
            'thinkific_password_reset',
            'student',
            thinkificUserId,
            JSON.stringify({
                actor_name: actor.name,
                actor_role: actor.role,
                thinkific_email: currentUser.email,
                student_name: `${currentUser.first_name} ${currentUser.last_name}`
            })
        ])

        return {
            success: true,
            tempPassword,
            email: currentUser.email,
            studentName: `${currentUser.first_name} ${currentUser.last_name}`
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || error.message

        await dbRun(`
            INSERT INTO audit_logs (user_id, user_name, role, action, target_type, target_id, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            actor.id,
            actor.name,
            actor.role,
            'thinkific_password_reset_failed',
            'student',
            thinkificUserId,
            JSON.stringify({
                actor_name: actor.name,
                actor_role: actor.role,
                error: errMsg
            })
        ])

        return { success: false, error: errMsg }
    }
}

/**
 * Generate a secure temporary password
 */
async function generateTempPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
    let password = ''
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

/**
 * Look up a Thinkific user by ID
 */
export async function getThinkificUser(thinkificUserId) {
    const client = createClient()
    try {
        const res = await client.get(`/users/${thinkificUserId}`)
        return { success: true, user: res.data }
    } catch (error) {
        return { success: false, error: error.response?.data?.message || error.message }
    }
}
