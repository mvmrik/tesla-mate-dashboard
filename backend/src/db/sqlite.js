import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || '/data';
const DB_PATH = path.join(DATA_DIR, 'settings.db');

let db = null;

export function getSqlite() {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db) {
  // Add size column if missing (migration from older schema)
  try {
    db.exec(`ALTER TABLE widget_layout ADD COLUMN size TEXT NOT NULL DEFAULT 'medium'`);
  } catch {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS monthly_tariffs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      geofence_id   INTEGER NOT NULL,
      geofence_name TEXT    NOT NULL,
      month         INTEGER NOT NULL,
      night_start   INTEGER NOT NULL DEFAULT 22,
      night_end     INTEGER NOT NULL DEFAULT 6,
      price_day     REAL    NOT NULL,
      price_night   REAL    NOT NULL,
      valid_from    TEXT    NOT NULL,
      UNIQUE(geofence_id, month, valid_from)
    );

    CREATE TABLE IF NOT EXISTS widget_layout (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id    INTEGER NOT NULL DEFAULT 1,
      widget_id TEXT    NOT NULL,
      position  INTEGER NOT NULL DEFAULT 0,
      enabled   INTEGER NOT NULL DEFAULT 1,
      size      TEXT    NOT NULL DEFAULT 'medium',
      UNIQUE(car_id, widget_id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS links (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      url      TEXT NOT NULL,
      title    TEXT NOT NULL DEFAULT '',
      favicon  TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0
    );
  `);

  // All known widgets — new ones get added automatically if missing
  const ALL_WIDGETS = [
    'battery', 'tpms', 'climate',
    'monthly_driving', 'monthly_consumption',
    'recent_drives', 'charge_cost', 'links'
  ];

  const ins = db.prepare(
    'INSERT OR IGNORE INTO widget_layout (car_id, widget_id, position, enabled) VALUES (1, ?, ?, 1)'
  );
  // Find highest existing position
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM widget_layout WHERE car_id = 1').get().m;
  let pos = maxPos + 1;
  for (const id of ALL_WIDGETS) {
    const exists = db.prepare('SELECT 1 FROM widget_layout WHERE car_id = 1 AND widget_id = ?').get(id);
    if (!exists) ins.run(id, pos++);
  }
}
