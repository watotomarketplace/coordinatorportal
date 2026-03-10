# WL101 Portal — Product Requirements Document
## Group Session Attendance Check-in

| | |
|---|---|
| **Version** | 1.0 |
| **Status** | Draft — Ready for Development |
| **Date** | March 9, 2026 |
| **Product** | WL101 Coordinator Portal |
| **Feature** | Group Session Attendance Check-in |
| **Author** | WL101 Program Team |

---

## 1. Overview

The WL101 Portal manages Watoto Leadership 101, a 13-week leadership development program running across 19 church campuses in Uganda with approximately 3,000 students organized into formation groups of 8–20 people each.

This document defines the requirements for a **Group Session Attendance Check-in** feature that enables facilitators to record member-level attendance for each group session — analogous to the attendance tracking flow in Elvanto's Group Report module.

---

## 2. Problem Statement

Currently, facilitators submit a weekly group report through Tally (synced to Notion) that captures only a total headcount (e.g. "9 of 12 attended"). There is no way to know which specific students attended or missed a given session.

This creates three operational gaps:

- **Pastoral follow-up is impossible** — coordinators cannot identify which individuals have been absent for multiple consecutive weeks.
- **Attendance trends per student cannot be tracked** or reported over the 13-week cohort.
- **Data credibility is low** — a single number field is easy to misreport; a named checklist is self-auditing.

---

## 3. Goals & Success Metrics

### 3.1 Goals

- Allow facilitators to check in individual students against a group member roster for each session.
- Give coordinators and pastors campus-level visibility into attendance patterns.
- Replace the manual headcount in weekly reports with a system-calculated attendance count.
- Be fast enough that facilitators complete check-in during or immediately after the session.

### 3.2 Success Metrics

| Metric | Target |
|---|---|
| % of groups submitting member-level attendance | ≥ 80% by Week 4 |
| Average time to complete a check-in | < 90 seconds |
| Reduction in unmatched/headcount-only reports | ≥ 90% |
| Pastoral concerns flagged via attendance pattern | Tracked from Week 3 onward |

---

## 4. User Roles & Permissions

The portal uses session-based RBAC. Access boundaries for the attendance feature:

| Role | Can View | Can Check In | Scope |
|---|---|---|---|
| Facilitator | Yes | Yes | Own group only |
| Coordinator | Yes | Yes | All groups on own campus |
| Pastor | Yes | Read-only | All groups on own campus |
| LeadershipTeam | Yes | Read-only | All campuses |
| Admin | Yes | Yes | All campuses |
| TechSupport | Yes | No | All campuses |

---

## 5. Data Model

### 5.1 New Tables

Three new tables are required. All use `better-sqlite3` (synchronous) and follow the existing portal schema conventions.

#### `group_members`
Maintains a persistent roster of students for each formation group.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `formation_group_id` | INTEGER FK | References `formation_groups(id)` |
| `student_thinkific_id` | TEXT | Optional — links to Thinkific LMS record |
| `student_name` | TEXT NOT NULL | |
| `student_email` | TEXT | |
| `added_by_user_id` | INTEGER FK | References `users(id)` |
| `active` | INTEGER | 1 = active, 0 = removed |
| `created_at` | DATETIME | Default `CURRENT_TIMESTAMP` |

#### `group_sessions`
One record per group meeting. Can be marked as "did not meet" to record non-attendance without a member checklist.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `formation_group_id` | INTEGER FK | References `formation_groups(id)` |
| `session_date` | DATE NOT NULL | |
| `week_number` | INTEGER | 1–13, derived or manually set |
| `facilitator_user_id` | INTEGER FK | References `users(id)` |
| `notes` | TEXT | Optional session note |
| `did_not_meet` | INTEGER | 1 = group did not meet this week |
| `created_at` | DATETIME | Default `CURRENT_TIMESTAMP` |

#### `session_attendance`
One record per member per session. Unique constraint on `(session_id, group_member_id)` prevents duplicate check-ins.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `session_id` | INTEGER FK | References `group_sessions(id)` |
| `group_member_id` | INTEGER FK | References `group_members(id)` |
| `attended` | INTEGER | 1 = attended, 0 = absent |
| `note` | TEXT | Optional per-member note |

#### Migration file
```sql
-- server/migrations/004_attendance.sql

CREATE TABLE group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  formation_group_id INTEGER NOT NULL REFERENCES formation_groups(id),
  student_thinkific_id TEXT,
  student_name TEXT NOT NULL,
  student_email TEXT,
  added_by_user_id INTEGER REFERENCES users(id),
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  formation_group_id INTEGER NOT NULL REFERENCES formation_groups(id),
  session_date DATE NOT NULL,
  week_number INTEGER,
  facilitator_user_id INTEGER REFERENCES users(id),
  notes TEXT,
  did_not_meet INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES group_sessions(id),
  group_member_id INTEGER NOT NULL REFERENCES group_members(id),
  attended INTEGER DEFAULT 0,
  note TEXT,
  UNIQUE(session_id, group_member_id)
);
```

### 5.2 Integration with `weekly_reports`

After every check-in save, the system automatically back-fills `attendance_count` on the matching `weekly_reports` row (matched by `formation_group_id + week_number`) with the calculated count of `attended = 1`. This keeps the existing Notion sync and reporting pipeline accurate without requiring facilitators to enter the count manually.

---

## 6. API Specification

All routes live in `server/routes/attendance.js` and are mounted at `/api/attendance`. Auth middleware applies to every route; RBAC is enforced per endpoint.

