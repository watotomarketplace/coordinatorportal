import { create } from 'zustand'
import api from '../lib/api'

export const useAppStore = create((set) => ({
  // Platform
  platform: window.innerWidth <= 768 ? 'mobile' : 'desktop',
  
  // Theme
  theme: localStorage.getItem('wl101-theme') || 'dark',

  // Wallpaper
  wallpaper: '/bg.jpeg',

  // Sidebar
  sidebarOpen: true,

  // Current page title (for header display)
  pageTitle: 'Dashboard',

  // Actions
  setPlatform: (platform) => set({ platform }),
  
  setTheme: (theme) => {
    localStorage.setItem('wl101-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },

  toggleTheme: () => {
    const current = localStorage.getItem('wl101-theme') || 'dark'
    const next = current === 'dark' ? 'light' : 'dark'
    localStorage.setItem('wl101-theme', next)
    document.documentElement.setAttribute('data-theme', next)
    set({ theme: next })
  },

  setWallpaper: async (wallpaper) => {
    set({ wallpaper })
    document.body.style.setProperty('--wallpaper-url', `url(${wallpaper})`)
    try {
      await api.put('/api/user/preferences', { wallpaper })
    } catch (e) {
      console.error('Failed to save wallpaper preference:', e)
    }
  },

  loadWallpaper: async () => {
    try {
      const data = await api.get('/api/user/preferences')
      if (data.success && data.preferences?.wallpaper) {
        set({ wallpaper: data.preferences.wallpaper })
        document.body.style.setProperty('--wallpaper-url', `url(${data.preferences.wallpaper})`)
      }
    } catch (e) {
      console.error('Failed to load wallpaper preference:', e)
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setPageTitle: (title) => set({ pageTitle: title }),
}))
