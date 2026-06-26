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
