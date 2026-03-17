import { Pool } from 'pg'
import initSqlJs from 'sql.js'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const IS_POSTGRES = !!process.env.DATABASE_URL
let pgPool = null

const dbPath = join(__dirname, 'users.sqlite')
let sqliteDb = null

export function getDatabase() {
  return IS_POSTGRES ? pgPool : sqliteDb
}

export async function initDatabase() {
  // CRITICAL: Force purge the local Thinkific cache file on boot.
  // This breaks the incremental sync loop where corrupted Promise objects 
  // (caused by previous async codemods) were continually copied over to the new cache,
  // ultimately crashing the React frontend with Error #31.
  try {
    const cachePath = join(__dirname, 'cache.json')
    if (existsSync(cachePath)) {
      unlinkSync(cachePath)
      console.log('🧹 Purged thinkific cache.json to clear any corrupted data')
    }
  } catch (err) {
    console.error('⚠️ Failed to purge cache.json:', err.message)
  }

  if (IS_POSTGRES) {
    console.log('🔗 Connecting to PostgreSQL...')
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    await runMigrations()
  } else {
    console.log('📂 Connecting to Local SQLite...')
    const SQL = await initSqlJs()
    if (existsSync(dbPath)) {
      const buffer = readFileSync(dbPath)
      sqliteDb = new SQL.Database(buffer)
    } else {
      sqliteDb = new SQL.Database()
    }
    await runMigrations()
    saveDatabase()
  }

  // Purge any checkpoints corrupted by the earlier Promise serialization bug
  try {
    await dbRun("DELETE FROM discernment_checkpoints WHERE attendance_trend LIKE '%Promise%' OR summary LIKE '%Promise%' OR attendance_trend = '{}'")
    console.log('🧹 Purged corrupted checkpoints if any existed')
  } catch (e) {
    console.error('Failed to purge checkpoints:', e.message)
  }
}

