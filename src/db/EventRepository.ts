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

const EVENT_TYPES: EventTypeOption[] = ['Birthday', 'Deadline', 'Vacation', 'Milestone', 'Other'];
const REPEAT_OPTIONS: RepeatOption[] = ['None', 'Yearly', 'Monthly'];
const REMINDER_OPTIONS: ReminderOption[] = ['None', '1 day before', '3 days before', '1 week before', 'On the day'];

function coerceEnum<T extends string>(value: string, allowed: T[], fallback: T): T {
  return (allowed as string[]).includes(value) ? (value as T) : fallback;
}

function safeParseNotificationIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(v => typeof v === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateIso(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function rowToEvent(row: EventRow): MicaEvent {
  return {
    id: row.id,
    title: row.title,
    dateIso: row.date_iso,
    color: row.color,
    type: coerceEnum(row.type, EVENT_TYPES, 'Other'),
    repeats: coerceEnum(row.repeats, REPEAT_OPTIONS, 'None'),
    reminder: coerceEnum(row.reminder, REMINDER_OPTIONS, 'None'),
    note: row.note,
    dayOfYear: row.day_of_year,
    notificationIds: safeParseNotificationIds(row.notification_ids),
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
    // crypto.randomUUID() is available in React Native 0.73+ via the Hermes engine
    if (!isValidDateIso(data.dateIso)) {
      throw new Error(`Invalid dateIso: ${data.dateIso}`);
    }
    const id = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
    if (patch.dateIso !== undefined && !isValidDateIso(patch.dateIso)) {
      throw new Error(`Invalid dateIso: ${patch.dateIso}`);
    }
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
