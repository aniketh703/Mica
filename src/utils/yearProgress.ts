// src/utils/yearProgress.ts
import { CellData, LifeCellData, MicaEvent } from '../types';

// ─── Repeat-aware event helpers ───────────────────────────────────────────────

/**
 * Returns the ISO date of an event's NEXT occurrence, accounting for repeats.
 * - Yearly:  same MM-DD, this year if still in the future, next year otherwise.
 * - Monthly: same DD, this month if still in the future, next month otherwise.
 * - None:    returns ev.dateIso unchanged (may be in the past).
 */
export function nextOccurrenceIso(ev: MicaEvent): string {
  const today = todayIso();
  const iso   = ev.dateIso;

  if (ev.repeats === 'Yearly') {
    const thisYear    = new Date().getFullYear();
    const mmdd        = iso.slice(5); // "MM-DD"
    const thisYearIso = `${thisYear}-${mmdd}`;
    return thisYearIso >= today ? thisYearIso : `${thisYear + 1}-${mmdd}`;
  }

  if (ev.repeats === 'Monthly') {
    const dd  = iso.slice(8); // "DD"
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth() + 1;
    // Walk forward month-by-month (max 13 iterations handles every edge case)
    for (let i = 0; i < 13; i++) {
      const candidate = `${y}-${String(m).padStart(2, '0')}-${dd}`;
      if (candidate >= today) return candidate;
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    return iso; // unreachable fallback
  }

  // 'None' — return as-is; caller decides how to handle past dates
  return iso;
}

/**
 * Days until an event's next occurrence from today.
 * Repeating events always return ≥ 0.
 * One-time past events return a negative number.
 */
export function effectiveDaysUntil(ev: MicaEvent): number {
  return daysUntilIso(nextOccurrenceIso(ev));
}

/**
 * True when a one-time event's date has already passed.
 */
export function isExpired(ev: MicaEvent): boolean {
  return ev.repeats === 'None' && daysUntilIso(ev.dateIso) < 0;
}

export interface YearProgress {
  year: number;
  dayOfYear: number;
  daysRemaining: number;
  totalDays: number;
  percentComplete: number;
}

export function getYearProgress(): YearProgress {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  const dayOfYear = Math.round((now.getTime() - start.getTime()) / 86400000) + 1;
  const daysRemaining = totalDays - dayOfYear;
  const percentComplete = Math.round((dayOfYear / totalDays) * 100);
  return { year, dayOfYear, daysRemaining, totalDays, percentComplete };
}

export function getRemainingCopy(n: number): string {
  if (n === 0) return 'The year closes tonight';
  if (n === 1) return 'One day is still yours';
  return `${n} quiet days remain`;
}

export function formatDays(n: number): string {
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return `${n}d`;
}

/** Convert "YYYY-MM-DD" to 1-based day-of-year */
export function dateIsoToDayOfYear(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const start = new Date(year, 0, 1);
  return Math.round((date.getTime() - start.getTime()) / 86400000) + 1;
}

/** Format "YYYY-MM-DD" to display string e.g. "May 3, 2026" */
export function dateIsoToDisplay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Format "YYYY-MM-DD" to short display "May 3" */
export function dateIsoToShort(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Get today's date as "YYYY-MM-DD" */
export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Compute days until a dateIso from today */
export function daysUntilIso(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

/**
 * Build year grid cell data (365/366 cells).
 * eventColors: map from dayOfYear -> eventColor for events this year.
 */
export function buildCellData(
  yp: YearProgress,
  eventDays: Map<number, string> = new Map()
): CellData[] {
  return Array.from({ length: yp.totalDays }, (_, i) => {
    const doy = i + 1;
    if (eventDays.has(doy)) {
      return { doy, state: 'event', eventColor: eventDays.get(doy)! };
    }
    if (doy < yp.dayOfYear) return { doy, state: 'past' };
    if (doy === yp.dayOfYear) return { doy, state: 'today' };
    return { doy, state: 'future' };
  });
}

/**
 * Build life calendar cells for EventDetail screen.
 * Shows 52 weeks x 7 days. Marks past, today, countdown (days between today and event), and event day.
 */
export function buildLifeCells(
  yp: YearProgress,
  eventDayOfYear: number
): LifeCellData[] {
  const totalDays = yp.totalDays;
  const cells: LifeCellData[] = [];
  for (let doy = 1; doy <= totalDays; doy++) {
    const week = Math.ceil(doy / 7);
    const dow = ((doy - 1) % 7);
    let state: LifeCellData['state'];
    if (doy === eventDayOfYear) {
      state = 'event';
    } else if (doy < yp.dayOfYear) {
      state = 'past';
    } else if (doy === yp.dayOfYear) {
      state = 'today';
    } else if (doy > yp.dayOfYear && doy < eventDayOfYear) {
      state = 'countdown';
    } else {
      state = 'future';
    }
    cells.push({ doy, week, dow, state });
  }
  return cells;
}

/** Extract event days from a list of events for the current year */
export function buildEventDaysMap(events: MicaEvent[], currentYear: number): Map<number, string> {
  const map = new Map<number, string>();
  for (const ev of events) {
    if (!ev.dateIso) continue;
    const [year] = ev.dateIso.split('-').map(Number);

    if (ev.repeats === 'None') {
      if (year !== currentYear) continue;
      map.set(dateIsoToDayOfYear(ev.dateIso), ev.color);
    } else if (ev.repeats === 'Yearly') {
      // Always show at this year's position, even if the date has passed
      const thisYearIso = `${currentYear}-${ev.dateIso.slice(5)}`;
      map.set(dateIsoToDayOfYear(thisYearIso), ev.color);
    } else {
      // Monthly: show the next occurrence only if it falls this year
      const nextIso = nextOccurrenceIso(ev);
      const [nextYear] = nextIso.split('-').map(Number);
      if (nextYear === currentYear) {
        map.set(dateIsoToDayOfYear(nextIso), ev.color);
      }
    }
  }
  return map;
}
