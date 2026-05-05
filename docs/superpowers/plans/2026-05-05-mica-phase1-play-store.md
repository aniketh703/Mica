# Mica Phase 1 — Play Store MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire all 6 screens to real SQLite data, polish both year grids, add local notifications, enforce the 12-event free limit, configure EAS builds, and produce a Play Store-ready `.aab`.

**Architecture:** `SQLiteProvider` (expo-sqlite) wraps the app root. `EventRepository` is a class receiving the DB instance and implementing all CRUD. `useEventRepository()` and `useEvents()` are thin hooks over it. `PremiumContext` holds the free-tier gate — Phase 1 always returns `isPremium = false`. `NotificationService` is a static-method class wrapping `expo-notifications`. Screens never import SQLite or expo-notifications directly.

**Tech Stack:** React Native 0.83.6, Expo SDK 55, expo-sqlite v15, expo-notifications, @react-native-community/datetimepicker, @react-native-clipboard/clipboard, @sentry/react-native, expo-constants, Expo EAS Build, GitHub Actions

> **Phase scope:** Phase 1 only. Phase 2 (Google Play Billing + Appwrite sync + ConfigCat) is a separate plan.

---

## File Map

### New files
| File | Purpose |
|---|---|
| `src/db/database.ts` | SQLite migration SQL + `migrateDatabase` function |
| `src/db/EventRepository.ts` | All CRUD against SQLite |
| `src/db/__tests__/EventRepository.test.ts` | Repository unit tests |
| `src/contexts/PremiumContext.tsx` | isPremium gate + PremiumRequiredError |
| `src/hooks/useEventRepository.ts` | Returns memoized EventRepository |
| `src/hooks/useEvents.ts` | Reactive events list |
| `src/hooks/useSettings.ts` | Read/write SQLite settings table |
| `src/services/NotificationService.ts` | expo-notifications static wrapper |
| `src/services/__tests__/NotificationService.test.ts` | Scheduling logic tests |
| `src/utils/__tests__/yearProgress.test.ts` | Grid utility pure-function tests |
| `docs/privacy-policy.md` | Privacy policy for GitHub Pages |
| `.github/workflows/ci.yml` | CI: type-check + test + lint |
| `eas.json` | EAS build profiles |

### Modified files
| File | Changes |
|---|---|
| `src/types/index.ts` | MicaEvent uses uuid id + dateIso; EventDetail nav param → `{ eventId: string }` |
| `src/utils/yearProgress.ts` | Add dateIsoToDayOfYear, getDaysLeft, formatDisplayDate, buildCellData, buildLifeCells |
| `src/components/YearGrid.tsx` | Dynamic cell size, event color markers, staggered animation |
| `src/components/LifeCalendarGrid.tsx` | Dynamic cell size, real event date, countdown range |
| `src/screens/HomeScreen.tsx` | useEvents hook, live daysLeft, remove hardcoded EVENTS |
| `src/screens/EventsScreen.tsx` | useEvents hook, filter chips, empty state |
| `src/screens/AddEventScreen.tsx` | datetimepicker, save to repo, schedule notification |
| `src/screens/EventDetailScreen.tsx` | Load from repo by eventId, edit/delete |
| `src/screens/SettingsScreen.tsx` | Theme persistence, notifications toggle, version |
| `src/screens/InviteScreen.tsx` | Clipboard copy, Share sheet |
| `src/screens/MainScreen.tsx` | Wrap with PremiumProvider |
| `App.tsx` | SQLiteProvider, Sentry.init, notification deep-link listener |
| `app.json` | Android package, adaptiveIcon, permissions, plugins |

---

## Task 1: Install Phase 1 dependencies

**Files:** `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npx expo install expo-sqlite expo-notifications expo-constants @react-native-community/datetimepicker @react-native-clipboard/clipboard @sentry/react-native
```

- [ ] **Step 2: Verify installs added to package.json**

```bash
npx json -f package.json dependencies | grep -E "expo-sqlite|expo-notifications|datetimepicker|clipboard|sentry"
```

Expected: all 5 packages listed with version numbers.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Phase 1 dependencies"
```

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
// src/types/index.ts

export interface MicaEvent {
  id: string;           // uuid (was number)
  title: string;
  dateIso: string;      // "YYYY-MM-DD" (was formatted "May 3")
  color: string;
  type: string;         // 'Birthday' | 'Deadline' | 'Vacation' | 'Milestone' | 'Other'
  repeats: string;      // 'None' | 'Yearly' | 'Monthly'
  reminder: string;     // 'None' | '1 day before' | '3 days before' | '1 week before' | 'On the day'
  note: string;
  dayOfYear: number;    // derived from dateIso on write
  notificationIds: string[];  // expo-notifications identifiers
  appwriteId: string | null;  // null until Phase 2 sync
  createdAt: string;
  updatedAt: string;
}

export type TabName = 'home' | 'events' | 'settings';

export type RootStackParamList = {
  Main: undefined;
  EventDetail: { eventId: string };   // changed from { event: MicaEvent }
  AddEvent: { eventId?: string };     // eventId present = edit mode
  Invite: undefined;
};

export type EventTypeOption = 'Birthday' | 'Deadline' | 'Vacation' | 'Milestone' | 'Other';
export type RepeatOption = 'None' | 'Yearly' | 'Monthly';
export type ReminderOption = 'None' | '1 day before' | '3 days before' | '1 week before' | 'On the day';

export interface CellData {
  doy: number;
  state: 'past' | 'today' | 'future' | 'event';
  eventColor?: string;
}

export interface LifeCellData {
  doy: number;
  week: number;
  dow: number;
  state: 'past' | 'today' | 'countdown' | 'event' | 'future';
}
```

- [ ] **Step 2: Run type-check — expect errors (screens still use old types)**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -40
```

Expected: errors referencing `event.date`, `event.daysLeft`, `event: MicaEvent` nav params. These get fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): update MicaEvent to uuid+dateIso, fix EventDetail nav param"
```

---

## Task 3: SQLite database setup

**Files:**
- Create: `src/db/database.ts`

- [ ] **Step 1: Create the migration function**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/db/database.ts
git commit -m "feat(db): add SQLite schema migration"
```

---

## Task 4: EventRepository — CRUD

**Files:**
- Create: `src/db/EventRepository.ts`
- Create: `src/db/__tests__/EventRepository.test.ts`

- [ ] **Step 1: Write the failing tests first**

```typescript
// src/db/__tests__/EventRepository.test.ts
import * as SQLite from 'expo-sqlite';
import { EventRepository } from '../EventRepository';
import { migrateDatabase } from '../database';

jest.mock('expo-sqlite');

// In-memory DB helper
async function makeRepo(): Promise<EventRepository> {
  const db = await (SQLite as any).openDatabaseAsync(':memory:');
  await migrateDatabase(db);
  return new EventRepository(db);
}

const SAMPLE: Parameters<EventRepository['create']>[0] = {
  title: 'Mum birthday',
  dateIso: '2026-05-03',
  color: '#C86B5A',
  type: 'Birthday',
  repeats: 'Yearly',
  reminder: '1 day before',
  note: 'Get flowers',
  dayOfYear: 123,
  notificationIds: [],
};

