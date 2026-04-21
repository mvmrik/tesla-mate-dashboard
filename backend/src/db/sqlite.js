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

    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id   INTEGER NOT NULL DEFAULT 1,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS slot_widgets (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      block_id  INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
      slot      INTEGER NOT NULL,
      widget_id TEXT    NOT NULL,
      config    TEXT    NOT NULL DEFAULT '{}',
      UNIQUE(block_id, slot)
    );
  `);
}
