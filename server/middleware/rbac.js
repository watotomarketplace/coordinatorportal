/**
 * RBAC Middleware — WL101 Portal (PRD v2)
 * 
 * Centralised role-based access control for all API routes.
 */

import { CELEBRATION_POINTS } from '../constants/campuses.js'
import { dbAll } from '../db/init.js'

// --- Constants ---
const CAMPUS_SCOPED_ROLES = ['Pastor', 'Coordinator', 'TechSupport', 'CoFacilitator', 'Facilitator']
const GLOBAL_ROLES = ['Admin', 'LeadershipTeam']

// --- Helpers ---
function getUserRoles(user) {
    if (user.roles && Array.isArray(user.roles)) return user.roles
    if (user.roles && typeof user.roles === 'string') return user.roles.split(',').map(r => r.trim())
    return [user.role]
}

function userRoles(user) {
    if (!user) return []
    const primary = getUserRoles(user)
    try {
        const secondary = JSON.parse(user.secondary_roles || '[]')
        const combined = [...new Set([...primary, ...secondary])]
        return combined
    } catch { return primary }
}

function userHasRole(user, role) {
    return userRoles(user).includes(role)
}

function userHasAnyRole(user, roleList) {
    return userRoles(user).some(r => roleList.includes(r))
}

// Returns the roles an actor may assign when creating or editing users.
function getAllowedTargetRoles(actor) {
    const roles = userRoles(actor)
    if (roles.includes('Admin')) return ['Admin', 'LeadershipTeam', 'Pastor', 'Coordinator', 'TechSupport', 'CoFacilitator', 'Facilitator']
    if (roles.includes('Pastor')) return ['Coordinator', 'Facilitator', 'CoFacilitator']
    if (roles.some(r => ['TechSupport', 'Coordinator'].includes(r))) return ['Facilitator', 'CoFacilitator']
    return []
}

function canManageUser(actor, targetRole) {
    return getAllowedTargetRoles(actor).includes(targetRole)
}

// --- Middleware ---
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    next()
}

function requireAdmin(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!userHasRole(req.session.user, 'Admin')) {
        return res.status(403).json({ success: false, message: 'Admin access required' })
    }
    next()
}

function requireAdminOrLeadership(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!userHasAnyRole(req.session.user, ['Admin', 'LeadershipTeam'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

function requireAdminOrTechSupport(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!userHasAnyRole(req.session.user, ['Admin', 'TechSupport'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

// Admin, TechSupport, Coordinator, Pastor — can create/edit formation groups (campus-scoped enforced in handler)
function requireGroupManager(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!userHasAnyRole(req.session.user, ['Admin', 'TechSupport', 'Coordinator', 'Pastor'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

function requireCanImport(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!userHasAnyRole(req.session.user, ['Admin', 'Coordinator'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

// Admin, LeadershipTeam, Coordinator, Pastor — can review/approve graduation
// verifications. Facilitator group-ownership is enforced separately in-handler.
function requireGraduationApprover(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!userHasAnyRole(req.session.user, ['Admin', 'LeadershipTeam', 'Coordinator', 'Pastor'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

// Admin, Coordinator — may pass/fail a Thinkific submission (fires the irreversible
// approve/reject write-back). Narrower than requireGraduationApprover on purpose.
function requireSubmissionReviewer(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!userHasAnyRole(req.session.user, ['Admin', 'Coordinator'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

// ─── Facilitator group scope ───────────────────────────────────────────────
// PRD §3: a Facilitator/CoFacilitator's real scope is their GROUP(S), not their
// campus. Returns the group ids they lead: formation_groups.facilitator_user_id
// / co_facilitator_user_id, unioned with users.assigned_groups (JSON array).
async function resolveFacilitatorGroupIds(user) {
    if (!user) return []
    const ids = new Set()
    try {
        const rows = await dbAll(
            'SELECT id FROM formation_groups WHERE facilitator_user_id = ? OR co_facilitator_user_id = ?',
            [user.id, user.id]
        )
        for (const r of rows) if (r?.id != null) ids.add(Number(r.id))
    } catch (e) {
        console.warn('[rbac] resolveFacilitatorGroupIds query failed:', e.message)
    }
    try {
        const assigned = typeof user.assigned_groups === 'string'
            ? JSON.parse(user.assigned_groups || '[]')
            : (user.assigned_groups || [])
        for (const g of assigned) {
            const n = Number(g)
            if (Number.isFinite(n)) ids.add(n)
        }
    } catch (_) {}
    return [...ids]
}

// Sets req.scopedGroupIds for Facilitator/CoFacilitator (an array, possibly
// empty), and null for every other role. Does NOT change campus scoping.
async function applyFacilitatorGroupScope(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    const user = req.session.user
    if (userHasAnyRole(user, ['Facilitator', 'CoFacilitator']) && !userHasAnyRole(user, GLOBAL_ROLES)) {
        req.scopedGroupIds = await resolveFacilitatorGroupIds(user)
    } else {
        req.scopedGroupIds = null
    }
    next()
}

// True when this request must be limited to the user's own group roster.
function isGroupScoped(req) {
    return Array.isArray(req.scopedGroupIds)
}

function applyCampusScope(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })

    const user = req.session.user
    const hasGlobalRole = userHasAnyRole(user, GLOBAL_ROLES)
    const requestedCampus = req.query.campus || req.query.celebration_point || req.body?.celebration_point || ''

    if (hasGlobalRole) {
        if (requestedCampus && CELEBRATION_POINTS.includes(requestedCampus)) {
            req.scopedCelebrationPoint = requestedCampus
        } else {
            req.scopedCelebrationPoint = null
        }
    } else if (userHasAnyRole(user, CAMPUS_SCOPED_ROLES)) {
        if (requestedCampus && requestedCampus !== user.celebration_point) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Access restricted to your assigned Campus.'
            })
        }
        req.scopedCelebrationPoint = user.celebration_point
    } else {
        return res.status(403).json({ success: false, message: 'Unknown role' })
    }

    next()
}

export {
    CAMPUS_SCOPED_ROLES,
    GLOBAL_ROLES,
    getUserRoles,
    userRoles,
    userHasRole,
    userHasAnyRole,
    getAllowedTargetRoles,
    canManageUser,
    requireAuth,
    requireAdmin,
    requireAdminOrLeadership,
    requireAdminOrTechSupport,
    requireGroupManager,
    requireCanImport,
    requireGraduationApprover,
    requireSubmissionReviewer,
    applyCampusScope,
    resolveFacilitatorGroupIds,
    applyFacilitatorGroupScope,
    isGroupScoped
}