describe('EventRepository', () => {
  it('creates and retrieves an event', async () => {
    const repo = await makeRepo();
    const created = await repo.create(SAMPLE);
    expect(created.id).toHaveLength(36); // uuid
    expect(created.title).toBe('Mum birthday');
    expect(created.dateIso).toBe('2026-05-03');

    const fetched = await repo.getById(created.id);
    expect(fetched?.title).toBe('Mum birthday');
  });

  it('getAll returns only non-deleted events', async () => {
    const repo = await makeRepo();
    const ev = await repo.create(SAMPLE);
    await repo.delete(ev.id);
    const all = await repo.getAll();
    expect(all).toHaveLength(0);
  });

  it('update changes fields', async () => {
    const repo = await makeRepo();
    const ev = await repo.create(SAMPLE);
    const updated = await repo.update(ev.id, { title: 'Dad birthday' });
    expect(updated.title).toBe('Dad birthday');
  });

  it('getCount excludes deleted', async () => {
    const repo = await makeRepo();
    await repo.create(SAMPLE);
    const ev2 = await repo.create({ ...SAMPLE, title: 'Other' });
    await repo.delete(ev2.id);
    expect(await repo.getCount()).toBe(1);
  });

  it('settings round-trip', async () => {
    const repo = await makeRepo();
    await repo.setSetting('theme', 'dark');
    expect(await repo.getSetting('theme')).toBe('dark');
    expect(await repo.getSetting('missing')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (EventRepository not yet created)**

```bash
npx jest src/db/__tests__/EventRepository.test.ts --no-coverage
```

Expected: `Cannot find module '../EventRepository'`

- [ ] **Step 3: Implement EventRepository**

```typescript
// src/db/EventRepository.ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { MicaEvent } from '../types';
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
    type: row.type,
    repeats: row.repeats,
    reminder: row.reminder,
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest src/db/__tests__/EventRepository.test.ts --no-coverage
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add src/db/
git commit -m "feat(db): add EventRepository with full CRUD and settings helpers"
```

---

## Task 5: Grid utility functions

**Files:**
- Modify: `src/utils/yearProgress.ts`
- Create: `src/utils/__tests__/yearProgress.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/utils/__tests__/yearProgress.test.ts
import {
  dateIsoToDayOfYear,
  getDaysLeft,
  formatDisplayDate,
  isCountdownRange,
  buildCellData,
  buildLifeCells,
  getYearProgress,
} from '../yearProgress';

describe('dateIsoToDayOfYear', () => {
  it('Jan 1 = 1', () => expect(dateIsoToDayOfYear('2026-01-01')).toBe(1));
  it('May 3 = 123', () => expect(dateIsoToDayOfYear('2026-05-03')).toBe(123));
  it('Dec 31 = 365', () => expect(dateIsoToDayOfYear('2026-12-31')).toBe(365));
});

describe('getDaysLeft', () => {
  it('returns positive for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const iso = future.toISOString().slice(0, 10);
    expect(getDaysLeft(iso)).toBe(10);
  });

  it('returns 0 for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(getDaysLeft(today)).toBe(0);
  });
});

describe('formatDisplayDate', () => {
  it('formats 2026-05-03 as May 3', () => {
    expect(formatDisplayDate('2026-05-03')).toBe('May 3');
  });
});

describe('isCountdownRange', () => {
  it('true when doy is between today and event', () => {
    expect(isCountdownRange(50, 40, 60)).toBe(true);
  });
  it('false when doy is before today', () => {
    expect(isCountdownRange(30, 40, 60)).toBe(false);
  });
  it('false when doy equals event', () => {
    expect(isCountdownRange(60, 40, 60)).toBe(false);
  });
});

describe('buildCellData', () => {
  it('returns 365 cells', () => {
    const yp = getYearProgress();
    expect(buildCellData(yp, [])).toHaveLength(365);
  });

  it('marks today cell as today', () => {
    const yp = getYearProgress();
    const cells = buildCellData(yp, []);
    const today = cells.find(c => c.state === 'today');
    expect(today?.doy).toBe(yp.dayOfYear);
  });

  it('marks event day with event color', () => {
    const yp = getYearProgress();
    const fakeEvent = {
      id: '1', title: 'Test', dateIso: '2026-12-25',
      color: '#FF0000', type: 'Birthday', repeats: 'None',
      reminder: 'None', note: '', dayOfYear: 359,
      notificationIds: [], appwriteId: null,
      createdAt: '', updatedAt: '',
    };
    const cells = buildCellData(yp, [fakeEvent]);
    const eventCell = cells.find(c => c.doy === 359);
    expect(eventCell?.state).toBe('event');
    expect(eventCell?.eventColor).toBe('#FF0000');
  });
});

describe('buildLifeCells', () => {
  it('returns 365 cells', () => {
    const yp = getYearProgress();
    expect(buildLifeCells(yp, 200)).toHaveLength(365);
  });

  it('marks event doy as event state', () => {
    const yp = getYearProgress();
    const cells = buildLifeCells(yp, 300);
    expect(cells.find(c => c.doy === 300)?.state).toBe('event');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest src/utils/__tests__/yearProgress.test.ts --no-coverage
```

Expected: `Cannot find module` or missing export errors.

- [ ] **Step 3: Add utility functions to yearProgress.ts**

Append to the bottom of `src/utils/yearProgress.ts`:

```typescript
import type { MicaEvent, CellData, LifeCellData } from '../types';

export function dateIsoToDayOfYear(dateIso: string): number {
  const date = new Date(dateIso + 'T00:00:00');
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

export function getDaysLeft(dateIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(dateIso + 'T00:00:00');
  event.setHours(0, 0, 0, 0);
  return Math.ceil((event.getTime() - today.getTime()) / 86400000);
}

export function formatDisplayDate(dateIso: string): string {
  return new Date(dateIso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

export function isCountdownRange(doy: number, todayDoy: number, eventDoy: number): boolean {
  return doy > todayDoy && doy < eventDoy;
}

export function buildCellData(yp: ReturnType<typeof getYearProgress>, events: MicaEvent[]): CellData[] {
  const eventMap = new Map(
    events.filter(e => e.dayOfYear > 0).map(e => [e.dayOfYear, e.color])
  );
  return Array.from({ length: 365 }, (_, i) => {
    const doy = i + 1;
    if (eventMap.has(doy)) {
      return { doy, state: 'event' as const, eventColor: eventMap.get(doy) };
    }
    if (doy < yp.dayOfYear) return { doy, state: 'past' as const };
    if (doy === yp.dayOfYear) return { doy, state: 'today' as const };
    return { doy, state: 'future' as const };
  });
}

export function buildLifeCells(
  yp: ReturnType<typeof getYearProgress>,
  eventDoy: number
): LifeCellData[] {
  return Array.from({ length: 365 }, (_, i) => {
    const doy = i + 1;
    const week = Math.floor(i / 7);
    const dow = i % 7;
    let state: LifeCellData['state'];
    if (doy === eventDoy) state = 'event';
    else if (doy === yp.dayOfYear) state = 'today';
    else if (isCountdownRange(doy, yp.dayOfYear, eventDoy)) state = 'countdown';
    else if (doy < yp.dayOfYear) state = 'past';
    else state = 'future';
    return { doy, week, dow, state };
  });
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest src/utils/__tests__/yearProgress.test.ts --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/yearProgress.ts src/utils/__tests__/yearProgress.test.ts
git commit -m "feat(utils): add grid utility functions with tests"
```

---

## Task 6: Hooks — useEventRepository + useEvents + useSettings

**Files:**
- Create: `src/hooks/useEventRepository.ts`
- Create: `src/hooks/useEvents.ts`
- Create: `src/hooks/useSettings.ts`

- [ ] **Step 1: Create useEventRepository**

```typescript
// src/hooks/useEventRepository.ts
import { useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { EventRepository } from '../db/EventRepository';

export function useEventRepository(): EventRepository {
  const db = useSQLiteContext();
  return useMemo(() => new EventRepository(db), [db]);
}
```

- [ ] **Step 2: Create useEvents**

```typescript
// src/hooks/useEvents.ts
import { useState, useEffect, useCallback } from 'react';
import type { MicaEvent } from '../types';
import { useEventRepository } from './useEventRepository';

export function useEvents() {
  const repo = useEventRepository();
  const [events, setEvents] = useState<MicaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await repo.getAll();
    setEvents(data);
    setLoading(false);
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { events, loading, refresh };
}
```

- [ ] **Step 3: Create useSettings**

```typescript
// src/hooks/useSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { useEventRepository } from './useEventRepository';

export function useSettings() {
  const repo = useEventRepository();
  const [theme, setThemeState] = useState<'system' | 'light' | 'dark'>('system');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);

  useEffect(() => {
    void (async () => {
      const t = await repo.getSetting('theme');
      if (t === 'light' || t === 'dark' || t === 'system') setThemeState(t);
      const n = await repo.getSetting('notifications_enabled');
      if (n !== null) setNotificationsEnabledState(n === 'true');
    })();
  }, [repo]);

  const setTheme = useCallback(async (value: 'system' | 'light' | 'dark') => {
    await repo.setSetting('theme', value);
    setThemeState(value);
  }, [repo]);

  const setNotificationsEnabled = useCallback(async (value: boolean) => {
    await repo.setSetting('notifications_enabled', String(value));
    setNotificationsEnabledState(value);
  }, [repo]);

  return { theme, notificationsEnabled, setTheme, setNotificationsEnabled };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat(hooks): add useEventRepository, useEvents, useSettings"
```

---

## Task 7: PremiumContext (Phase 1 — free tier)

**Files:**
- Create: `src/contexts/PremiumContext.tsx`

- [ ] **Step 1: Create PremiumContext**

```typescript
// src/contexts/PremiumContext.tsx
import React, { createContext, useContext, type ReactNode } from 'react';

export const FREE_EVENT_LIMIT = 12;

export class PremiumRequiredError extends Error {
  constructor() {
    super(`Free tier limit: ${FREE_EVENT_LIMIT} events maximum`);
    this.name = 'PremiumRequiredError';
  }
}

interface PremiumContextValue {
  isPremium: boolean;
  isLoading: boolean;
  purchasePremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  // Phase 1: always free. Phase 2 wires react-native-iap here.
  const value: PremiumContextValue = {
    isPremium: false,
    isLoading: false,
    purchasePremium: async () => {
      // Phase 2: trigger Google Play Billing
    },
    restorePurchases: async () => {
      // Phase 2: getAvailablePurchases
    },
  };

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used inside PremiumProvider');
  return ctx;
}
```

- [ ] **Step 2: Wrap MainScreen children with PremiumProvider**

In `src/screens/MainScreen.tsx`, import and wrap:

```typescript
// src/screens/MainScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { mica, midnight } from '../theme/palette';
import { RootStackParamList, TabName } from '../types';
import { PremiumProvider } from '../contexts/PremiumContext';
import HomeScreen from './HomeScreen';
import EventsScreen from './EventsScreen';
import SettingsScreen from './SettingsScreen';
import TabBar from '../components/TabBar';

type Props = { navigation: StackNavigationProp<RootStackParamList> };

const styles = StyleSheet.create({ root: { flex: 1 } });

export default function MainScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? midnight : mica;

  return (
    <PremiumProvider>
      <View style={[styles.root, { backgroundColor: t.background }]}>
        {activeTab === 'home' && <HomeScreen navigation={navigation} t={t} />}
        {activeTab === 'events' && <EventsScreen navigation={navigation} t={t} />}
        {activeTab === 'settings' && <SettingsScreen navigation={navigation} t={t} />}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} t={t} />
      </View>
    </PremiumProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contexts/PremiumContext.tsx src/screens/MainScreen.tsx
git commit -m "feat(premium): add PremiumContext Phase 1 (free tier gate)"
```

---

## Task 8: NotificationService

**Files:**
- Create: `src/services/NotificationService.ts`
- Create: `src/services/__tests__/NotificationService.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/services/__tests__/NotificationService.test.ts
import { NotificationService } from '../NotificationService';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-id-1'),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

import * as Notifications from 'expo-notifications';

const FUTURE_EVENT = {
  id: 'abc',
  title: 'Mum Birthday',
  dateIso: '2027-05-03',
  color: '#C86B5A',
  type: 'Birthday',
  repeats: 'None' as const,
  reminder: '1 day before' as const,
  note: '',
  dayOfYear: 123,
  notificationIds: [],
  appwriteId: null,
  createdAt: '',
  updatedAt: '',
};

describe('NotificationService', () => {
  afterEach(() => jest.clearAllMocks());

  it('scheduleReminder returns array of notification ids', async () => {
    const ids = await NotificationService.scheduleReminder(FUTURE_EVENT);
    expect(ids).toHaveLength(1);
    expect(ids[0]).toBe('mock-id-1');
  });

  it('returns empty array when reminder is None', async () => {
    const ids = await NotificationService.scheduleReminder({
      ...FUTURE_EVENT,
      reminder: 'None',
    });
    expect(ids).toHaveLength(0);
  });

  it('schedules 3 occurrences for yearly repeating events', async () => {
    const ids = await NotificationService.scheduleReminder({
      ...FUTURE_EVENT,
      repeats: 'Yearly',
    });
    expect(ids).toHaveLength(3);
  });

  it('cancelReminders cancels each id', async () => {
    await NotificationService.cancelReminders(['id1', 'id2']);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest src/services/__tests__/NotificationService.test.ts --no-coverage
```

Expected: `Cannot find module '../NotificationService'`

- [ ] **Step 3: Implement NotificationService**

```typescript
// src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { MicaEvent } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const OFFSET_DAYS: Record<string, number> = {
  'On the day': 0,
  '1 day before': 1,
  '3 days before': 3,
  '1 week before': 7,
};

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Mica Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  static async scheduleReminder(event: MicaEvent): Promise<string[]> {
    if (event.reminder === 'None') return [];

    const offset = OFFSET_DAYS[event.reminder] ?? 0;
    const occurrences = event.repeats === 'None' ? 1 : 3;
    const ids: string[] = [];

    for (let i = 0; i < occurrences; i++) {
      const trigger = new Date(`${event.dateIso}T09:00:00`);
      trigger.setFullYear(trigger.getFullYear() + i);
      trigger.setDate(trigger.getDate() - offset);

      if (trigger <= new Date()) continue;

      const labelDays = offset === 0 ? 'today' : `in ${offset} day${offset > 1 ? 's' : ''}`;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${event.title} ${labelDays}`,
          body: `${event.dateIso} · ${event.type}`,
          data: { eventId: event.id },
        },
        trigger: { date: trigger },
      });
      ids.push(id);
    }

    return ids;
  }

  static async cancelReminders(notificationIds: string[]): Promise<void> {
    await Promise.all(
      notificationIds.map(id => Notifications.cancelScheduledNotificationAsync(id))
    );
  }

  static async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async rescheduleAll(events: MicaEvent[]): Promise<void> {
    await NotificationService.cancelAll();
    for (const event of events) {
      if (event.reminder !== 'None') {
        await NotificationService.scheduleReminder(event);
      }
    }
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest src/services/__tests__/NotificationService.test.ts --no-coverage
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add src/services/
git commit -m "feat(notifications): add NotificationService with scheduling tests"
```

---

## Task 9: YearGrid — polish

**Files:**
- Modify: `src/components/YearGrid.tsx`

- [ ] **Step 1: Replace YearGrid.tsx**

```typescript
// src/components/YearGrid.tsx
import React, { useMemo, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions, AppState } from 'react-native';
import type { Theme } from '../theme/palette';
import type { MicaEvent } from '../types';
import { getYearProgress, buildCellData } from '../utils/yearProgress';

type Props = {
  t: Theme;
  events?: MicaEvent[];
};

const COLS = 25;
const CARD_PADDING = 44; // 22px × 2 sides
const GAP = 2;

export default function YearGrid({ t, events = [] }: Props) {
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - CARD_PADDING - GAP * (COLS - 1)) / COLS);

  const [yp, setYp] = React.useState(getYearProgress());
  const rowAnims = useRef(Array.from({ length: 15 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const stagger = Animated.stagger(
      8,
      rowAnims.map(anim =>
        Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true })
      )
    );
    stagger.start();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') setYp(getYearProgress());
    });
    return () => sub.remove();
  }, []);

  const cells = useMemo(() => buildCellData(yp, events), [yp, events]);

  const rows: typeof cells[] = [];
  for (let r = 0; r < 15; r++) rows.push(cells.slice(r * COLS, r * COLS + COLS));

  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <Animated.View
          key={ri}
          style={[styles.row, { opacity: rowAnims[ri], transform: [{ translateY: rowAnims[ri].interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }]}
        >
          {row.map(cell => {
            const isToday = cell.state === 'today';
            const isEvent = cell.state === 'event';
            const bg =
              isEvent
                ? cell.eventColor!
                : isToday
                ? t.surface
                : cell.state === 'past'
                ? t.accent
                : t.surfaceMuted;

            return (
              <View
                key={cell.doy}
                style={[
                  {
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 1.5,
                    backgroundColor: bg,
                    opacity: isToday ? 1 : cell.state === 'future' ? 0.4 : isEvent ? 0.9 : 0.7,
                  },
                  isToday && {
                    borderWidth: 1.5,
                    borderColor: t.accentStrong,
                    shadowColor: t.accentStrong,
                    shadowRadius: 3,
                    elevation: 3,
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/YearGrid.tsx
git commit -m "feat(YearGrid): dynamic sizing, event markers, staggered animation"
```

---

## Task 10: LifeCalendarGrid — polish

**Files:**
- Modify: `src/components/LifeCalendarGrid.tsx`

- [ ] **Step 1: Replace LifeCalendarGrid.tsx**

```typescript
// src/components/LifeCalendarGrid.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { Theme } from '../theme/palette';
import type { MicaEvent } from '../types';
import { getYearProgress, buildLifeCells, dateIsoToDayOfYear } from '../utils/yearProgress';

type Props = { t: Theme; event: MicaEvent };

const COLS = 52;
const CARD_PADDING = 44;
const GAP = 1.5;

export default function LifeCalendarGrid({ t, event }: Props) {
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - CARD_PADDING - GAP * (COLS - 1)) / COLS);
  const yp = useMemo(() => getYearProgress(), []);
  const eventDoy = useMemo(() => dateIsoToDayOfYear(event.dateIso), [event.dateIso]);
  const cells = useMemo(() => buildLifeCells(yp, eventDoy), [yp, eventDoy]);

  // Build 7-row × 52-col grid (week-major)
  const grid: (typeof cells[0] | null)[][] = Array.from({ length: 7 }, () =>
    Array<null>(52).fill(null)
  );
  cells.forEach(cell => {
    if (cell.week < 52 && cell.dow < 7) grid[cell.dow][cell.week] = cell;
  });

  return (
    <View>
      <View style={styles.grid}>
        {grid.map((rowCells, row) => (
          <View key={row} style={[styles.row, { gap: GAP }]}>
            {rowCells.map((cell, col) => {
              if (!cell) return <View key={col} style={{ width: cellSize, height: cellSize }} />;
              const isEvent = cell.state === 'event';
              const isToday = cell.state === 'today';
              const isCountdown = cell.state === 'countdown';

              const bg =
                isEvent
                  ? event.color
                  : isToday
                  ? t.surface
                  : cell.state === 'past'
                  ? t.accent
                  : t.surfaceMuted;

              return (
                <View
                  key={col}
                  style={[
                    {
                      width: isEvent ? cellSize * 1.3 : cellSize,
                      height: isEvent ? cellSize * 1.3 : cellSize,
                      borderRadius: cellSize,
                      backgroundColor: isCountdown ? 'transparent' : bg,
                      opacity:
                        isEvent ? 1
                        : isToday ? 1
                        : isCountdown ? 0.6
                        : cell.state === 'past' ? 0.5
                        : 0.3,
                    },
                    isToday && { borderWidth: 2, borderColor: t.accentStrong },
                    isCountdown && { borderWidth: 1, borderColor: event.color },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Axis labels */}
      <View style={styles.axisRow}>
        <Text style={[styles.axisLabel, { color: t.textMuted }]}>W1</Text>
        <Text style={[styles.axisLabel, { color: t.textMuted }]}>W26</Text>
        <Text style={[styles.axisLabel, { color: t.textMuted }]}>W52</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { label: 'Past', color: t.accent },
          { label: 'Today', color: t.accentStrong, border: true },
          { label: 'Countdown', color: event.color, border: true, transparent: true },
          { label: 'Event', color: event.color },
        ].map(({ label, color, border, transparent }) => (
          <View key={label} style={styles.legendItem}>
            <View
              style={{
                width: 7, height: 7, borderRadius: 4,
                backgroundColor: transparent ? 'transparent' : color,
                borderWidth: border ? 1.2 : 0,
                borderColor: color,
              }}
            />
            <Text style={[styles.legendText, { color: t.textMuted }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 1.5 },
  row: { flexDirection: 'row' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisLabel: { fontSize: 10 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { fontSize: 10 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LifeCalendarGrid.tsx
git commit -m "feat(LifeCalendarGrid): dynamic sizing, countdown range, event day highlight"
```

---

## Task 11: HomeScreen — real data

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Replace HomeScreen.tsx**

```typescript
// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Theme } from '../theme/palette';
import { RootStackParamList } from '../types';
import { getYearProgress, getRemainingCopy, getDaysLeft, formatDisplayDate } from '../utils/yearProgress';
import { useEvents } from '../hooks/useEvents';
import YearGrid from '../components/YearGrid';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  t: Theme;
};

export default function HomeScreen({ navigation, t }: Props) {
  const { events } = useEvents();
  const yp = getYearProgress();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const upcoming = events.filter(e => getDaysLeft(e.dateIso) >= 0);
  const next = upcoming[0];

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.bloom, { backgroundColor: t.surfaceStrong }]} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.dateHeader}>
          <Text style={[styles.dayName, { color: t.textMuted }]}>{dayName.toUpperCase()}</Text>
          <Text style={[styles.dateStr, { color: t.text }]}>{dateStr}</Text>
        </View>

        {next ? (
          <TouchableOpacity
            style={[styles.card, styles.cardLarge, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => navigation.navigate('EventDetail', { eventId: next.id })}
            activeOpacity={0.85}
          >
            <View style={[styles.cardBloom, { backgroundColor: next.color }]} />
            <Text style={[styles.eyebrow, { color: t.textMuted }]}>NEXT UP</Text>
            <View style={styles.nextUpRow}>
              <View style={styles.nextUpLeft}>
                <View style={styles.nextUpTitleRow}>
                  <View style={[styles.colorBar, { backgroundColor: next.color, height: 36 }]} />
                  <Text style={[styles.nextUpTitle, { color: t.text }]}>{next.title}</Text>
                </View>
                <Text style={[styles.nextUpDate, { color: t.textMuted }]}>{formatDisplayDate(next.dateIso)}</Text>
              </View>
              <View style={styles.countdownBlock}>
                <Text style={[styles.countdownNum, { color: next.color }]}>{getDaysLeft(next.dateIso)}</Text>
                <Text style={[styles.countdownLabel, { color: t.textMuted }]}>days</Text>
              </View>
            </View>
            <View style={[styles.progressBg, { backgroundColor: t.surfaceMuted }]}>
              <View style={[styles.progressFill, { backgroundColor: next.color, width: `${100 - (getDaysLeft(next.dateIso) / 365) * 100}%` as any }]} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.card, styles.cardLarge, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.eyebrow, { color: t.textMuted }]}>NEXT UP</Text>
            <Text style={[styles.nextUpTitle, { color: t.textMuted, marginTop: 12 }]}>No upcoming events — add one!</Text>
          </View>
        )}

        <View style={[styles.card, styles.cardLarge, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.cardBloom, { backgroundColor: t.accentSoft, opacity: 0.38 }]} />
          <View style={styles.yearHeaderRow}>
            <View>
              <Text style={[styles.eyebrow, { color: t.textMuted }]}>YEAR IN MOTION</Text>
              <Text style={[styles.yearTitle, { color: t.text }]}>{getRemainingCopy(yp.daysRemaining)}</Text>
              <Text style={[styles.yearSubtitle, { color: t.textMuted }]}>Day {yp.dayOfYear} of {yp.totalDays} · {yp.percentComplete}%</Text>
            </View>
            <Text style={[styles.yearWatermark, { color: t.textMuted }]}>{yp.year}</Text>
          </View>
          <YearGrid t={t} events={events} />
          <View style={styles.legendRow}>
            <View style={[styles.legendLine, { backgroundColor: t.accentStrong }]} />
            <Text style={[styles.legendText, { color: t.textMuted }]}>The bright ring marks today.</Text>
          </View>
        </View>

        {upcoming.slice(1, 4).length > 0 && (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.sectionTitle, { color: t.text }]}>More coming up</Text>
            {upcoming.slice(1, 4).map((ev, i, arr) => (
              <TouchableOpacity
                key={ev.id}
                style={[styles.eventRow, { borderBottomColor: t.border }, i < arr.length - 1 && styles.eventRowBorder]}
                onPress={() => navigation.navigate('EventDetail', { eventId: ev.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.colorBar, { backgroundColor: ev.color, height: 34 }]} />
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: t.text }]}>{ev.title}</Text>
                  <Text style={[styles.eventDate, { color: t.textMuted }]}>{formatDisplayDate(ev.dateIso)}</Text>
                </View>
                <Text style={[styles.daysLeft, { color: t.textMuted }]}>{getDaysLeft(ev.dateIso)}d</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  bloom: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -30, right: -90, opacity: 0.55 },
  scroll: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 82 },
  content: { padding: 22, paddingTop: 56, gap: 16 },
  dateHeader: { paddingTop: 8, gap: 2 },
  dayName: { fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  dateStr: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, lineHeight: 34 },
  card: { borderRadius: 28, padding: 20, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  cardLarge: { gap: 14 },
  cardBloom: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -80, right: -60, opacity: 0.12 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.5 },
  nextUpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  nextUpLeft: { flex: 1, gap: 6 },
  nextUpTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorBar: { width: 10, borderRadius: 999, flexShrink: 0 },
  nextUpTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  nextUpDate: { fontSize: 14, paddingLeft: 20 },
  countdownBlock: { alignItems: 'flex-end' },
  countdownNum: { fontSize: 52, fontWeight: '800', letterSpacing: -2, lineHeight: 52 },
  countdownLabel: { fontSize: 12, fontWeight: '600' },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, opacity: 0.6 },
  yearHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 },
  yearTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 26, marginTop: 4 },
  yearSubtitle: { fontSize: 13, marginTop: 2 },
  yearWatermark: { fontSize: 44, fontWeight: '700', letterSpacing: -2, lineHeight: 44, opacity: 0.18 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  legendLine: { width: 20, height: 2, borderRadius: 999 },
  legendText: { fontSize: 11 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.3 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  eventRowBorder: { borderBottomWidth: 1 },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 14, fontWeight: '600' },
  eventDate: { fontSize: 12 },
  daysLeft: { fontSize: 13, fontWeight: '700' },
  bottomPad: { height: 8 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat(HomeScreen): wire to real EventRepository data"
```

---

## Task 12: EventsScreen — real data + filters + empty state

**Files:**
- Modify: `src/screens/EventsScreen.tsx`

- [ ] **Step 1: Replace the events list and filter logic in EventsScreen.tsx**

Replace the hardcoded events array and add filter logic. Find the section after the hero block and replace with:

```typescript
// src/screens/EventsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Theme } from '../theme/palette';
import { RootStackParamList } from '../types';
import { useEvents } from '../hooks/useEvents';
import { getDaysLeft, formatDisplayDate } from '../utils/yearProgress';

type Props = { navigation: StackNavigationProp<RootStackParamList>; t: Theme };

const FILTERS = ['All', 'Birthday', 'Deadline', 'Vacation', 'Milestone', 'Other'];

export default function EventsScreen({ navigation, t }: Props) {
  const { events } = useEvents();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? events
    : events.filter(e => e.type === activeFilter);

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: t.text }]}>{'Upcoming\nmoments'}</Text>
            <Text style={[styles.heroSub, { color: t.textMuted }]}>
              {events.length} event{events.length !== 1 ? 's' : ''} tracked
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: t.accentStrong }]}
            onPress={() => navigation.navigate('AddEvent', {})}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, { backgroundColor: activeFilter === f ? t.accentStrong : t.surface, borderColor: t.border }]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.chipText, { color: activeFilter === f ? '#FFF7EC' : t.textMuted }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          {filtered.length === 0 ? (
            <Text style={[styles.emptyText, { color: t.textMuted }]}>
              {activeFilter === 'All' ? 'No events yet — tap + to add one.' : `No ${activeFilter} events.`}
            </Text>
          ) : (
            filtered.map((ev, i) => (
              <TouchableOpacity
                key={ev.id}
                style={[styles.eventRow, { borderBottomColor: t.border }, i < filtered.length - 1 && styles.eventRowBorder]}
                onPress={() => navigation.navigate('EventDetail', { eventId: ev.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.colorBar, { backgroundColor: ev.color }]} />
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: t.text }]}>{ev.title}</Text>
                  <Text style={[styles.eventDate, { color: t.textMuted }]}>{formatDisplayDate(ev.dateIso)}</Text>
                </View>
                <Text style={[styles.daysLeft, { color: t.textMuted }]}>{getDaysLeft(ev.dateIso)}d</Text>
                <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 82 },
  content: { padding: 22, paddingTop: 56, gap: 16 },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroText: { gap: 4 },
  heroTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, lineHeight: 32 },
  heroSub: { fontSize: 14 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFF7EC', fontSize: 22, lineHeight: 26 },
  filterScroll: { flexGrow: 0 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  emptyText: { padding: 24, textAlign: 'center', fontSize: 14 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 20 },
  eventRowBorder: { borderBottomWidth: 1 },
  colorBar: { width: 12, height: 40, borderRadius: 999 },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventDate: { fontSize: 13 },
  daysLeft: { fontSize: 13, fontWeight: '700' },
  chevron: { fontSize: 20 },
  bottomPad: { height: 8 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/EventsScreen.tsx
git commit -m "feat(EventsScreen): wire to real data, filter chips, empty state"
```

---

## Task 13: AddEventScreen — date picker + save

**Files:**
- Modify: `src/screens/AddEventScreen.tsx`

- [ ] **Step 1: Replace AddEventScreen.tsx**

```typescript
// src/screens/AddEventScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Theme } from '../theme/palette';
import { RootStackParamList } from '../types';
import { useEventRepository } from '../hooks/useEventRepository';
import { usePremium, FREE_EVENT_LIMIT, PremiumRequiredError } from '../contexts/PremiumContext';
import { NotificationService } from '../services/NotificationService';
import { formatDisplayDate } from '../utils/yearProgress';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'AddEvent'>;
  t: Theme;
};

const EVENT_TYPES = ['Birthday', 'Deadline', 'Vacation', 'Milestone', 'Other'];
const COLORS = ['#C86B5A', '#9F7A45', '#547A76', '#D6B98C', '#6B7FA3', '#A3736B'];
const REPEAT_OPTIONS = ['None', 'Yearly', 'Monthly'];
const REMINDER_OPTIONS = ['None', 'On the day', '1 day before', '3 days before', '1 week before'];

export default function AddEventScreen({ navigation, route, t }: Props) {
  const repo = useEventRepository();
  const { isPremium } = usePremium();
  const isEdit = Boolean(route.params?.eventId);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [type, setType] = useState('Milestone');
  const [color, setColor] = useState(COLORS[2]);
  const [repeats, setRepeats] = useState('None');
  const [reminder, setReminder] = useState('None');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Load existing event in edit mode
  useEffect(() => {
    if (!route.params?.eventId) return;
    void (async () => {
      const ev = await repo.getById(route.params!.eventId!);
      if (!ev) return;
      setTitle(ev.title);
      setDate(new Date(ev.dateIso + 'T00:00:00'));
      setType(ev.type);
      setColor(ev.color);
      setRepeats(ev.repeats);
      setReminder(ev.reminder);
      setNote(ev.note);
    })();
  }, [route.params?.eventId]);

  const dateIso = date.toISOString().slice(0, 10);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Name required', 'Please enter an event name.'); return; }
    setSaving(true);
    try {
      if (isEdit && route.params?.eventId) {
        const existing = await repo.getById(route.params.eventId);
        if (existing) {
          await NotificationService.cancelReminders(existing.notificationIds);
        }
        const notificationIds = reminder !== 'None'
          ? await NotificationService.scheduleReminder({ ...existing!, title, dateIso, type, repeats, reminder, note, color })
          : [];
        await repo.update(route.params.eventId, { title, dateIso, color, type, repeats, reminder, note, notificationIds });
      } else {
        const count = await repo.getCount();
        if (count >= FREE_EVENT_LIMIT && !isPremium) {
          Alert.alert(
            'Mica Premium',
            `Free tier allows up to ${FREE_EVENT_LIMIT} events. Premium is coming soon!`,
            [{ text: 'OK' }]
          );
          setSaving(false);
          return;
        }
        const created = await repo.create({
          title, dateIso, color, type, repeats, reminder, note,
          dayOfYear: 0, notificationIds: [],
        });
        if (reminder !== 'None') {
          const hasPermission = await NotificationService.requestPermissions();
          if (hasPermission) {
            const ids = await NotificationService.scheduleReminder(created);
            await repo.update(created.id, { notificationIds: ids });
          }
        }
      }
      navigation.goBack();
    } catch (err) {
      if (err instanceof PremiumRequiredError) {
        Alert.alert('Mica Premium', err.message);
      } else {
        Alert.alert('Error', 'Could not save event.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={[styles.nav, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.navAction, { color: t.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: t.text }]}>{isEdit ? 'Edit Event' : 'New Event'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.navAction, { color: t.accentStrong }]}>{saving ? '…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: t.text, borderBottomColor: t.border }]}
          placeholder="Event name"
          placeholderTextColor={t.textMuted}
          value={title}
          onChangeText={setTitle}
          autoFocus={!isEdit}
        />

        {/* Date picker trigger */}
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: t.border }]}
          onPress={() => setShowPicker(true)}
        >
          <Text style={[styles.rowLabel, { color: t.text }]}>Date</Text>
          <Text style={[styles.rowValue, { color: t.textMuted }]}>{formatDisplayDate(dateIso)}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              setShowPicker(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        {/* Event type */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.textMuted }]}>TYPE</Text>
          <View style={styles.chips}>
            {EVENT_TYPES.map(t2 => (
              <TouchableOpacity
                key={t2}
                style={[styles.chip, { backgroundColor: type === t2 ? t.accentStrong : t.surface, borderColor: t.border }]}
                onPress={() => setType(t2)}
              >
                <Text style={{ color: type === t2 ? '#FFF7EC' : t.text, fontSize: 13 }}>{t2}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Repeats */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.textMuted }]}>REPEATS</Text>
          <View style={styles.chips}>
            {REPEAT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, { backgroundColor: repeats === opt ? t.accentStrong : t.surface, borderColor: t.border }]}
                onPress={() => setRepeats(opt)}
              >
                <Text style={{ color: repeats === opt ? '#FFF7EC' : t.text, fontSize: 13 }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.textMuted }]}>REMINDER</Text>
          <View style={styles.chips}>
            {REMINDER_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, { backgroundColor: reminder === opt ? t.accentStrong : t.surface, borderColor: t.border }]}
                onPress={() => setReminder(opt)}
              >
                <Text style={{ color: reminder === opt ? '#FFF7EC' : t.text, fontSize: 13 }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.textMuted }]}>COLOR</Text>
          <View style={styles.colorRow}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.swatch, { backgroundColor: c, borderWidth: color === c ? 2.5 : 0, borderColor: t.accentStrong }]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.textMuted }]}>NOTE</Text>
          <TextInput
            style={[styles.noteInput, { color: t.text, borderColor: t.border }]}
            placeholder="Add a note…"
            placeholderTextColor={t.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1 },
  navAction: { fontSize: 16 },
  navTitle: { fontSize: 16, fontWeight: '700' },
  content: { padding: 22, gap: 20 },
  titleInput: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, paddingBottom: 12, borderBottomWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 15 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  colorRow: { flexDirection: 'row', gap: 12 },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  noteInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 80, fontSize: 14 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/AddEventScreen.tsx
