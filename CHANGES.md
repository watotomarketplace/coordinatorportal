# WL101 Portal — Improvement Summary
**Generated:** March 6, 2026  
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
