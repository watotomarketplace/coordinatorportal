import { create } from 'zustand'
import { getNotifications } from '../lib/api'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetch: async () => {
    try {
      set({ loading: true })
      const data = await getNotifications()
      const notifs = data.notifications || []
      set({
        notifications: notifs,
        unreadCount: notifs.filter(n => !n.read).length,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  markAsRead: async (id) => {
    const { notifications } = get()
    set({
      notifications: notifications.map(n => n.id === id ? { ...n, read: true } : n),
      unreadCount: notifications.filter(n => !n.read && n.id !== id).length,
    })
  },

  markAllRead: () => {
    const { notifications } = get()
    set({
      notifications: notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    })
  },
}))