git commit -m "feat(AddEventScreen): date picker, real save/edit, notification scheduling"
```

---

## Task 14: EventDetailScreen — load from repo + edit + delete

**Files:**
- Modify: `src/screens/EventDetailScreen.tsx`

- [ ] **Step 1: Replace EventDetailScreen.tsx**

```typescript
// src/screens/EventDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Theme } from '../theme/palette';
import { RootStackParamList, MicaEvent } from '../types';
import { useEventRepository } from '../hooks/useEventRepository';
import { NotificationService } from '../services/NotificationService';
import { getDaysLeft, formatDisplayDate } from '../utils/yearProgress';
import LifeCalendarGrid from '../components/LifeCalendarGrid';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'EventDetail'>;
  t: Theme;
};

export default function EventDetailScreen({ navigation, route, t }: Props) {
  const repo = useEventRepository();
  const [event, setEvent] = useState<MicaEvent | null>(null);

  useEffect(() => {
    void (async () => {
      const ev = await repo.getById(route.params.eventId);
      setEvent(ev);
    })();
  }, [route.params.eventId]);

  const handleDelete = () => {
    Alert.alert('Delete event', `Delete "${event?.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!event) return;
          await NotificationService.cancelReminders(event.notificationIds);
          await repo.delete(event.id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!event) {
    return (
      <View style={[styles.root, { backgroundColor: t.background }]}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: t.textMuted }]}>‹ Events</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const daysLeft = getDaysLeft(event.dateIso);

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={[styles.backText, { color: t.textMuted }]}>‹ Events</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title */}
        <View style={styles.titleRow}>
          <View style={[styles.colorBar, { backgroundColor: event.color }]} />
          <Text style={[styles.title, { color: t.text }]}>{event.title}</Text>
        </View>

        {/* Life calendar grid */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.eyebrow, { color: t.textMuted }]}>YOUR YEAR · {getDaysLeft(event.dateIso) >= 0 ? `${daysLeft}d LEFT` : 'PAST'}</Text>
          <LifeCalendarGrid t={t} event={event} />
        </View>

        {/* Countdown */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.countdownNum, { color: event.color }]}>{Math.abs(daysLeft)}</Text>
          <Text style={[styles.countdownLabel, { color: t.textMuted }]}>{daysLeft >= 0 ? 'days away' : 'days ago'}</Text>
        </View>

        {/* Details */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          {[
            { label: 'Type', value: event.type },
            { label: 'Date', value: formatDisplayDate(event.dateIso) },
            { label: 'Repeats', value: event.repeats },
            { label: 'Reminder', value: event.reminder },
          ].map(({ label, value }, i) => (
            <View key={label} style={[styles.detailRow, i > 0 && { borderTopWidth: 1, borderTopColor: t.border }]}>
              <Text style={[styles.detailLabel, { color: t.textMuted }]}>{label}</Text>
              <Text style={[styles.detailValue, { color: t.text }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        {event.note ? (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.noteText, { color: t.text }]}>{event.note}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={() => navigation.navigate('AddEvent', { eventId: event.id })}
        >
          <Text style={[styles.actionBtnText, { color: t.text }]}>Edit event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: t.danger + '18', borderColor: t.danger + '30' }]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionBtnText, { color: t.danger }]}>Delete event</Text>
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { paddingTop: 56, paddingHorizontal: 22, paddingBottom: 8 },
  backText: { fontSize: 16 },
  content: { padding: 22, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  colorBar: { width: 12, height: 52, borderRadius: 999 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, flex: 1 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.5, marginBottom: 14 },
  countdownNum: { fontSize: 64, fontWeight: '800', letterSpacing: -2, lineHeight: 64 },
  countdownLabel: { fontSize: 16, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  noteText: { fontSize: 14, lineHeight: 22 },
  actionBtn: { borderRadius: 20, padding: 18, borderWidth: 1, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
  bottomPad: { height: 24 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/EventDetailScreen.tsx
git commit -m "feat(EventDetailScreen): load from repo, real edit/delete, notification cancel"
```

---

## Task 15: SettingsScreen — theme + notifications + version

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Wire settings to SQLite + version**

Replace the state and handlers in SettingsScreen. The full updated file:

```typescript
// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Linking } from 'react-native';
import Constants from 'expo-constants';
import { StackNavigationProp } from '@react-navigation/stack';
import { Theme } from '../theme/palette';
import { RootStackParamList } from '../types';
import { useSettings } from '../hooks/useSettings';
import { usePremium } from '../contexts/PremiumContext';
import { NotificationService } from '../services/NotificationService';
import { useEvents } from '../hooks/useEvents';

type Props = { navigation: StackNavigationProp<RootStackParamList>; t: Theme };

const PRIVACY_URL = 'https://aniketh703.github.io/Mica/privacy-policy';

export default function SettingsScreen({ navigation, t }: Props) {
  const { theme, notificationsEnabled, setTheme, setNotificationsEnabled } = useSettings();
  const { isPremium, purchasePremium, restorePurchases } = usePremium();
  const { events } = useEvents();

  const handleNotificationsToggle = async (value: boolean) => {
    await setNotificationsEnabled(value);
    if (!value) {
      await NotificationService.cancelAll();
    } else {
      await NotificationService.rescheduleAll(events);
    }
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: t.text }]}>Calm, your way</Text>
        </View>

        {/* Premium card */}
        {!isPremium && (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.cardBloom, { backgroundColor: t.accentSoft }]} />
            <Text style={[styles.premiumTitle, { color: t.text }]}>Mica Premium</Text>
            {['Unlimited events', 'Cross-device sync', 'Multiple reminders', 'CSV export'].map(f => (
              <View key={f} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: t.accentStrong }]} />
                <Text style={[styles.featureText, { color: t.text }]}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.premiumBtn, { backgroundColor: t.accentStrong }]}
              onPress={() => purchasePremium()}
            >
              <Text style={styles.premiumBtnText}>Coming soon</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Appearance */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.cardLabel, { color: t.textMuted }]}>THEME</Text>
          <View style={styles.segmented}>
            {(['system', 'light', 'dark'] as const).map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.segment, { backgroundColor: theme === opt ? t.accentStrong : t.surfaceMuted }]}
                onPress={() => setTheme(opt)}
              >
                <Text style={[styles.segmentText, { color: theme === opt ? '#FFF7EC' : t.textMuted }]}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminders */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: t.text }]}>Reminders</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ true: t.accentStrong, false: t.surfaceMuted }}
              thumbColor={t.surface}
            />
          </View>
        </View>

        {/* Account */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Invite')}>
            <Text style={[styles.settingLabel, { color: t.text }]}>Invite friends</Text>
            <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.settingRow, styles.rowBorder, { borderBottomColor: t.border }]}>
            <Text style={[styles.settingLabel, { color: t.text }]}>Version</Text>
            <Text style={[styles.settingValue, { color: t.textMuted }]}>{version}</Text>
          </View>
          <TouchableOpacity
            style={[styles.settingRow, styles.rowBorder, { borderBottomColor: t.border }]}
            onPress={() => Linking.openURL(PRIVACY_URL)}
          >
            <Text style={[styles.settingLabel, { color: t.text }]}>Privacy Policy</Text>
            <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} onPress={() => restorePurchases()}>
            <Text style={[styles.settingLabel, { color: t.text }]}>Restore Purchases</Text>
            <Text style={[styles.chevron, { color: t.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 82 },
  content: { padding: 22, paddingTop: 56, gap: 16 },
  hero: { paddingTop: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1, gap: 14, overflow: 'hidden', position: 'relative' },
  cardBloom: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: -60, right: -40, opacity: 0.25 },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  premiumTitle: { fontSize: 18, fontWeight: '800' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureText: { fontSize: 14 },
  premiumBtn: { borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 4 },
  premiumBtnText: { color: '#FFF7EC', fontWeight: '700', fontSize: 15 },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center' },
  segmentText: { fontSize: 13, fontWeight: '600' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBorder: { paddingBottom: 14, borderBottomWidth: 1, marginBottom: 14 },
  settingLabel: { fontSize: 15 },
  settingValue: { fontSize: 14 },
  chevron: { fontSize: 20 },
  bottomPad: { height: 8 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/SettingsScreen.tsx
git commit -m "feat(SettingsScreen): theme persistence, notifications toggle, version, privacy link"
```

---

## Task 16: InviteScreen — clipboard + share

**Files:**
- Modify: `src/screens/InviteScreen.tsx`

- [ ] **Step 1: Wire clipboard and share**

Replace the Copy and Share handlers in InviteScreen:

```typescript
// src/screens/InviteScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { StackNavigationProp } from '@react-navigation/stack';
import { Theme } from '../theme/palette';
import { RootStackParamList } from '../types';

type Props = { navigation: StackNavigationProp<RootStackParamList>; t: Theme };

const REFERRAL_CODE = 'ANIKETH-MICA-2026';
const SHARE_MESSAGE = `I've been using Mica to track what matters — birthdays, deadlines, goals. Check it out!\n\nCode: ${REFERRAL_CODE}\nhttps://play.google.com/store/apps/details?id=com.mica.app`;

export default function InviteScreen({ navigation, t }: Props) {
  const handleCopy = () => Clipboard.setString(REFERRAL_CODE);

  const handleShare = async () => {
    await Share.share({ message: SHARE_MESSAGE });
  };

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={[styles.backText, { color: t.textMuted }]}>‹ Settings</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.hero, { color: t.text }]}>Share the quiet.</Text>

        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.label, { color: t.textMuted }]}>YOUR CODE</Text>
          <View style={[styles.codeBox, { borderColor: t.border }]}>
            <Text style={[styles.code, { color: t.text }]}>{REFERRAL_CODE}</Text>
          </View>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: t.surfaceMuted }]}
            onPress={handleCopy}
          >
            <Text style={[styles.copyBtnText, { color: t.text }]}>Copy code</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: t.accentStrong }]}
          onPress={handleShare}
        >
          <Text style={styles.shareBtnText}>Share Mica</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { paddingTop: 56, paddingHorizontal: 22, paddingBottom: 8 },
  backText: { fontSize: 16 },
  content: { padding: 22, gap: 20 },
  hero: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1, gap: 14 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  codeBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, padding: 16, alignItems: 'center' },
  code: { fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  copyBtn: { borderRadius: 14, padding: 14, alignItems: 'center' },
  copyBtnText: { fontSize: 14, fontWeight: '600' },
  shareBtn: { borderRadius: 20, padding: 18, alignItems: 'center' },
  shareBtnText: { color: '#FFF7EC', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/InviteScreen.tsx
git commit -m "feat(InviteScreen): wire clipboard copy and Android share sheet"
```

---

## Task 17: App.tsx — SQLiteProvider + Sentry + notification deep link

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Create a Sentry project**

Go to https://sentry.io → New Project → React Native → copy the DSN string. Store it in Doppler:

```bash
doppler secrets set SENTRY_DSN=https://xxxx@oxxxx.ingest.sentry.io/xxxxx
```

- [ ] **Step 2: Replace App.tsx**

```typescript
// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { mica, midnight } from './src/theme/palette';
import { RootStackParamList } from './src/types';
import { migrateDatabase } from './src/db/database';
import MainScreen from './src/screens/MainScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import AddEventScreen from './src/screens/AddEventScreen';
import InviteScreen from './src/screens/InviteScreen';

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? '',
  tracesSampleRate: 0.2,
});

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator() {
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? midnight : mica;
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Deep link: tap notification → open EventDetail
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const eventId = response.notification.request.content.data?.eventId as string | undefined;
      if (eventId && navRef.current) {
        navRef.current.navigate('EventDetail', { eventId });
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer ref={navRef}>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: t.background } }}>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="EventDetail" options={{ presentation: 'card' }}>
          {props => <EventDetailScreen {...props} t={t} />}
        </Stack.Screen>
        <Stack.Screen name="AddEvent" options={{ presentation: 'modal' }}>
          {props => <AddEventScreen {...props} t={t} />}
        </Stack.Screen>
        <Stack.Screen name="Invite" options={{ presentation: 'card' }}>
          {props => <InviteScreen {...props} t={t} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Sentry.wrap(function App() {
  return (
    <SQLiteProvider databaseName="mica.db" onInit={migrateDatabase}>
      <AppNavigator />
    </SQLiteProvider>
  );
});
```

- [ ] **Step 3: Run type-check — expect zero errors in new files**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v "node_modules" | grep -v "AppConstants" | grep -v "AppLaunchFlow" | grep -v "NavigationIntegration" | grep -v "DateUtils" | grep -v "AppInitialization"
```

Expected: no output (zero errors in new files).

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat(App): SQLiteProvider, Sentry, notification deep-link listener"
```

---

## Task 18: app.json + eas.json — Android config

**Files:**
- Modify: `app.json`
- Create: `eas.json`

- [ ] **Step 1: Update app.json**

```json
{
  "expo": {
    "name": "Mica",
    "slug": "mica",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "assetBundlePatterns": ["**/*"],
    "android": {
      "package": "com.mica.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon-foreground.png",
        "backgroundColor": "#F5F1EA"
      },
      "permissions": [
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM"
      ]
    },
    "plugins": [
      "expo-notifications",
      "@react-native-community/datetimepicker",
      "expo-sqlite"
    ]
  }
}
```

- [ ] **Step 2: Create assets placeholder (required before EAS build)**

```bash
mkdir -p assets
# Place a 1024x1024 PNG at assets/icon-foreground.png
# Use Icons8 to download a calendar/grid icon in warm terracotta style
# Temporary: copy any 1024x1024 PNG and rename it
```

- [ ] **Step 3: Create eas.json**

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

- [ ] **Step 4: Add google-service-account.json to .gitignore**

Add this line to `.gitignore`:
```
google-service-account.json
```

- [ ] **Step 5: Commit**

```bash
git add app.json eas.json .gitignore
git commit -m "chore(build): add Android config and EAS build profiles"
```

---

## Task 19: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  type-check:
    name: TypeScript
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit --skipLibCheck

  test:
    name: Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx jest --coverage --passWithNoTests
      - uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx eslint "src/**/*.{ts,tsx}" --max-warnings 0
```

