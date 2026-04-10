# WL101 Coordinator Portal — Changes & Build Summary

*Last updated: March 31, 2026*

---

## Project Overview

The **WL101 Coordinator Portal** is a management dashboard for Watoto Leadership 101 — a 13-week leadership program running across 19 Ugandan church campuses with ~3,000 students organized into ~290 formation groups of 8–20.

**Stack:** Node.js v22 + Express 4.18 (ESM) · React 18 + Vite (compiled to `dist/`) · PostgreSQL (Neon) in prod · SQLite locally · express-session auth · node-cron scheduler

---

## Architecture Notes

The React frontend is **pre-compiled** into `dist/`. All UI enhancements are injected at runtime via standalone addon scripts loaded from `dist/assets/` and referenced in `dist/index.html`. Each addon is a self-contained IIFE that uses `MutationObserver`, fetch interception, and CSS class injection.

### Addon Files (all in `dist/assets/`)

| File | Size | Purpose |
|------|------|---------|
| `mobile-ui.js` | 34 KB / 875 lines | iOS 26 Liquid Glass mobile overhaul |
| `mobile-ui.css` | 24 KB / 790 lines | Mobile-only CSS (≤768px) |
| `user-management-addon.js` | 42 KB / 913 lines | User management grid/list toggle, search, dual-role editing |
| `portal-enhancements.js` | 15 KB / 375 lines | Username lowercase, co-facilitator dropdown, group code format |
| `attendance-addon.js` | 51 KB / 967 lines | Full attendance check-in UI (compiled from `src/`) |

---

## Changes Made — Full History

### Session A (March 6, 2026) — Backend Refactor

**Scope:** Backend server code (5 services, 3 routes, 1 middleware)

---

## 🐛 Bug Fixes

### 1. `req.user` undefined on tag endpoints — `server/routes/data.js`
**Severity: HIGH** — Tags added via POST `/api/data/tags` would silently fail to record the author name, 
because `req.user` is undefined. Express doesn't set `req.user` — it must be `req.session.user`.

```js
// BEFORE (broken):
addTag(studentId, tagName.trim(), color, req.user?.name)

// AFTER (fixed):
const user = req.session.user
addTag(studentId, tagName.trim(), color, user.name)
```

---

### 2. Spotlight Search queries non-existent `students` SQL table — `server/routes/data.js`
**Severity: HIGH** — The search endpoint ran `SELECT ... FROM students` which doesn't exist 
in the schema. Students live in the Thinkific in-memory cache. The search would always 
return 0 students (or crash with a SQL error).

**Fix:** Search now calls `getStudentData()` to pull from the Thinkific cache and filters 
in memory, consistent with how every other endpoint accesses student data.

---

### 3. `generateAllCheckpoints` called without `await` — `server/services/scheduler.js`
**Severity: CRITICAL** — The checkpoint scheduler called `generateAllCheckpoints(4)` without 
awaiting the Promise, then immediately accessed `.generated` on the unresolved Promise object — 
which was always `undefined`. This meant:

- No new checkpoints were ever reported as generated
- `notifyCheckpointReady()` was never called with the correct count
- Admins received no checkpoint notifications

```js
// BEFORE (broken — .generated is undefined on a Promise):
const results4 = generateAllCheckpoints(4)
const totalGenerated = results4.generated + results8.generated + results13.generated

// AFTER (fixed):
const result = await generateAllCheckpoints(week)
if (result.generated > 0) { ... }
```

---

### 4. Notifications not awaited in `notifyOverdueReports` — `server/services/notifications.js`
**Severity: MEDIUM** — `createNotification()` was called without `await`, meaning errors were 
silently swallowed and the notification count could be inaccurate.

---

## ✨ New Features & Improvements

### 5. Notion Sync — Exponential Backoff & Retry — `server/services/notion-sync.js`
- Added `withRetry()` wrapper with exponential backoff (3 attempts, 2s base, 2× multiplier)
- Rate limit (429) respects `Retry-After` header, up to 30s max
- Auth errors (401) are not retried — fail fast with clear message
- Network errors (ENOTFOUND, ETIMEDOUT) retry with backoff
- Sync history (last 20 syncs) stored in memory, exposed via `getSyncStatus()`
- Guard against overlapping syncs (`isSyncing` flag)
- Pastoral concern detection: when a **new** report contains pastoral concerns, coordinators 
  and pastors at that campus are automatically notified

