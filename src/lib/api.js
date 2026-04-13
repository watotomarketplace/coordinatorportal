/**
 * WL101 Portal — API Layer
 * 
 * Centralized fetch wrapper used by all pages.
 * Replaces scattered fetch calls across 11 addon scripts.
 */

import axios from 'axios'

const BASE = '' // same origin proxy handled by Vite

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
})

// Unpack the data so previous fetch wrappers keep working correctly
api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Convenience methods for common endpoints
export async function getSession() {
  return api.get('/api/auth/session')
}

export async function login(username, password) {
  return api.post('/api/auth/login', { username, password })
}

export async function logout() {
  return api.post('/api/auth/logout')
}

export async function getStudents() {
  return api.get('/api/data/students')
}

export async function getUsers() {
  return api.get('/api/admin/users')
}

export async function getGroups() {
  return api.get('/api/formation-groups')
}

export async function getGroupDetail(id) {
  return api.get(`/api/formation-groups/${id}`)
}

export async function getDashboardData(campus = '') {
  return api.get(`/api/dashboard/summary${campus ? '?campus=' + encodeURIComponent(campus) : ''}`)
}

export async function getDashboardStats(campus = '') {
  return api.get(`/api/data/stats${campus ? '?campus=' + encodeURIComponent(campus) : ''}`)
}

export async function getAttendanceDashboard() {
  return api.get('/api/attendance/dashboard')
}

export async function getNotifications() {
  return api.get('/api/notifications')
}

export async function getAuditLogs(params = '') {
  return api.get(`/api/admin/audit${params ? '?' + params : ''}`)
}

export async function getExportOptions() {
  return api.get('/api/exports')
}
