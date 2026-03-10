# WL101 Coordinator Portal — Full Product Requirements Document (PRD)

## 1. Overview
**Product Name:** WL101 Coordinator Portal (watoto-celebration-dashboard)
**Purpose:** A centralized, comprehensive management dashboard for the "Watoto Leadership 101" program. WL101 is a 13-week leadership development program running across 19 church campuses in Uganda, managing approximately 3,000 students organized into formation groups (8–20 people each).
**Core Problem Solved:** Replaces fragmented workflows (manual Tally forms, disconnected Notion databases, LMS isolation) with a unified, role-based platform for facilitators to report attendance, flag pastoral concerns, track engagement, and for coordinators/pastors to oversee the health of their campus cohorts.

---

## 2. Target Audience & Roles (RBAC)
The portal implements strict session-based Role-Based Access Control (RBAC):

1. **Facilitator:** Manages a single formation group. Can view their group's members, submit weekly reports, check in attendance, and add notes/tags to their own students.
2. **Coordinator:** Oversees all formation groups at a specific campus. Can view all campus data, track facilitator reporting compliance, and review pastoral concerns and checkpoints.
3. **Pastor:** Similar to Coordinator but read-only access for campus oversight and pastoral care tracking.
4. **TechSupport:** Focused on LMS (Thinkific) account management. Can reset passwords, update names, and sync caches for users at their assigned campus.
5. **LeadershipTeam:** Read-only access across *all* 19 campuses for high-level aggregated reporting and analytics.
6. **Admin:** Superusers. Full read/write access across all campuses, groups, and users.

---

## 3. Core Features & Functionality

### 3.1 Weekly Reporting & Pastoral Flags
- Facilitators submit a structured weekly report per group (Week 1 to 13).
- Tracks attendance count, engagement level, key themes, formation evidence, and pastoral concerns/escalations.
- **Notion Integration:** Two-way sync pushes submitted reports to a centralized Notion database. If a report contains a "pastoral concern," the system flags it and automatically notifies the relevant campus Coordinator and Pastor.
- **Reporting Reminders:** Automated cron job sends system notifications every Friday at 6:00 PM to facilitators who haven't submitted their weekly report.

### 3.2 Member-Level Attendance (Check-in)
- Detailed, per-session attendance tracking (replacing manual headcounts).
- Records `attended` status individually per student for each group session.
- Automatically rolls up the attendance count and pushes the aggregated number to the Weekly Report.

### 3.3 Thinkific LMS Integration
- The portal acts as a CRM overlay on top of Thinkific.
- **In-Memory Cache:** Periodically pulls the entire Thinkific student list into local memory/JSON cache for instant Spotlight Search and directory listing.
- **Write-Back:** Tech Support can generate secure temporary passwords or fix name typos in the portal, which pushes the changes directly to Thinkific via API.

### 3.4 Discernment Checkpoints
- Automated intelligence summaries generated at Weeks 4, 8, and 13.
- Synthesizes attendance trends, engagement levels, and recurring themes to surface "at-risk" students or notable pastoral concerns to campus leadership.

### 3.5 Quick Notes & Student Tagging
- Facilitators and Coordinators can leave contextual notes on student profiles (e.g., "Missed last week due to sickness").
- Custom color-coded tagging system for categorizing students (e.g., "Needs Follow-up", "High Potential").

### 3.6 Advanced Exports & Reports
- Administrators and Coordinators can export data (Rosters, Risk flags, Checkpoints, Attendance) as CSV or perfectly formatted, print-ready HTML/PDF reports.

---

## 4. UI / UX Design Language

The interface relies on a highly polished, premium **macOS Tahoe-style Glassmorphism** design language.
- **Vibe:** Modern desktop application running in the browser.
- **Window Controls:** Incorporates macOS-style "traffic light" buttons (Red to close, Yellow to minimize, Green to maximize). The UI behaves like a native windowed app.
- **Core Aesthetics:**
  - **Glass Backgrounds:** Translucent panels (`rgba(255,255,255,0.08)`) with heavy background blur (`backdrop-filter: blur(20px)`).
  - **Borders:** Thin, subtle glass borders (`rgba(255,255,255,0.15)`).
  - **Color Palette:** Deep, vibrant gradients contrasted against dark mode bases. Accent Blue (`#4A9EFF`) for primary actions, Accent Purple (`#8B5CF6`) for secondary flair.
  - **Typography:** Modern, crisp sans-serif fonts, using translucent whites (`rgba(255,255,255,0.95)`) for optimal readability against dark glass backgrounds.
  - **Interactions:** Micro-animations on hover, smooth modal transitions, and responsive fluid layouts.

---

## 5. Technology Stack

### 5.1 Frontend (Client)
- **Framework:** React 18, utilizing React Router DOM for routing.
- **Build Tool:** Vite (running independently or served as a static pre-built `dist/` directory via Express).
- **Styling:** Tailwind CSS handling the utility-first implementation of the glassmorphic design tokens.
- **Data Visualization:** Chart.js, wrapped with `react-chartjs-2`.
- **Exporting:** `jspdf` and `html2canvas` for frontend UI-to-PDF rendering (alongside backend HTML print-dialog generation).

### 5.2 Backend (Server)
- **Environment:** Node.js + Express (ESM syntax, `type: "module"`).
- **Database Architecture (Hybrid):**
  - **Production:** PostgreSQL (via [pg](file:///Users/joshuamigadde/Documents/WL101/coordinatorportal-main/server/db/init.js#247-251) package).
  - **Local Development:** SQLite (via `better-sqlite3` and `sql.js`).
- **Authentication:** `express-session` backed by secure, HTTP-only cookies, with `bcryptjs` for password hashing.
- **Scheduled Tasks:** `node-cron` for Friday reminders and checkpoint generation.
- **Performance:** `compression` middleware (GZIP).

### 5.3 External Integrations
- `@notionhq/client` for robust, retry-backoff equipped syncing to Notion databases.
- `googleapis` for potential Google Drive/Sheets integration (if utilized for reports/imports).
- `axios` for standard REST calls (primarily Thinkific API).

---

## 6. Data Model & Architecture

### Key SQL Tables
1. **`users`**: Facilitators, Coordinators, Admins. (Username, hashed password, role, campus celebration point).
2. **`formation_groups` & `formation_group_members`**: The core structural entity. Links facilitators to groups, and students to groups.
3. **`group_sessions` & `session_attendance`**: Granular tracking representing a specific meeting date and individual student presence.
4. **`weekly_reports`**: High-level facilitator submissions synced with Notion.
5. **`discernment_checkpoints`**: Milestone summaries (Weeks 4, 8, 13) generated by the system.
6. **`notes` & `student_tags`**: CRM-like capabilities attached to student IDs.
7. **`notifications`**: In-app alert system.
8. **`audit_logs`**: Tracks sensitive actions (e.g., Thinkific password resets, report edits).

---

## 7. Future/Continuous Evolution
- Further transitioning from purely static Notion reporting to deep, actionable in-app analytics.
- Refinement of the automated Assessment/Insights dashboard to track cohort health comprehensively.
- Expansion of the Tech Support Issue Tracker module to handle campus-specific support tickets.