### 6. Notion Sync — Better Field Mapping — `server/services/notion-sync.js`
- Added support for `Attendance Count` (alternate Notion column name) alongside `Attendance`
- Added support for `Submitted Date` alongside `Submitted`
- Added support for `Formation Group Code` alongside `Group Code`
- Added `_facilitator_name` extraction from Notion person fields for future matching

### 7. Exports — HTML/PDF Reports — `server/routes/exports.js`
All 8 export endpoints now accept `?format=html` to return a **print-ready HTML report** 
that automatically opens the browser print dialog (→ Save as PDF).

Features of the HTML reports:
- Branded header with campus, generated-by, timestamp
- Summary statistics bar per section (totals, averages, risk counts)
- Clean A4 landscape print layout with page-break awareness
- UTF-8 BOM on CSV exports for correct Excel rendering
- All 8 endpoints support both CSV and HTML: roster, risk, weekly-reports, 
  formation-evidence, checkpoints (campus) + roster, weekly-reports, formation-evidence (group)

### 8. RBAC — New Middleware Helpers — `server/middleware/rbac.js`
- **`requireGroupAccess`** — Middleware that verifies the requesting user can access a 
  specific formation group. Handles Admin (always), Facilitator (own group only), and 
  campus-scoped roles (own campus only). Sets `req.verifiedGroup` for downstream use.
- **`requireStudentAccess`** — For Facilitators: verifies the student is in their group.
- **`requireCanSubmitReport`** — Restricts report submission to Admin + Facilitator only.
- **`ALL_ROLES`** and **`CAN_COMMENT_ROLES`** exported for use in route files.
- Improved error messages include the actual campus name for clarity.

### 9. Facilitator Group-Scoping in Notes & Tags — `server/routes/data.js`
Facilitators can now only:
- View notes for students in their own groups
- Add notes to their own group or their group's members
- Tag students in their own groups

### 10. Search Scoping by Role — `server/routes/data.js`
Spotlight Search now correctly scopes results:
- **Facilitators:** Only their group's members (students), their own group, their group's notes
- **Campus roles:** Only their campus students, groups, and notes
- **Global roles:** Everything (unchanged)

### 11. Scheduler — Friday Submission Reminder — `server/services/scheduler.js`
New cron job every Friday at 6:00 PM sends a reminder notification to any Facilitator 
who hasn't yet submitted a report for the current week. Based on the `current_week` 
system setting.

### 12. Notifications — Bulk Notification & New Types — `server/services/notifications.js`
- `createBulkNotification(userIds, title, message, type)` — send same notification to multiple users efficiently
- `notifyUserCreated(userId, role, campus)` — welcome notification for new portal users
- `notifySyncError(message)` — notifies all Admins when Notion sync fails
- All `createNotification` calls are now properly awaited
- Overdue reports now also notify campus Coordinators (not just the Facilitator)

### 13. Thinkific Write-Back — Campus Scope Enforcement — `server/services/thinkific-writeback.js`
TechSupport users are now verified against the student's campus before name changes or 
password resets are allowed. If the student belongs to a different campus, the action 
is blocked and audit-logged with the denial reason.

### 14. Thinkific Write-Back — Better Error Messages — `server/services/thinkific-writeback.js`
HTTP error codes from Thinkific are now translated to human-readable messages:
- 401 → "Authentication failed — check API key"
- 404 → "Participant not found in Thinkific"
- 422 → Extracts the specific validation error from Thinkific's response body
- 429 → "Rate limit reached — wait and try again"
- 500+ → "Thinkific server error"
- Network errors → "Network error: [message]"

### 15. Temp Password Generator — Improved — `server/services/thinkific-writeback.js`
- Guarantees at least 2 uppercase, 2 lowercase, 2 digits, 1 special character
- Avoids ambiguous characters (0/O, 1/l/I) for readability when sharing verbally
- Shuffles result to avoid predictable prefix patterns
- Temp password NOT stored in audit log (security improvement)

---

## 📁 Files Changed

