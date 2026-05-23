import React from 'react'
import { ChevronRight } from 'lucide-react'

export const CAMPUSES = [
    'Bbira', 'Bugolobi', 'Bweyogerere', 'Downtown', 'Entebbe',
    'Nakwero', 'Gulu', 'Juba', 'Jinja', 'Kansanga', 'Kyengera',
    'Laminadera', 'Lubowa', 'Mbarara', 'Mukono', 'Nansana',
    'Ntinda', 'Online', 'Suubi',
]

// Top-level clickable label in the menu bar
export function MenuTrigger({ id, label, openMenu, handleMenuClick, appName = false, children }) {
    const isOpen = openMenu === id
    return (
        <div className={`menu-trigger ${isOpen ? 'menu-trigger--open' : ''} ${appName ? 'menu-trigger--app' : ''}`}>
            <button
                className="menu-trigger-btn"
                onClick={() => handleMenuClick(id)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                {label}
            </button>
            {isOpen && (
                <div className="menu-dropdown" role="menu">
                    {children}
                </div>
            )}
        </div>
    )
}

// Right-aligned dropdown (for right-side menus)
export function MenuTriggerRight({ id, label, openMenu, handleMenuClick, children }) {
    const isOpen = openMenu === id
    return (
        <div className={`menu-trigger ${isOpen ? 'menu-trigger--open' : ''}`}>
            <button
                className="menu-trigger-btn"
                onClick={() => handleMenuClick(id)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                {label}
            </button>
            {isOpen && (
                <div className="menu-dropdown menu-dropdown--right" role="menu">
                    {children}
                </div>
            )}
        </div>
    )
}

// Standard clickable menu item
export function MenuItem({ icon: Icon, label, shortcut, onClick, disabled = false, danger = false, closeMenu }) {
    return (
        <button
            className={`menu-item ${disabled ? 'menu-item--disabled' : ''} ${danger ? 'menu-item--danger' : ''}`}
            onClick={disabled ? undefined : () => { onClick?.(); closeMenu?.() }}
            role="menuitem"
            aria-disabled={disabled}
        >
            <span className="menu-item-icon">
                {Icon && <Icon size={13} strokeWidth={1.75} />}
            </span>
            <span className="menu-item-label">{label}</span>
            {shortcut && <span className="menu-item-shortcut" aria-hidden="true">{shortcut}</span>}
        </button>
    )
}

// Divider line
export function MenuSeparator() {
    return <div className="menu-separator" role="separator" aria-hidden="true" />
}

// Non-interactive section label
export function MenuSectionHeader({ label }) {
    return <div className="menu-section-header">{label}</div>
}

// Hover-reveal submenu
export function MenuSubmenu({ icon: Icon, label, children }) {
    return (
        <div className="menu-submenu">
            <div className="menu-item menu-item--has-submenu">
                <span className="menu-item-icon">
                    {Icon && <Icon size={13} strokeWidth={1.75} />}
                </span>
                <span className="menu-item-label">{label}</span>
                <ChevronRight size={11} className="menu-submenu-chevron" />
            </div>
            <div className="menu-submenu-panel" role="menu">
                {children}
            </div>
        </div>
    )
}

// Checkmark toggle item
export function MenuCheckItem({ icon: Icon, label, shortcut, checked, onClick, closeMenu }) {
    return (
        <button
            className="menu-item menu-item--check"
            onClick={() => { onClick?.(); closeMenu?.() }}
            role="menuitemcheckbox"
            aria-checked={checked}
        >
            <span className="menu-item-icon menu-item-check-indicator">
                {checked
                    ? <span className="menu-check-active">✓</span>
                    : <span className="menu-check-empty" />
                }
            </span>
            <span className="menu-item-label">{label}</span>
            {shortcut && <span className="menu-item-shortcut">{shortcut}</span>}
        </button>
    )
}

// Campus filter submenu — shared across many menus
export function CampusSubmenu({ icon: Icon, onSelect, closeMenu }) {
    return (
        <MenuSubmenu icon={Icon} label="Filter by Campus">
            <button className="menu-item" onClick={() => { onSelect(null); closeMenu?.() }}>
                <span className="menu-item-icon" />
                <span className="menu-item-label">All Campuses</span>
            </button>
            <div className="menu-separator" />
            {CAMPUSES.map(c => (
                <button key={c} className="menu-item" onClick={() => { onSelect(c); closeMenu?.() }}>
                    <span className="menu-item-icon" />
                    <span className="menu-item-label">{c}</span>
                </button>
            ))}
        </MenuSubmenu>
    )
}