- [ ] **Step 2: Add CODECOV_TOKEN to GitHub repo secrets**

Go to https://codecov.io → connect `aniketh703/Mica` → copy the upload token → GitHub repo → Settings → Secrets → New secret: `CODECOV_TOKEN`.

- [ ] **Step 3: Commit and push**

```bash
git add .github/
git commit -m "ci: add GitHub Actions type-check, test, lint pipeline"
git push origin main
```

Expected: CI runs and all 3 jobs pass on GitHub Actions.

---

## Task 20: GitHub Pages — privacy policy

**Files:**
- Create: `docs/privacy-policy.md`

- [ ] **Step 1: Create privacy policy**

```markdown
# Mica Privacy Policy

_Last updated: 2026-05-05_

## What Mica collects

**Free tier:** All event data (names, dates, colors, notes) is stored exclusively on your device using SQLite. No data is transmitted to any server.

**Anonymous crash reports:** We use Sentry to collect anonymous crash and error logs to improve app stability. No personal information, event titles, or dates are included in these reports.

## What Mica does not collect

- Your name or email address (free tier)
- Your location
- Your device identifiers
- Any analytics or usage tracking

## Data deletion

To delete all Mica data: uninstall the app. All SQLite data is removed with the app.

## Contact

Questions about this policy: anikethvustepalle@gmail.com
```

