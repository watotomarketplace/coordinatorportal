/**
 * RBAC Middleware — WL101 Portal (PRD v2)
 * 
 * Centralised role-based access control for all API routes.
 * Replaces scattered inline middleware across route files.
 * 
 * Roles (ordered by scope):
 *   Admin            → Global, full write
 *   LeadershipTeam   → Global read, no config/write-back
 *   Pastor           → Campus-scoped + global dashboard read
 *   Coordinator      → Campus-scoped
 *   TechSupport      → Campus-scoped + Facilitator account mgmt + Thinkific write-back
 *   Facilitator      → Group-scoped (Phase 2+)
 */

// --- Constants ---

// Roles that are scoped to a single campus (celebration_point)
const CAMPUS_SCOPED_ROLES = ['Pastor', 'Coordinator', 'TechSupport', 'CoFacilitator', 'Facilitator']

// Roles with global (all-campus) visibility
const GLOBAL_ROLES = ['Admin', 'LeadershipTeam']

// --- Helpers ---

/** Parse user roles from session (supports both single role and roles array) */
function getUserRoles(user) {
    if (user.roles && Array.isArray(user.roles)) return user.roles
    if (user.roles && typeof user.roles === 'string') return user.roles.split(',').map(r => r.trim())
    return [user.role]
}

/** Returns all roles this user holds (primary + secondary_roles) */
function userRoles(user) {
    if (!user) return []
    const primary = getUserRoles(user)
    try {
        const secondary = JSON.parse(user.secondary_roles || '[]')
        const combined = [...new Set([...primary, ...secondary])]
        return combined
    } catch { return primary }
}

/** Check if user has a specific role (checks primary, roles, AND secondary_roles) */
function userHasRole(user, role) {
    return userRoles(user).includes(role)
}

/** Check if user has ANY of the specified roles */
function userHasAnyRole(user, roleList) {
    return userRoles(user).some(r => roleList.includes(r))
}

// --- Core Middleware ---

/** Reject unauthenticated requests */
export function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    next()
}

/** Only System Administrator */
export function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    if (!userHasRole(req.session.user, 'Admin')) {
        return res.status(403).json({ success: false, message: 'Admin access required' })
    }
    next()
}

/** Admin or LeadershipTeam — global read access (audit logs, global dashboard) */
export function requireAdminOrLeadership(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    if (!userHasAnyRole(req.session.user, ['Admin', 'LeadershipTeam'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

/** Admin or TechSupport — Thinkific write-back, participant detail edits */
export function requireAdminOrTechSupport(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    if (!userHasAnyRole(req.session.user, ['Admin', 'TechSupport'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

/** Admin or Coordinator — CSV import tool */
export function requireCanImport(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    if (!userHasAnyRole(req.session.user, ['Admin', 'Coordinator'])) {
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
}

/**
 * Campus scope enforcement.
 * Reads `celebration_point` from query/body and enforces that campus-scoped
 * roles can only access their own campus. Sets `req.scopedCelebrationPoint`
 * for downstream use.
 *
 * For global roles (Admin, LeadershipTeam): no restriction, passes through
 * whatever the client requested (or empty for "all").
 *
 * For campus-scoped roles: overrides the requested campus with the user's
 * assigned campus and rejects cross-campus requests with 403.
 */
export function applyCampusScope(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    const roles = getUserRoles(req.session.user)
    const requestedCampus = req.query.celebration_point || req.body?.celebration_point || ''

    // If the user has ANY global role, grant global access
    const hasGlobalRole = roles.some(r => GLOBAL_ROLES.includes(r))

    if (hasGlobalRole) {
        // Global roles can filter by any campus or see all
        req.scopedCelebrationPoint = requestedCampus
    } else if (roles.some(r => CAMPUS_SCOPED_ROLES.includes(r))) {
        // Campus-scoped roles are locked to their assignment
        if (requestedCampus && requestedCampus !== req.session.user.celebration_point) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Access restricted to your assigned Campus.'
            })
        }
        req.scopedCelebrationPoint = req.session.user.celebration_point
    } else {
        // Unknown role — deny
        return res.status(403).json({ success: false, message: 'Unknown role' })
    }

    next()
}

export { CAMPUS_SCOPED_ROLES, GLOBAL_ROLES, getUserRoles, userRoles, userHasRole, userHasAnyRole }
