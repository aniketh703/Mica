export type YearProgressState = 'past' | 'today' | 'future';

export interface YearDayCell {
  index: number;
  dayOfYear: number;
  state: YearProgressState;
}

export interface YearProgressViewModel {
  year: number;
  daysInYear: 365 | 366;
  dayOfYear: number;
  daysElapsed: number;
  daysRemaining: number;
  percentComplete: number;
  isLeapYear: boolean;
  accessibilityLabel: string;
  cells: YearDayCell[];
}