| File | Type | Key Changes |
|------|------|-------------|
| `server/routes/data.js` | Bug fix + Feature | Fix `req.user` bug, fix search table, Facilitator scoping on notes/tags/search |
| `server/services/scheduler.js` | Bug fix + Feature | Fix missing `await`, add Friday reminder, smarter checkpoint week detection |
| `server/services/notion-sync.js` | Feature | Retry logic, sync history, pastoral concern notifications, better field mapping |
| `server/middleware/rbac.js` | Feature | `requireGroupAccess`, `requireStudentAccess`, `requireCanSubmitReport`, better error messages |
| `server/routes/exports.js` | Feature | HTML/PDF export format for all 8 report types, summary rows, BOM fix |
| `server/services/notifications.js` | Bug fix + Feature | Await fixes, bulk notifications, new notification types |
| `server/services/thinkific-writeback.js` | Feature | Campus scope enforcement, human-readable errors, improved temp password |

---

## 🔧 Deployment Notes

Drop each file into the corresponding path in your project. No database schema changes 
are required — all improvements are logic/service layer only.

The `server/routes/data.js` change adds an import of `getCache` from `thinkific.js`.
If `getCache` is not yet exported from that service, the search falls back gracefully
using `getStudentData()` instead (already in the updated file).

---

### Session B (March 26, 2026) — Access Control, Sync Frequency & Attendance Editing

#### B1 — Open Group Editing to All Authenticated Roles

**File:** `server/routes/formation-groups.js`

Previously restricted to `['Admin', 'TechSupport', 'Coordinator']` whitelist. Replaced whitelist with scoping-based access:

- **Campus-scoped roles** (Pastor, Coordinator, TechSupport) → can only edit groups at their own campus
- **Facilitators / CoFacilitators** → can only edit groups they are assigned to (by `facilitator_user_id` or `co_facilitator_user_id`)
- **All other authenticated users** → full access

Same open-scoping applied to:
- `POST /:id/members` — add member to group
- `DELETE /:id/members/:studentId` — remove member from group

#### B2 — Open Attendance Write Access to All Roles (Including Past Weeks)

**File:** `server/routes/attendance.js`

Rewrote `checkGroupAccess()`:

```javascript
async function checkGroupAccess(user, groupId, requireWrite = false) {
  if (user.role === 'Admin') return true;
  const group = await dbGet('SELECT ...', [groupId]);
  if (!group) return false;
  if (['LeadershipTeam'].includes(user.role)) return true;
  if (user.role === 'Facilitator' || user.role === 'CoFacilitator') {
    return group.facilitator_user_id === user.id || group.co_facilitator_user_id === user.id;
  }
  if (['Coordinator', 'TechSupport', 'Pastor'].includes(user.role)) {
    return group.celebration_point === user.celebration_point;
  }
  return true; // any other authenticated user
}
```

Added two new endpoints:
- `PUT /api/attendance/sessions/:id` — update session (date, week, notes, `did_not_meet` flag, attendance records)
- `DELETE /api/attendance/sessions/:id` — delete session and all its `session_attendance` rows

#### B3 — Reduce Sync Frequencies

**`server/services/notion-sync.js`:** Default sync interval `15 min → 3 min`
**`server/services/thinkific.js`:** Cache TTL `15 min → 5 min`

#### B4 — Attendance Frontend — Edit & Delete Sessions

**File:** `src/components/GroupAttendance.jsx` → compiled to `dist/assets/attendance-addon.js`

Complete rewrite with:
- **Session editing**: clicking a session card re-opens the check-in modal pre-populated with existing attendance data (fetches `GET /api/attendance/sessions/:id/attendance`)
- **Session deletion**: 🗑 button with confirmation on each session card
- **Session notes field**: textarea in the check-in modal for per-session notes
- **No role restriction** on "Record Session" button — visible to all authenticated users
- **Dual-mode save**: `handleSave()` detects whether to POST (create) or PUT (update) based on `editingSession` state
- Session cards show week number, date, attendance count, "Tap to edit" hint

---

### Session C (March 31, 2026) — iOS 26 Liquid Glass Mobile UI

All changes are mobile-only (media query `≤768px`). No compiled React bundle was modified. All features work via runtime JS/CSS addons.