- [ ] **Step 2: Enable GitHub Pages**

Go to https://github.com/aniketh703/Mica → Settings → Pages → Source: Deploy from branch → Branch: `main` → Folder: `/docs` → Save.

- [ ] **Step 3: Commit**

```bash
git add docs/privacy-policy.md
git commit -m "docs: add privacy policy for Play Store"
git push origin main
```

Expected: Policy live at `https://aniketh703.github.io/Mica/privacy-policy` within 2 minutes.

---

## Task 21: EAS production build + Play Store submission

**Files:** none (config already done)

- [ ] **Step 1: Install EAS CLI**

```bash
npm install -g eas-cli
eas login
```

- [ ] **Step 2: Configure EAS project**

```bash
eas build:configure
```

Expected: adds `extra.eas.projectId` to `app.json`.

- [ ] **Step 3: Run preview build (APK for testing)**

```bash
eas build --platform android --profile preview
```

Expected: EAS cloud builds the APK, provides download URL. Install on Android device and test all 6 screens.

- [ ] **Step 4: Test checklist before production build**

- [ ] All 6 screens load without crash
- [ ] Add event → appears in Home + Events screen
- [ ] Edit event → changes persist after restart
- [ ] Delete event → gone from all screens
- [ ] Notification scheduled → appears in Android notification tray at correct time
- [ ] Year grid highlights today's cell correctly
- [ ] LifeCalendarGrid shows event day in correct week column
- [ ] Settings theme toggle persists after app restart
- [ ] Notifications toggle cancels/reschedules correctly

