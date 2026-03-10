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
