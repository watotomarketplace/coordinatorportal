import { Pool } from 'pg'
import initSqlJs from 'sql.js'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'

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
