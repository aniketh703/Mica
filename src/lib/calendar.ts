import {CountdownEvent} from '../types/event';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getUtcDayNumber(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day) / MS_PER_DAY;
}

export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function getDayOfYear(date: Date): number {
  const year = date.getFullYear();

  return (
    getUtcDayNumber(year, date.getMonth(), date.getDate()) -
    getUtcDayNumber(year, 0, 0)
  );
}

export function getRemainingDaysInYear(date: Date): number {
  return getDaysInYear(date.getFullYear()) - getDayOfYear(date);
}

export function getDaysUntil(date: string, now = new Date()): number {
  const target = new Date(date);

  return (
    getUtcDayNumber(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
    ) -
    getUtcDayNumber(now.getFullYear(), now.getMonth(), now.getDate())
  );
}

export function sortEventsByUpcoming(
  events: CountdownEvent[],
  now = new Date(),
): CountdownEvent[] {
  return [...events].sort(
    (left, right) => getDaysUntil(left.date, now) - getDaysUntil(right.date, now),
  );
}
