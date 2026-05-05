// src/db/database.ts
import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS events (
      id               TEXT PRIMARY KEY,
      title            TEXT NOT NULL,
      date_iso         TEXT NOT NULL,
      color            TEXT NOT NULL,
      type             TEXT NOT NULL DEFAULT 'Milestone',
      repeats          TEXT NOT NULL DEFAULT 'None',
      reminder         TEXT NOT NULL DEFAULT 'None',
      note             TEXT NOT NULL DEFAULT '',
      day_of_year      INTEGER NOT NULL DEFAULT 0,
      notification_ids TEXT NOT NULL DEFAULT '[]',
      appwrite_id      TEXT,
      deleted_at       TEXT,
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO migrations (version, applied_at)
    VALUES (1, datetime('now'));
  `);
}
