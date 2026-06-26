// src/db/database.ts
import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Bootstrap the migrations table before querying it
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT COALESCE(MAX(version), 0) AS version FROM migrations'
  );
  const currentVersion = row?.version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
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

      -- Partial index: only active (non-deleted) events, ordered by date
      CREATE INDEX IF NOT EXISTS idx_events_date_iso
        ON events (date_iso)
        WHERE deleted_at IS NULL;

      INSERT INTO migrations (version, applied_at) VALUES (1, datetime('now'));
    `);
  }

  // Future migrations: add `if (currentVersion < 2) { ... }` blocks here
}
