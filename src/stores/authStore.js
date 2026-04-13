import { create } from 'zustand'
import { getSession, login as apiLogin, logout as apiLogout } from '../lib/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  // Check existing session
  checkSession: async () => {
    try {
      set({ loading: true, error: null })
      const data = await getSession()
      if (data && data.user) {
        set({ user: data.user, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch {
      set({ user: null, loading: false })
    }
  },

  // Login
  login: async (username, password) => {
    try {
      set({ error: null })
      const data = await apiLogin(username, password)
      if (data.success && data.user) {
        set({ user: data.user })
        return true
      } else {
        set({ error: data.message || 'Login failed' })
        return false
      }
    } catch (err) {
      set({ error: err.message || 'Login failed' })
      return false
    }
  },

  // Logout
  logout: async () => {
    try {
      await apiLogout()
    } catch {
      // ignore
    }
    set({ user: null })
  },

  // Helpers
  hasRole: (role) => {
    const { user } = get()
    if (!user) return false
    if (user.role === role) return true
    // Check secondary_roles
    try {
      const secondary = typeof user.secondary_roles === 'string'
        ? JSON.parse(user.secondary_roles || '[]')
        : (user.secondary_roles || [])
      return secondary.includes(role)
    } catch {
      return false
    }
  },

  hasAnyRole: (...roles) => {
    const { hasRole } = get()
    return roles.some(r => hasRole(r))
  },

  isAdmin: () => get().hasRole('Admin'),
}))