// Abstracted migrations that modify schema syntax based on current dialect
async function runMigrations() {
  function getPK() { return IS_POSTGRES ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT' }
  const ALL_ROLES = "'Admin', 'LeadershipTeam', 'Pastor', 'Coordinator', 'Facilitator', 'TechSupport'"

  await dbRun(`
    CREATE TABLE IF NOT EXISTS notes (
      id ${getPK()},
      student_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      celebration_point TEXT NOT NULL,
      content TEXT NOT NULL,
      author_role TEXT,
      note_type TEXT DEFAULT 'coordinator',
      group_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id ${getPK()},
      user_name TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      user_id INTEGER,
      target_type TEXT,
      target_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id ${getPK()},
      user_id INTEGER,
      username TEXT, 
      type TEXT NOT NULL, 
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS formation_groups (
      id ${getPK()},
      group_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      celebration_point TEXT NOT NULL,
      facilitator_user_id INTEGER,
      cohort TEXT DEFAULT '2025',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS formation_group_members (
      id ${getPK()},
      formation_group_id INTEGER NOT NULL,
      student_id TEXT NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(formation_group_id, student_id)
    )
  `)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS weekly_reports (
      id ${getPK()},
      formation_group_id INTEGER NOT NULL,
      facilitator_user_id INTEGER,
      week_number INTEGER NOT NULL,
      module_number INTEGER,
      lesson_number INTEGER,
      attendance_count INTEGER,
      engagement_level TEXT CHECK(engagement_level IN ('high', 'medium', 'low')),
      key_themes TEXT,
      formation_evidence TEXT,
      pastoral_concerns TEXT,
      questions_to_escalate TEXT,
      session_adjustments TEXT,
      notion_page_id TEXT UNIQUE,
      submitted_at TEXT,
      synced_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // ─── Performance Indexes ───────────────────────────────────────
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_wr_group_week ON weekly_reports(formation_group_id, week_number)`)
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_wr_facilitator ON weekly_reports(facilitator_user_id)`)
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_fg_campus_active ON formation_groups(celebration_point, active)`)
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_fgm_group ON formation_group_members(formation_group_id)`)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS discernment_checkpoints (
      id ${getPK()},
      formation_group_id INTEGER NOT NULL,
      checkpoint_week INTEGER NOT NULL CHECK(checkpoint_week IN (4, 8, 13)),
      summary TEXT,
      attendance_trend TEXT,
      engagement_trend TEXT,
      recurring_themes TEXT,
      formation_evidence_summary TEXT,
      concerns_summary TEXT,
      participants_flagged TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'reviewed')),
      review_notes TEXT,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(formation_group_id, checkpoint_week)
    )
  `)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS student_tags (
      id ${getPK()},
      student_id TEXT NOT NULL,
      tag_name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#007aff',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, tag_name)
    )
  `)

  await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id ${getPK()},
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN (${ALL_ROLES})),
        celebration_point TEXT,
        profile_image TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

  // ─── Attendance Feature Tables ─────────────────────────────────
  await dbRun(`
    CREATE TABLE IF NOT EXISTS group_members (
      id ${getPK()},
      formation_group_id INTEGER NOT NULL,
      student_thinkific_id TEXT,
      student_name TEXT NOT NULL,
      student_email TEXT,
      added_by_user_id INTEGER,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_gm_group ON group_members(formation_group_id, active)`)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS group_sessions (
      id ${getPK()},
      formation_group_id INTEGER NOT NULL,
      session_date TEXT NOT NULL,
      week_number INTEGER,
      facilitator_user_id INTEGER,
      notes TEXT,
      did_not_meet INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_gs_group ON group_sessions(formation_group_id)`)

  await dbRun(`
    CREATE TABLE IF NOT EXISTS session_attendance (
      id ${getPK()},
      session_id INTEGER NOT NULL,
      group_member_id INTEGER NOT NULL,
      attended INTEGER DEFAULT 0,
      note TEXT,
      UNIQUE(session_id, group_member_id)
    )
  `)

  await dbRun(`CREATE INDEX IF NOT EXISTS idx_sa_session ON session_attendance(session_id)`)

  // Add name fields to formation_group_members (safe no-op if columns already exist)
  try { await dbRun('ALTER TABLE formation_group_members ADD COLUMN student_name TEXT') } catch (_) {}
  try { await dbRun('ALTER TABLE formation_group_members ADD COLUMN student_email TEXT') } catch (_) {}

  // ─── Dual Permissions: add 'roles' column (comma-separated) ───
  try { await dbRun('ALTER TABLE users ADD COLUMN roles TEXT') } catch (_) {}
  // Backfill: copy single 'role' into 'roles' for any users that haven't been migrated
  try { await dbRun("UPDATE users SET roles = role WHERE roles IS NULL") } catch (_) {}

  // ─── Co-Facilitator: add second facilitator column to formation_groups ───
  try { await dbRun('ALTER TABLE formation_groups ADD COLUMN co_facilitator_user_id INTEGER') } catch (_) {}

  // ─── Data Migration: Fix group codes to always be XXX## (3 letters + exactly 2 digits) ───
  try {
    const allGroups = await dbAll("SELECT id, group_code, name FROM formation_groups")
    for (const g of allGroups) {
      // Match codes that DON'T follow the XXX## pattern (e.g. WON010, WDT1, WDTA01, etc.)
      const valid = /^[A-Z]{3}\d{2}$/.test(g.group_code)
      if (!valid) {
        const match = g.group_code.match(/^([A-Za-z]{3})(\d+)$/)
        if (match) {
          const prefix = match[1].toUpperCase()
          const num = parseInt(match[2], 10)
          const correctCode = `${prefix}${String(num).padStart(2, '0').slice(-2)}`
          try {
            // Only update if the corrected code doesn't already exist
            const conflict = await dbGet('SELECT id FROM formation_groups WHERE group_code = ? AND id != ?', [correctCode, g.id])
            if (!conflict) {
              await dbRun("UPDATE formation_groups SET group_code = ?, name = ? WHERE id = ?", [correctCode, correctCode, g.id])
              console.log(`✅ Fixed group code: ${g.group_code} -> ${correctCode}`)
            } else {
              console.warn(`⚠️ Cannot fix ${g.group_code} -> ${correctCode}: conflict with existing group`)
            }
          } catch (updateErr) {
            console.warn(`⚠️ Could not fix ${g.group_code}: ${updateErr.message}`)
          }
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Failed to run group code normalization migration:', err.message)
  }

  // Check if admin exists
  const existingAdmin = await dbGet("SELECT id FROM users WHERE role = 'Admin'")

  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10)
    await dbRun(`
      INSERT INTO users (username, password, name, role, active)
      VALUES (?, ?, ?, ?, ?)
    `, [
      process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      hashedPassword,
      'System Administrator',
      'Admin',
      1
    ])
    console.log('✅ Default admin user created')
  }

  console.log('✅ Database schemas verified/initialized')

  await seedFormationGroups()
}

// ─── Canonical group list — seeded on every boot, skips existing rows ───────
const SEED_GROUPS = [
  // BBIRA (WBB)
  { group_code: "WBB02", celebration_point: "Bbira" },
  { group_code: "WBB03", celebration_point: "Bbira" },
  { group_code: "WBB04", celebration_point: "Bbira" },
  { group_code: "WBB06", celebration_point: "Bbira" },
  { group_code: "WBB07", celebration_point: "Bbira" },
  { group_code: "WBB10", celebration_point: "Bbira" },
  { group_code: "WBB11", celebration_point: "Bbira" },
  { group_code: "WBB12", celebration_point: "Bbira" },
  { group_code: "WBB24", celebration_point: "Bbira" },
  // BUGOLOBI (WBG)
  { group_code: "WBG02", celebration_point: "Bugolobi" },
  { group_code: "WBG06", celebration_point: "Bugolobi" },
  { group_code: "WBG08", celebration_point: "Bugolobi" },
  { group_code: "WBG09", celebration_point: "Bugolobi" },
  { group_code: "WBG11", celebration_point: "Bugolobi" },
  { group_code: "WBG12", celebration_point: "Bugolobi" },
  { group_code: "WBG15", celebration_point: "Bugolobi" },
  { group_code: "WBG16", celebration_point: "Bugolobi" },
  { group_code: "WBG19", celebration_point: "Bugolobi" },
  { group_code: "WBG20", celebration_point: "Bugolobi" },
  { group_code: "WBG21", celebration_point: "Bugolobi" },
  { group_code: "WBG22", celebration_point: "Bugolobi" },
  { group_code: "WBG23", celebration_point: "Bugolobi" },
  { group_code: "WBG24", celebration_point: "Bugolobi" },
  { group_code: "WBG25", celebration_point: "Bugolobi" },
  { group_code: "WBG26", celebration_point: "Bugolobi" },
  { group_code: "WBG27", celebration_point: "Bugolobi" },
  { group_code: "WBG28", celebration_point: "Bugolobi" },
  { group_code: "WBG29", celebration_point: "Bugolobi" },
  // BWEYOGERERE (WBW)
  { group_code: "WBW01", celebration_point: "Bweyogerere" },
  { group_code: "WBW02", celebration_point: "Bweyogerere" },
  { group_code: "WBW03", celebration_point: "Bweyogerere" },
  { group_code: "WBW04", celebration_point: "Bweyogerere" },
  { group_code: "WBW05", celebration_point: "Bweyogerere" },
  { group_code: "WBW06", celebration_point: "Bweyogerere" },
  { group_code: "WBW07", celebration_point: "Bweyogerere" },
  { group_code: "WBW08", celebration_point: "Bweyogerere" },
  { group_code: "WBW09", celebration_point: "Bweyogerere" },
  { group_code: "WBW10", celebration_point: "Bweyogerere" },
  { group_code: "WBW11", celebration_point: "Bweyogerere" },
  { group_code: "WBW12", celebration_point: "Bweyogerere" },
  { group_code: "WBW13", celebration_point: "Bweyogerere" },
  { group_code: "WBW14", celebration_point: "Bweyogerere" },
  { group_code: "WBW15", celebration_point: "Bweyogerere" },
  { group_code: "WBW16", celebration_point: "Bweyogerere" },
  { group_code: "WBW17", celebration_point: "Bweyogerere" },
  { group_code: "WBW18", celebration_point: "Bweyogerere" },
  { group_code: "WBW19", celebration_point: "Bweyogerere" },
  { group_code: "WBW20", celebration_point: "Bweyogerere" },
  { group_code: "WBW21", celebration_point: "Bweyogerere" },
  { group_code: "WBW22", celebration_point: "Bweyogerere" },
  { group_code: "WBW23", celebration_point: "Bweyogerere" },
  { group_code: "WBW24", celebration_point: "Bweyogerere" },
  { group_code: "WBW25", celebration_point: "Bweyogerere" },
  { group_code: "WBW26", celebration_point: "Bweyogerere" },
  // DOWNTOWN (WDT)
  { group_code: "WDT01", celebration_point: "Downtown" },
  { group_code: "WDT02", celebration_point: "Downtown" },
  { group_code: "WDT03", celebration_point: "Downtown" },
  { group_code: "WDT04", celebration_point: "Downtown" },
  { group_code: "WDT05", celebration_point: "Downtown" },
  { group_code: "WDT06", celebration_point: "Downtown" },
  { group_code: "WDT07", celebration_point: "Downtown" },
  { group_code: "WDT08", celebration_point: "Downtown" },
  { group_code: "WDT09", celebration_point: "Downtown" },
  { group_code: "WDT10", celebration_point: "Downtown" },
  { group_code: "WDT11", celebration_point: "Downtown" },
  { group_code: "WDT12", celebration_point: "Downtown" },
  { group_code: "WDT13", celebration_point: "Downtown" },
  { group_code: "WDT14", celebration_point: "Downtown" },
  { group_code: "WDT15", celebration_point: "Downtown" },
  { group_code: "WDT16", celebration_point: "Downtown" },
  { group_code: "WDT17", celebration_point: "Downtown" },
  { group_code: "WDT18", celebration_point: "Downtown" },
  { group_code: "WDT19", celebration_point: "Downtown" },
  { group_code: "WDT20", celebration_point: "Downtown" },
  { group_code: "WDT21", celebration_point: "Downtown" },
  { group_code: "WDT22", celebration_point: "Downtown" },
  { group_code: "WDT23", celebration_point: "Downtown" },
  { group_code: "WDT24", celebration_point: "Downtown" },
  { group_code: "WDT25", celebration_point: "Downtown" },
  // ENTEBBE (WEN)
  { group_code: "WEN03", celebration_point: "Entebbe" },
  { group_code: "WEN05", celebration_point: "Entebbe" },
  { group_code: "WEN06", celebration_point: "Entebbe" },
  { group_code: "WEN08", celebration_point: "Entebbe" },
  { group_code: "WEN11", celebration_point: "Entebbe" },
  { group_code: "WEN13", celebration_point: "Entebbe" },
  { group_code: "WEN14", celebration_point: "Entebbe" },
  { group_code: "WEN15", celebration_point: "Entebbe" },
  { group_code: "WEN16", celebration_point: "Entebbe" },
  // GULU (WGU)
  { group_code: "WGU03", celebration_point: "Gulu" },
  { group_code: "WGU06", celebration_point: "Gulu" },
  { group_code: "WGU08", celebration_point: "Gulu" },
  { group_code: "WGU10", celebration_point: "Gulu" },
  // JINJA (WJJ)
  { group_code: "WJJ01", celebration_point: "Jinja" },
  { group_code: "WJJ02", celebration_point: "Jinja" },
  { group_code: "WJJ03", celebration_point: "Jinja" },
  { group_code: "WJJ04", celebration_point: "Jinja" },
  { group_code: "WJJ05", celebration_point: "Jinja" },
  { group_code: "WJJ06", celebration_point: "Jinja" },
  { group_code: "WJJ07", celebration_point: "Jinja" },
  { group_code: "WJJ08", celebration_point: "Jinja" },
  // JUBA (WJB)
  { group_code: "WJB01", celebration_point: "Juba" },
  { group_code: "WJB02", celebration_point: "Juba" },
  { group_code: "WJB03", celebration_point: "Juba" },
  { group_code: "WJB04", celebration_point: "Juba" },
  { group_code: "WJB06", celebration_point: "Juba" },
  { group_code: "WJB07", celebration_point: "Juba" },
  { group_code: "WJB09", celebration_point: "Juba" },
  { group_code: "WJB10", celebration_point: "Juba" },
  { group_code: "WJB11", celebration_point: "Juba" },
  { group_code: "WJB12", celebration_point: "Juba" },
  { group_code: "WJB13", celebration_point: "Juba" },
  { group_code: "WJB15", celebration_point: "Juba" },
  { group_code: "WJB16", celebration_point: "Juba" },
  { group_code: "WJB17", celebration_point: "Juba" },
  { group_code: "WJB19", celebration_point: "Juba" },
  // KANSANGA (WKA) — included for completeness
  // KYENGERA (WKY)
  { group_code: "WKY01", celebration_point: "Kyengera" },
  { group_code: "WKY02", celebration_point: "Kyengera" },
  { group_code: "WKY03", celebration_point: "Kyengera" },
  { group_code: "WKY04", celebration_point: "Kyengera" },
  { group_code: "WKY05", celebration_point: "Kyengera" },
  { group_code: "WKY06", celebration_point: "Kyengera" },
  { group_code: "WKY07", celebration_point: "Kyengera" },
  { group_code: "WKY08", celebration_point: "Kyengera" },
  { group_code: "WKY09", celebration_point: "Kyengera" },
  { group_code: "WKY10", celebration_point: "Kyengera" },
  { group_code: "WKY11", celebration_point: "Kyengera" },
  { group_code: "WKY12", celebration_point: "Kyengera" },
  { group_code: "WKY13", celebration_point: "Kyengera" },
  { group_code: "WKY14", celebration_point: "Kyengera" },
  { group_code: "WKY15", celebration_point: "Kyengera" },
  { group_code: "WKY16", celebration_point: "Kyengera" },
  { group_code: "WKY18", celebration_point: "Kyengera" },
  // LUBOWA (WLB)
  { group_code: "WLB01", celebration_point: "Lubowa" },
  { group_code: "WLB02", celebration_point: "Lubowa" },
  { group_code: "WLB03", celebration_point: "Lubowa" },
  { group_code: "WLB04", celebration_point: "Lubowa" },
  { group_code: "WLB05", celebration_point: "Lubowa" },
  { group_code: "WLB07", celebration_point: "Lubowa" },
  { group_code: "WLB08", celebration_point: "Lubowa" },
  { group_code: "WLB09", celebration_point: "Lubowa" },
  { group_code: "WLB11", celebration_point: "Lubowa" },
  { group_code: "WLB12", celebration_point: "Lubowa" },
  { group_code: "WLB13", celebration_point: "Lubowa" },
  { group_code: "WLB14", celebration_point: "Lubowa" },
  { group_code: "WLB16", celebration_point: "Lubowa" },
  { group_code: "WLB17", celebration_point: "Lubowa" },
  { group_code: "WLB18", celebration_point: "Lubowa" },
  // MBARARA (WMB)
  { group_code: "WMB03", celebration_point: "Mbarara" },
  { group_code: "WMB11", celebration_point: "Mbarara" },
  // MUKONO (WMK)
  { group_code: "WMK01", celebration_point: "Mukono" },
  { group_code: "WMK02", celebration_point: "Mukono" },
  { group_code: "WMK03", celebration_point: "Mukono" },
  { group_code: "WMK04", celebration_point: "Mukono" },
  { group_code: "WMK07", celebration_point: "Mukono" },
  { group_code: "WMK08", celebration_point: "Mukono" },
  { group_code: "WMK09", celebration_point: "Mukono" },
  { group_code: "WMK10", celebration_point: "Mukono" },
  { group_code: "WMK11", celebration_point: "Mukono" },
  { group_code: "WMK12", celebration_point: "Mukono" },
  { group_code: "WMK14", celebration_point: "Mukono" },
  { group_code: "WMK15", celebration_point: "Mukono" },
  { group_code: "WMK16", celebration_point: "Mukono" },
  // NANSANA (WNW)
  { group_code: "WNW01", celebration_point: "Nansana" },
  { group_code: "WNW02", celebration_point: "Nansana" },
  { group_code: "WNW03", celebration_point: "Nansana" },
  { group_code: "WNW04", celebration_point: "Nansana" },
  { group_code: "WNW05", celebration_point: "Nansana" },
  { group_code: "WNW06", celebration_point: "Nansana" },
  { group_code: "WNW08", celebration_point: "Nansana" },
  { group_code: "WNW09", celebration_point: "Nansana" },
  { group_code: "WNW10", celebration_point: "Nansana" },
  { group_code: "WNW11", celebration_point: "Nansana" },
  { group_code: "WNW12", celebration_point: "Nansana" },
  { group_code: "WNW13", celebration_point: "Nansana" },
  { group_code: "WNW14", celebration_point: "Nansana" },
  // NTINDA (WNT)
  { group_code: "WNT01", celebration_point: "Ntinda" },
  { group_code: "WNT03", celebration_point: "Ntinda" },
  { group_code: "WNT04", celebration_point: "Ntinda" },
  { group_code: "WNT06", celebration_point: "Ntinda" },
  { group_code: "WNT07", celebration_point: "Ntinda" },
  { group_code: "WNT10", celebration_point: "Ntinda" },
  { group_code: "WNT11", celebration_point: "Ntinda" },
  { group_code: "WNT13", celebration_point: "Ntinda" },
  { group_code: "WNT14", celebration_point: "Ntinda" },
  { group_code: "WNT16", celebration_point: "Ntinda" },
  { group_code: "WNT17", celebration_point: "Ntinda" },
  { group_code: "WNT18", celebration_point: "Ntinda" },
  { group_code: "WNT19", celebration_point: "Ntinda" },
  { group_code: "WNT21", celebration_point: "Ntinda" },
  { group_code: "WNT22", celebration_point: "Ntinda" },
  { group_code: "WNT25", celebration_point: "Ntinda" },
  { group_code: "WNT26", celebration_point: "Ntinda" },
  { group_code: "WNT27", celebration_point: "Ntinda" },
  { group_code: "WNT28", celebration_point: "Ntinda" },
  { group_code: "WNT29", celebration_point: "Ntinda" },
  { group_code: "WNT30", celebration_point: "Ntinda" },
  { group_code: "WNT31", celebration_point: "Ntinda" },
  { group_code: "WNT32", celebration_point: "Ntinda" },
  { group_code: "WNT33", celebration_point: "Ntinda" },
  { group_code: "WNT37", celebration_point: "Ntinda" },
  { group_code: "WNT40", celebration_point: "Ntinda" },
  { group_code: "WNT41", celebration_point: "Ntinda" },
  { group_code: "WNT42", celebration_point: "Ntinda" },
  { group_code: "WNT43", celebration_point: "Ntinda" },
  { group_code: "WNT44", celebration_point: "Ntinda" },
  { group_code: "WNT46", celebration_point: "Ntinda" },
  { group_code: "WNT48", celebration_point: "Ntinda" },
  { group_code: "WNT50", celebration_point: "Ntinda" },
  { group_code: "WNT52", celebration_point: "Ntinda" },
  { group_code: "WNT53", celebration_point: "Ntinda" },
  { group_code: "WNT54", celebration_point: "Ntinda" },
  { group_code: "WNT55", celebration_point: "Ntinda" },
  { group_code: "WNT56", celebration_point: "Ntinda" },
  { group_code: "WNT57", celebration_point: "Ntinda" },
  { group_code: "WNT58", celebration_point: "Ntinda" },
  { group_code: "WNT59", celebration_point: "Ntinda" },
  { group_code: "WNT62", celebration_point: "Ntinda" },
  // ONLINE (WON)
  { group_code: "WON01", celebration_point: "Online" },
  { group_code: "WON02", celebration_point: "Online" },
  { group_code: "WON03", celebration_point: "Online" },
  { group_code: "WON06", celebration_point: "Online" },
  { group_code: "WON07", celebration_point: "Online" },
  // SUUBI (WSU)
  { group_code: "WSU03", celebration_point: "Suubi" },
  { group_code: "WSU06", celebration_point: "Suubi" },
]

async function seedFormationGroups() {
  const before = await dbGet('SELECT COUNT(*) as n FROM formation_groups')
  for (const g of SEED_GROUPS) {
    try {
      await dbRun(
        `INSERT INTO formation_groups (group_code, name, celebration_point, cohort, active)
         VALUES (?, ?, ?, '2026', 1)
         ON CONFLICT (group_code) DO NOTHING`,
        [g.group_code, g.group_code, g.celebration_point]
      )
    } catch (_) {}
  }
  const after = await dbGet('SELECT COUNT(*) as n FROM formation_groups')
  const created = (after?.n || 0) - (before?.n || 0)
  if (created > 0) {
    console.log(`✅ Seeded ${created} new formation group(s) (${after?.n} total)`)
  } else {
    console.log(`✅ Formation groups already seeded (${after?.n} total)`)
  }
}

export function saveDatabase() {
  if (!IS_POSTGRES && sqliteDb) {
    const data = sqliteDb.export()
    const buffer = Buffer.from(data)
    writeFileSync(dbPath, buffer)
  }
}

function pgConvert(sql) {
  let counter = 1
  return sql.replace(/\?/g, () => '$' + (counter++))
}

export async function dbGet(sql, params = []) {
  if (IS_POSTGRES) {
    const res = await pgPool.query(pgConvert(sql), params)
    return res.rows[0] || null
  } else {
    const stmt = sqliteDb.prepare(sql)
    stmt.bind(params)
    if (stmt.step()) {
      const row = stmt.getAsObject()
      stmt.free()
      return row
    }
    stmt.free()
    return null
  }
}

export async function dbAll(sql, params = []) {
  if (IS_POSTGRES) {
    const res = await pgPool.query(pgConvert(sql), params)
    return res.rows
  } else {
    const stmt = sqliteDb.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  }
}

export async function dbRun(sql, params = []) {
  let returningClause = ''
  if (IS_POSTGRES && sql.trim().toUpperCase().startsWith('INSERT')) {
    returningClause = ' RETURNING id'
  }

  if (IS_POSTGRES) {
    const res = await pgPool.query(pgConvert(sql) + returningClause, params)
    return { lastInsertRowid: res.rows[0]?.id || 0 }
  } else {
    sqliteDb.run(sql, params)
    saveDatabase()
    return { lastInsertRowid: sqliteDb.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] || 0 }
  }
}
