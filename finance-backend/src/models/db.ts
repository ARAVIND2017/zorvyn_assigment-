import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../finance.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema — runs only if tables don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT    NOT NULL UNIQUE,
    password_hash TEXT   NOT NULL,
    role         TEXT    NOT NULL CHECK(role IN ('viewer','analyst','admin')) DEFAULT 'viewer',
    is_active    INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS records (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    amount     REAL    NOT NULL CHECK(amount > 0),
    type       TEXT    NOT NULL CHECK(type IN ('income','expense')),
    category   TEXT    NOT NULL,
    date       TEXT    NOT NULL,
    notes      TEXT,
    deleted_at TEXT    DEFAULT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    token_hash TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_records_user    ON records(user_id);
  CREATE INDEX IF NOT EXISTS idx_records_date    ON records(date);
  CREATE INDEX IF NOT EXISTS idx_records_type    ON records(type);
  CREATE INDEX IF NOT EXISTS idx_records_category ON records(category);
  CREATE INDEX IF NOT EXISTS idx_sessions_token  ON sessions(token_hash);
`);

export default db;
