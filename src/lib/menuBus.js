// In-memory pub/sub for menu → page communication.
// Returns an unsubscribe function from on(), safe to call in useEffect cleanup.

const listeners = {}

const menuBus = {
    on(event, cb) {
        if (!listeners[event]) listeners[event] = new Set()
        listeners[event].add(cb)
        return () => listeners[event].delete(cb)
    },
    emit(event, payload = {}) {
        listeners[event]?.forEach(cb => {
            try { cb(payload) } catch (_) {}
        })
    },
}

// Expose globally so Electron/native wrappers can fire events if needed
if (typeof window !== 'undefined') window.__menuBus__ = menuBus

export default menuBus
