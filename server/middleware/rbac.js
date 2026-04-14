/**
 * RBAC Middleware — WL101 Portal (PRD v2)
 * 
 * Centralised role-based access control for all API routes.
 */

import { CELEBRATION_POINTS } from '../constants/campuses.js'

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

function requireCanImport(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!userHasAnyRole(req.session.user, ['Admin', 'Coordinator'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
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
    requireAuth, 
    requireAdmin, 
    requireAdminOrLeadership, 
    requireAdminOrTechSupport, 
    requireCanImport, 
    applyCampusScope 
}