- [ ] **Step 5: Run production build (AAB for Play Store)**

```bash
eas build --platform android --profile production
```

Expected: `.aab` file ready for Play Store submission.

- [ ] **Step 6: Submit to Play Store Internal Testing track**

```bash
eas submit --platform android --latest
```

Or upload the `.aab` manually in Play Console → Internal Testing → Create new release.

- [ ] **Step 7: Commit final state**

```bash
git add app.json  # updated with EAS projectId
git commit -m "chore: add EAS projectId from build:configure"
git push origin main
```

---

## Self-review

**Spec coverage check:**
- ✅ SQLite schema + migrations (Task 3)
- ✅ EventRepository CRUD (Task 4)
- ✅ useEvents / useEventRepository / useSettings hooks (Task 6)
- ✅ PremiumContext + 12-event limit (Task 7)
- ✅ NotificationService with scheduling (Task 8)
- ✅ YearGrid dynamic sizing + animation + event markers (Task 9)
- ✅ LifeCalendarGrid dynamic sizing + countdown + event day (Task 10)
- ✅ HomeScreen real data (Task 11)
- ✅ EventsScreen real data + filter chips + empty state (Task 12)
- ✅ AddEventScreen date picker + save + edit mode (Task 13)
- ✅ EventDetailScreen load from repo + delete (Task 14)
- ✅ SettingsScreen theme + notifications + version (Task 15)
- ✅ InviteScreen clipboard + share (Task 16)
- ✅ App.tsx SQLiteProvider + Sentry + deep link (Task 17)
- ✅ app.json + eas.json Android config (Task 18)
- ✅ GitHub Actions CI (Task 19)
- ✅ GitHub Pages privacy policy (Task 20)
- ✅ EAS build + Play Store submission (Task 21)
- ✅ RECEIVE_BOOT_COMPLETED + SCHEDULE_EXACT_ALARM permissions (Task 18)
- ✅ Notification deep link (Task 17)
- ✅ deleted_at soft-delete (EventRepository.delete)
- ✅ AppState foreground listener for grid refresh (Task 9)

**Type consistency check:**
- `MicaEvent.dateIso` used consistently across all screens ✅
- `EventDetail: { eventId: string }` nav param used in Home, Events, Detail ✅
- `AddEvent: { eventId?: string }` used in Detail (edit) and Events (create) ✅
- `getDaysLeft(dateIso)` called everywhere daysLeft is displayed ✅
- `formatDisplayDate(dateIso)` called everywhere date is shown ✅
- `NotificationService.cancelReminders(event.notificationIds)` called before delete and update ✅
- `buildCellData(yp, events)` matches exported signature ✅
- `buildLifeCells(yp, eventDoy)` receives `number` not `MicaEvent` ✅
