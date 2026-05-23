// Simple event bus for menu bar → page communication
// Pages listen via useMenuAction(); MenuBar dispatches via dispatchMenuAction()

export function dispatchMenuAction(action, payload = {}) {
    window.dispatchEvent(new CustomEvent('wl101:menu', { detail: { action, ...payload } }))
}

// React hook for pages: useMenuAction('new-group', () => setShowModal(true))
import { useEffect } from 'react'

export function useMenuAction(action, handler) {
    useEffect(() => {
        const fn = (e) => { if (e.detail.action === action) handler(e.detail) }
        window.addEventListener('wl101:menu', fn)
        return () => window.removeEventListener('wl101:menu', fn)
    }, [action])
}