#### C1 — Login Screen — Lockscreen Style

**Files:** `dist/assets/mobile-ui.js`, `dist/assets/mobile-ui.css`

- JS function `updateLoginState()` toggles `lg-login-active` class on `<body>` when on `/login` route
- CSS: `.lg-login-active` hides `#lg-tab-bar`, `.tahoe-menubar`, `.dock-container` and removes body bottom padding
- Login screen gets full-screen centered layout with enlarged clock (iOS lockscreen style)
- Triggered on every route change via the unified route watcher (`setInterval` 200ms + `popstate`)

#### C2 — Home Screen App Grid

**Files:** `dist/assets/mobile-ui.js`, `dist/assets/mobile-ui.css`

- On `/dashboard`, an overlay `#lg-home-screen` is injected with: time/date display, personalized greeting, and an iOS-style 4-column app grid
- `fetchUserSession()` calls `/api/auth/session` once and caches the result — used to filter apps by role
- 13 apps defined with emoji icons, gradient colors, paths, and role arrays — visible apps filtered per user's `role`
- Icon tap: 0.85 scale animation → navigate via `pushState + popstate`
- `showHomeScreen()` / `hideHomeScreen()` manages visibility across route changes
- When navigating away from dashboard, overlay is hidden and tab bar is shown for in-app navigation

| App | Gradient | Visible to |
|-----|----------|-----------|
| 🏠 Home | #FF9966 → #FF5E62 | All |
| 🎓 Students | #56CCF2 → #2F80ED | Admin, LT, Pastor, Coord, TS |
| 👥 Users | #11998e → #38ef7d | Admin, TechSupport |
| 🏘️ Groups | #667eea → #764ba2 | Most roles |
| 📅 Attendance | #f6d365 → #fda085 | Most roles |
| 📝 Reports | #00b09b → #96c93d | Most roles |
| 📊 Analytics | #8E2DE2 → #4A00E0 | Admin, LT, Pastor |
| 🎯 Checkpoints | #e17055 → #d63031 | Most roles |
| 🛡️ Audit | #F2994A → #F2C94C | Admin, LT |
| 📦 Batch Tool | #a18cd1 → #fbc2eb | Admin, Coordinator |
| 🔧 Tech Support | #0984e3 → #6c5ce7 | Admin, TechSupport |
| 📥 Exports | #fd79a8 → #e84393 | Most roles |
| ⚙️ Settings | #718096 → #4a5568 | Admin only |

#### C3 — Swipe-Up to Home + Home Indicator

**Files:** `dist/assets/mobile-ui.js`, `dist/assets/mobile-ui.css`

- `div#lg-home-indicator` — 134×5px white pill fixed at screen bottom center (iOS home indicator)
- `setupSwipeUpToHome()`: touchstart in bottom 40px zone → track upward delta → if `deltaY > 100px` and primarily vertical → `navigateTo('/dashboard')`
- Guards: does not trigger on login page or inside modals
- Indicator highlights during active swipe gesture (class `lg-home-indicator-active`)

**Gesture zones (no overlaps):**

| Gesture | Zone | Condition | Action |
|---------|------|-----------|--------|
| Pull-to-refresh | Anywhere except top 40px | scrollY=0 + down >80px | Page reload |
| Swipe-down CC | Top 40px only | down >60px | Show Control Center |
| Swipe-up home | Bottom 40px only | up >100px | Navigate /dashboard |
| Swipe-dismiss | Inside modal | down >100px | Close modal |

#### C4 — Dashboard / Graph iOS Widget Styling

**Files:** `dist/assets/mobile-ui.js`, `dist/assets/mobile-ui.css`

- `enhanceDashboardWidgets()`: adds `lg-widget` class to `.stat-card` and `.chart-card` (skips already-tagged elements via `dataset.lgWidget`)
- CSS widget treatment:
  - Stat cards: 22px border-radius, strong specular highlight, 28px bold numbers, 11px uppercase labels
  - Chart cards: full-width single column, 22px radius, heavier glass
  - `.charts-section` → single column, 12px gap
  - `canvas` → max-height 180px
  - `.stat-value` → -0.5px letter-spacing, SF Pro-like bold weight

#### C5 — Settings Page Mobile Redesign

