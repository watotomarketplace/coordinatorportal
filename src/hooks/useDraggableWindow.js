import { useEffect, useRef, useCallback } from 'react'

export function useDraggableWindow() {
    const windowRef = useRef(null)
    const dragging = useRef(false)
    const offset = useRef({ x: 0, y: 0 })

    const onTitleMouseDown = useCallback((e) => {
        if (e.button !== 0) return
        const el = windowRef.current
        if (!el) return

        const rect = el.getBoundingClientRect()
        el.style.position = 'fixed'
        el.style.margin = '0'
        el.style.top = rect.top + 'px'
        el.style.left = rect.left + 'px'
        el.style.width = rect.width + 'px'
        el.setAttribute('data-dragged', 'true')

        dragging.current = true
        offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        e.preventDefault()
    }, [])

    const onTitleDoubleClick = useCallback(() => {
        const el = windowRef.current
        if (!el) return
        el.style.position = ''
        el.style.margin = ''
        el.style.top = ''
        el.style.left = ''
        el.style.width = ''
        el.removeAttribute('data-dragged')
    }, [])

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging.current || !windowRef.current) return
            const el = windowRef.current
            const MENU_BAR_H = 28
            const EDGE_MARGIN = 120
            const newTop = Math.max(MENU_BAR_H, e.clientY - offset.current.y)
            const newLeft = Math.max(
                -(el.offsetWidth - EDGE_MARGIN),
                Math.min(window.innerWidth - EDGE_MARGIN, e.clientX - offset.current.x)
            )
            el.style.top = newTop + 'px'
            el.style.left = newLeft + 'px'
        }

        const onMouseUp = () => { dragging.current = false }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        return () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }
    }, [])

    return { windowRef, onTitleMouseDown, onTitleDoubleClick }
}
