// src/db/EventRepository.ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { MicaEvent, EventTypeOption, RepeatOption, ReminderOption } from '../types';
import { dateIsoToDayOfYear } from '../utils/yearProgress';

interface EventRow {
  id: string;
  title: string;
  date_iso: string;
  color: string;
  type: string;
  repeats: string;
  reminder: string;
  note: string;
  day_of_year: number;
  notification_ids: string;
  appwrite_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEvent(row: EventRow): MicaEvent {
  return {
    id: row.id,
    title: row.title,
    dateIso: row.date_iso,
    color: row.color,
    type: row.type as EventTypeOption,
    repeats: row.repeats as RepeatOption,
    reminder: row.reminder as ReminderOption,
    note: row.note,
    dayOfYear: row.day_of_year,
    notificationIds: JSON.parse(row.notification_ids) as string[],
    appwriteId: row.appwrite_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class EventRepository {
  constructor(private db: SQLiteDatabase) {}

  async getAll(): Promise<MicaEvent[]> {
    const rows = await this.db.getAllAsync<EventRow>(
      'SELECT * FROM events WHERE deleted_at IS NULL ORDER BY date_iso ASC'
    );
    return rows.map(rowToEvent);
  }

  async getById(id: string): Promise<MicaEvent | null> {
    const row = await this.db.getFirstAsync<EventRow>(
      'SELECT * FROM events WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return row ? rowToEvent(row) : null;
  }

  async getCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM events WHERE deleted_at IS NULL'
    );
    return result?.count ?? 0;
  }

  async create(
    data: Omit<MicaEvent, 'id' | 'createdAt' | 'updatedAt' | 'appwriteId'>
  ): Promise<MicaEvent> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dayOfYear = dateIsoToDayOfYear(data.dateIso);

    await this.db.runAsync(
      `INSERT INTO events
        (id, title, date_iso, color, type, repeats, reminder, note,
         day_of_year, notification_ids, appwrite_id, deleted_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)`,
      [
        id, data.title, data.dateIso, data.color, data.type,
        data.repeats, data.reminder, data.note, dayOfYear,
        JSON.stringify(data.notificationIds ?? []), now, now,
      ]
    );
    return (await this.getById(id))!;
  }

  async update(
    id: string,
    patch: Partial<Pick<MicaEvent,
      'title' | 'dateIso' | 'color' | 'type' | 'repeats' |
      'reminder' | 'note' | 'notificationIds'>>
  ): Promise<MicaEvent> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Event ${id} not found`);
    const now = new Date().toISOString();
    const merged = { ...existing, ...patch };
    const dayOfYear = dateIsoToDayOfYear(merged.dateIso);

    await this.db.runAsync(
      `UPDATE events SET title=?, date_iso=?, color=?, type=?, repeats=?,
        reminder=?, note=?, day_of_year=?, notification_ids=?, updated_at=?
       WHERE id=?`,
      [
        merged.title, merged.dateIso, merged.color, merged.type, merged.repeats,
        merged.reminder, merged.note, dayOfYear,
        JSON.stringify(merged.notificationIds ?? []), now, id,
      ]
    );
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE events SET deleted_at=?, updated_at=? WHERE id=?',
      [now, now, id]
    );
  }

  async getSetting(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key=?',
      [key]
    );
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }
}