**File:** `dist/assets/mobile-ui.css` (CSS-only)

Inside `@media (max-width: 768px)`:
- `.settings-modal-window` inner flex container: `flex-direction: column`
- `.settings-sidebar`: horizontal scroll strip (`flex-direction: row`, `overflow-x: auto`, `max-height: 56px`, scroll-snap)
- `.settings-sidebar-btn`: horizontal pills (`flex-shrink: 0`, `border-radius: 20px`, `white-space: nowrap`)
- `.sidebar-search-wrapper`: hidden (not useful in horizontal mode)
- `.settings-content`: `width: 100%`, `flex: 1`, scrollable below the tab strip

#### C6 — Simplified Top Bar + Control Center

**Files:** `dist/assets/mobile-ui.js`, `dist/assets/mobile-ui.css`

**Top bar simplification (CSS + JS):**
- CSS hides: `.menubar-left`, `.menu-item.clock`, `.menu-item.icon-btn`
- Only `.user-profile` (name + avatar) remains visible
- JS `simplifyTopBar()` injects `span.lg-role-badge` showing the user's role (e.g., "Admin", "Facilitator") — fetched from `_userSession` cache

**Control Center (`#lg-control-center`):**

Triggered by swipe-down from top 40px zone (progressive reveal tracks the finger during swipe).

Contents:
- Large clock + date
- User row: avatar (image or initial letter) + full name + role
- Toggle grid (2×2): 🌙 Dark Mode (toggles `.light-theme`), 🔔 Notifications, 🔄 Refresh, 📱 Fullscreen
- Quick links: ⚙️ Settings → `/settings` · 🚪 Logout → `POST /api/auth/logout` → redirect to `/login`

Animation: `transform: translateY(-100%)` → `translateY(0)` with spring easing. Dismiss by swipe-up or backdrop tap.

---

## Current File State

### Backend (Server)

| File | Last Modified | Status |
|------|--------------|--------|
| `server/routes/formation-groups.js` | Mar 31 | Open RBAC — all authenticated roles |
| `server/routes/attendance.js` | Mar 31 | Open write + PUT/DELETE session endpoints |
| `server/services/notion-sync.js` | Mar 31 | 3 min sync interval, retry/backoff, pastoral alerts |
| `server/services/thinkific.js` | Mar 31 | 5 min cache TTL |
| `server/middleware/rbac.js` | Mar 26 | requireGroupAccess, requireStudentAccess helpers |
| `server/routes/data.js` | Mar 26 | Fixed req.user bug, fixed search, Facilitator scoping |
| `server/routes/exports.js` | Mar 26 | HTML/PDF export format for all 8 report types |
| `server/services/scheduler.js` | Mar 26 | Await fix, Friday reminder, checkpoint notification |
| `server/services/notifications.js` | Mar 26 | Bulk notifications, new types, await fixes |
| `server/services/thinkific-writeback.js` | Mar 26 | Campus scope, better errors, improved temp passwords |

### Frontend Addons (dist/assets/)

| File | Last Modified | Status |
|------|--------------|--------|
| `mobile-ui.js` | Mar 31 | iOS 26 overhaul — 875 lines, 14 modules |
| `mobile-ui.css` | Mar 26 | iOS 26 CSS — 790 lines (needs rewrite to match new JS) |
| `attendance-addon.js` | Mar 31 | Session edit/delete/notes — 967 lines |
| `user-management-addon.js` | Mar 26 | Grid/list toggle, search, dual-role — unchanged |
| `portal-enhancements.js` | Mar 26 | Username lowercase, co-fac dropdown, group code — unchanged |

---

## Pending Work

- [ ] **`mobile-ui.css` full rewrite** — JS was rewritten Mar 31 with new classes (`lg-home-screen`, `lg-app-grid`, `lg-app-icon`, `lg-home-indicator`, `lg-control-center`, `lg-role-badge`, `lg-widget`, settings sidebar strip). CSS file needs to be updated to define all these new classes.
- [ ] **Browser testing** — Test all 6 iOS features on mobile viewport (375×812)
- [ ] **Verify attendance edit/delete** — End-to-end test of the session editing flow

---

## Testing Checklist

