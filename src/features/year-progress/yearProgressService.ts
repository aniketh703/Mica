import {getDayOfYear, getDaysInYear, getRemainingDaysInYear, isLeapYear} from '../../lib/calendar';
import {YearDayCell, YearProgressViewModel} from '../../types/yearProgress';

function createAccessibilityLabel(
  year: number,
  dayOfYear: number,
  daysInYear: number,
  daysRemaining: number,
): string {
  const dayLabel = daysRemaining === 0 ? 'Today is the last day of the year.' : '';
  const remainingLabel =
    daysRemaining === 0
      ? 'No days remain after today.'
      : daysRemaining === 1
      ? '1 day remains.'
      : `${daysRemaining} days remain.`;

  return `Today is day ${dayOfYear} of ${daysInYear} in ${year}. ${remainingLabel} ${dayLabel}`.trim();
}

function createCells(dayOfYear: number, daysInYear: number): YearDayCell[] {
  const cells = new Array<YearDayCell>(daysInYear);

  for (let index = 0; index < daysInYear; index += 1) {
    const cellDay = index + 1;

    cells[index] = {
      index,
      dayOfYear: cellDay,
      state:
        cellDay < dayOfYear ? 'past' : cellDay === dayOfYear ? 'today' : 'future',
    };
  }

  return cells;
}

export function buildYearProgressModel(date: Date): YearProgressViewModel {
  const year = date.getFullYear();
  const daysInYear = getDaysInYear(year) as 365 | 366;
  const dayOfYear = getDayOfYear(date);
  const daysRemaining = getRemainingDaysInYear(date);
  const daysElapsed = dayOfYear;
  const percentComplete = Number(((dayOfYear / daysInYear) * 100).toFixed(1));

  return {
    year,
    daysInYear,
    dayOfYear,
    daysElapsed,
    daysRemaining,
    percentComplete,
    isLeapYear: isLeapYear(year),
    accessibilityLabel: createAccessibilityLabel(
      year,
      dayOfYear,
      daysInYear,
      daysRemaining,
    ),
    cells: createCells(dayOfYear, daysInYear),
  };
}
