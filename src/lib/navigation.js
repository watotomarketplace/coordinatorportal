// Full-page navigation that bypasses browser extensions intercepting history.pushState.
// Use in place of react-router navigate() whenever the redirect blocker extension interferes.
export function safeNavigate(url) {
    window.location.href = url
}