| Method | Route | Description | Auth Scope |
|---|---|---|---|
| GET | `/group/:groupId/members` | List active members of a group | Own group / campus / all |
| POST | `/group/:groupId/members` | Add a member (`name`, `email`, `thinkific_id?`) | Facilitator+ |
| DELETE | `/group/:groupId/members/:memberId` | Soft-delete member (`active=0`) | Facilitator+ |
| GET | `/group/:groupId/sessions` | List all sessions for a group | Own group / campus / all |
| POST | `/group/:groupId/sessions` | Create a new session record | Facilitator+ |
| GET | `/sessions/:sessionId` | Get session + full attendance list | Own group / campus / all |
| POST | `/sessions/:sessionId/checkin` | Submit attendance array, back-fill `weekly_report` | Facilitator+ |
| GET | `/group/:groupId/summary` | Attendance summary per member (count, %, streak) | Own group / campus / all |

**Check-in request body:**
```json
{
  "attendance": [
    { "group_member_id": 1, "attended": 1, "note": "" },
    { "group_member_id": 2, "attended": 0, "note": "Called in sick" }
  ]
}
```
Upserts all records in a single transaction, then updates `attendance_count` on the matching `weekly_reports` row.

---

## 7. UI Requirements

### 7.1 Design System

All new UI must match the existing macOS Tahoe-style glassmorphism design language of the portal.

| Token | Value | Usage |
|---|---|---|
| `--glass-bg` | `rgba(255,255,255,0.08)` | Panel backgrounds |
| `--glass-border` | `rgba(255,255,255,0.15)` | Panel borders |
| `--accent-blue` | `#4A9EFF` | Primary actions, checked state |
| `--accent-purple` | `#8B5CF6` | Secondary accent |
| `--text-primary` | `rgba(255,255,255,0.95)` | Body text |
| `--text-secondary` | `rgba(255,255,255,0.60)` | Labels, captions |
| `border-radius` | `16px` | All cards and panels |
| `backdrop-filter` | `blur(20px)` | All glass panels |

### 7.2 Page: Group Attendance

Accessible from the dock or from the group detail view. Entry point varies by role:
- **Facilitator** — lands directly on their assigned group
- **Coordinator / Pastor / Admin** — sees a group selector dropdown filtered to their campus

### 7.3 Members Tab

- Displays a list of current active group members with name and email.
- Each row shows a total sessions attended badge and an attendance percentage badge:
  - ≥ 80% → green (glass tint)
  - 60–79% → amber (glass tint)
  - < 60% → red (glass tint)
- **Add Member** button opens an inline form with name and email fields, plus a search-as-you-type dropdown sourced from the Thinkific student cache (filtered by campus).
- Each row has a remove button that triggers a confirmation before soft-deleting (`active = 0`).
- Clicking a member name opens a mini attendance timeline showing which sessions they attended or missed across the cohort.

### 7.4 Sessions Tab

- Lists past sessions as glass cards: date, week number, `X / Y` attendance count, "Did Not Meet" badge if applicable.
- **New Session** button opens the Check-in Modal.

### 7.5 Check-in Modal (Core Feature)

This is the primary interaction surface, modelled on the Elvanto Group Report flow.

- **Header row:** group name, date picker (defaults to today), week number selector (1–13).
- **"Group did not meet" toggle** — when enabled, collapses the member list and saves the session with `did_not_meet = 1` and zero attendance.
- **Member checklist:** each row shows a coloured initials avatar circle, member name, and a styled checkbox:
  - Unchecked = glass circle outline
  - Checked = filled `--accent-blue` with white checkmark
- Each row has an **Add Note** field collapsed by default, expanding inline on click.
- **Live counter** in the footer: `Attended: X / Y members` — updates in real time as checkboxes are toggled.
- **Save Session** button POSTs to the check-in endpoint and automatically updates the matching `weekly_report` attendance count.
- On success, the modal closes and the Sessions tab refreshes with the new card.

> **Mobile requirement:** The check-in modal must work well on mobile Safari — facilitators typically use phones during sessions. Touch targets for checkboxes must be at least 44×44pt.

---

## 8. File Structure

| File | Purpose |
|---|---|
| `server/migrations/004_attendance.sql` | `CREATE TABLE` statements for all three new tables |
| `server/routes/attendance.js` | All API routes with RBAC enforcement (ESM, `export default router`) |
| `src/components/GroupAttendance.jsx` | Full React component: Members tab, Sessions tab, Check-in Modal |

**Technical constraints:**
- All files use ESM (`export default`)
- DB calls use `better-sqlite3` synchronous API: `db.prepare().all()`, `.get()`, `.run()`
- Auth is read from `req.session.user`: `{ id, name, role, campus }`
- No required props on the React component (or all props have defaults)
- Tailwind core utility classes only for styling

---

## 9. Out of Scope

- Push notifications or SMS alerts for absent students
- Bulk CSV import of group members *(future iteration)*
- Attendance-based automated pastoral escalation workflow *(future iteration)*
- Changes to the Tally/Notion sync pipeline — attendance back-fill writes directly to the existing `weekly_reports` table

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Should "did not meet" sessions count against a facilitator's engagement score in the reporting dashboard? | Program Team | Open |
| 2 | Can a Coordinator edit a check-in submitted by a Facilitator, or only view it? | Tech Lead | Open |
| 3 | What is the retention policy for attendance records after a cohort ends? | Program Team | Open |
| 4 | Should the Thinkific student ID be a mandatory field or remain optional? | Tech Lead | Open |

---

*WL101 Portal — Confidential Internal Document — Watoto Church*
