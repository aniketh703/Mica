// src/utils/yearProgress.ts
import { CellData, LifeCellData, MicaEvent } from '../types';

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
    // Include events from this year; for yearly repeats, include any year
    if (year === currentYear || ev.repeats === 'Yearly') {
      map.set(ev.dayOfYear, ev.color);
    }
  }
  return map;
}