```
LOGIN SCREEN
[ ] No dock/tab bar visible on /login
[ ] Clock + date displayed (iOS lockscreen style)
[ ] Username/password form visible and centered
[ ] Switch User button visible

HOME SCREEN
[ ] App grid appears on /dashboard
[ ] Apps filtered by user role (Facilitator sees fewer apps)
[ ] Tapping an app navigates correctly
[ ] Greeting shows correct time-of-day + user name

IN-APP NAVIGATION
[ ] Floating tab bar visible on all non-login pages
[ ] Home indicator bar at bottom
[ ] Swipe up from bottom edge → returns to /dashboard
[ ] Active tab highlights on correct route

DASHBOARD WIDGETS
[ ] Stat cards: rounded corners, bold numbers, uppercase labels
[ ] Charts: full width, capped height, glass treatment
[ ] No layout overflow on small screens

SETTINGS (mobile)
[ ] Settings sidebar is a horizontal scroll strip
[ ] Section buttons are pills (not vertical list)
[ ] Content area is full-width below the strip

TOP BAR
[ ] Only username visible (not full app name)
[ ] Role badge (e.g. "Admin") shown next to name
[ ] Clock and icon buttons hidden

CONTROL CENTER
[ ] Swipe down from very top opens Control Center
[ ] Shows clock, user info, 4 toggle tiles, Settings + Logout
[ ] Tap backdrop dismisses
[ ] Swipe up inside panel dismisses
[ ] Logout button works correctly

ATTENDANCE
[ ] Session card shows "Tap to edit"
[ ] Clicking session opens modal with existing data pre-filled
[ ] Session notes field present in modal
[ ] Delete (🗑) button removes session with confirmation
[ ] Past week sessions editable
```

---

### Session D (March 31, 2026) — Mobile UI: iOS 26 Visual Overhaul

**Scope:** `dist/assets/mobile-ui.js` + `dist/assets/mobile-ui.css`

#### CSS — All missing dynamic classes added (~310 new lines appended)
- **Login screen** (`.lg-login-active`): hides tab bar, home indicator, entire `.tahoe-menubar`, body padding removed → clean lockscreen with only clock + credentials
- **Home screen overlay** (`#lg-home-screen`): `position: fixed`, full-viewport blurred glass background, iOS 76px weight-200 clock, date, 4-column app grid, greeting, dock
- **App grid** (`.lg-app-grid`, `.lg-app-icon`, `.lg-app-icon-img`, `.lg-app-icon-label`): 4-column grid, 60px rounded-square icon tiles with gradient + shadow, labels with text-shadow
- **Home dock** (`.lg-home-dock`, `.lg-home-dock-scroll`, `.lg-home-dock-icon`): frosted-glass container, horizontally scrollable via `scroll-snap-type: x mandatory`, all role-filtered apps shown as icon-only tiles
- **Home indicator** (`.lg-home-indicator`): 134×5px pill at bottom, activates on swipe-up
- **Control Center** (`#lg-control-center`, `.lg-cc-*`): dark glass panel slides from top, clock, user avatar + name + role, 4-column toggle grid, Settings + Logout quick links
- **Top bar** (`.lg-role-badge`): inline role pill badge; hides desktop nav items, only name + role visible on mobile
- **Stat card widgets** (`.lg-widget`): larger numbers, uppercase labels, chart cards span full width
- **Settings sidebar strip**: horizontal scrollable pill tabs on mobile (`overflow-x: auto`, `scroll-snap-type`)
- **In-app dock rule**: ensures `#lg-tab-bar` visible on all non-home, non-login pages

#### JS — 4 targeted edits
1. **`updateLoginState()`**: also hides/restores `.tahoe-menubar` when on login page
2. **`createHomeScreenGrid()`**: appends scrollable `.lg-home-dock` after greeting; overlay now `document.body.appendChild()` (was incorrectly injected into `.page-container`)
3. **`showHomeScreen()`**: hides `#lg-tab-bar` before showing home — home dock replaces it
4. **`hideHomeScreen()`**: restores `#lg-tab-bar` on navigation away (unless on login)
5. **`init()`**: calls `showHomeScreen()` instead of `createHomeScreenGrid()` directly to ensure consistent tab-bar hide/show
