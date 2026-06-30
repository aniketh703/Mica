import {
  dateIsoToDayOfYear,
  daysUntilIso,
  todayIso,
  getYearProgress,
  nextOccurrenceIso,
  buildEventDaysMap,
} from '../yearProgress';
import { MicaEvent } from '../../types';

function mockEvent(overrides: Partial<MicaEvent>): MicaEvent {
  return {
    id: 'test-id',
    title: 'Test',
    dateIso: '2026-01-01',
    color: '#000000',
    type: 'Other',
    repeats: 'None',
    reminder: 'None',
    note: '',
    dayOfYear: 1,
    notificationIds: [],
    appwriteId: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function setSystemDate(iso: string) {
  jest.useFakeTimers().setSystemTime(new Date(`${iso}T12:00:00`));
}

afterEach(() => {
  jest.useRealTimers();
});

describe('dateIsoToDayOfYear', () => {
  it('Jan 1 is day 1', () => {
    expect(dateIsoToDayOfYear('2026-01-01')).toBe(1);
  });

  it('Dec 31 is day 365 in a non-leap year', () => {
    expect(dateIsoToDayOfYear('2026-12-31')).toBe(365);
  });

  it('Dec 31 is day 366 in a leap year', () => {
    expect(dateIsoToDayOfYear('2024-12-31')).toBe(366);
  });

  it('Feb 29 is day 60 in a leap year', () => {
    expect(dateIsoToDayOfYear('2024-02-29')).toBe(60);
  });
});

describe('daysUntilIso', () => {
  it('returns 0 for today', () => {
    setSystemDate('2026-06-15');
    expect(daysUntilIso(todayIso())).toBe(0);
  });

  it('returns positive for future dates', () => {
    setSystemDate('2026-06-15');
    expect(daysUntilIso('2026-06-20')).toBe(5);
  });

  it('returns negative for past dates', () => {
    setSystemDate('2026-06-15');
    expect(daysUntilIso('2026-06-10')).toBe(-5);
  });

  it('is exact across a DST spring-forward boundary (US, 2026-03-08)', () => {
    setSystemDate('2026-03-01');
    expect(daysUntilIso('2026-03-15')).toBe(14);
  });
});

describe('getYearProgress', () => {
  it('reports 366 total days in a leap year', () => {
    setSystemDate('2024-06-01');
    expect(getYearProgress().totalDays).toBe(366);
  });

  it('reports 365 total days in a non-leap year', () => {
    setSystemDate('2026-06-01');
    expect(getYearProgress().totalDays).toBe(365);
  });

  it('dayOfYear matches dateIsoToDayOfYear(today)', () => {
    setSystemDate('2026-09-23');
    const yp = getYearProgress();
    expect(yp.dayOfYear).toBe(dateIsoToDayOfYear('2026-09-23'));
  });
});

describe('nextOccurrenceIso — Yearly repeats', () => {
  it('clamps Feb 29 to Feb 28 in a non-leap target year', () => {
    setSystemDate('2027-01-15'); // 2027 is not a leap year
    const ev = mockEvent({ dateIso: '2020-02-29', repeats: 'Yearly' });
    expect(nextOccurrenceIso(ev)).toBe('2027-02-28');
  });

  it('uses Feb 29 directly when the target year is a leap year', () => {
    setSystemDate('2028-01-15'); // 2028 is a leap year
    const ev = mockEvent({ dateIso: '2020-02-29', repeats: 'Yearly' });
    expect(nextOccurrenceIso(ev)).toBe('2028-02-29');
  });

  it('rolls to next year once this year\'s date has passed', () => {
    setSystemDate('2026-08-01');
    const ev = mockEvent({ dateIso: '2020-05-03', repeats: 'Yearly' });
    expect(nextOccurrenceIso(ev)).toBe('2027-05-03');
  });
});

describe('nextOccurrenceIso — Monthly repeats', () => {
  it('clamps day 31 to Feb 28 in a non-leap year', () => {
    setSystemDate('2026-02-01');
    const ev = mockEvent({ dateIso: '2020-01-31', repeats: 'Monthly' });
    expect(nextOccurrenceIso(ev)).toBe('2026-02-28');
  });

  it('clamps day 31 to Feb 29 in a leap year', () => {
    setSystemDate('2024-02-01');
    const ev = mockEvent({ dateIso: '2020-01-31', repeats: 'Monthly' });
    expect(nextOccurrenceIso(ev)).toBe('2024-02-29');
  });

  it('uses the unclamped day in a 31-day month', () => {
    setSystemDate('2026-03-01');
    const ev = mockEvent({ dateIso: '2020-01-31', repeats: 'Monthly' });
    expect(nextOccurrenceIso(ev)).toBe('2026-03-31');
  });
});

describe('buildEventDaysMap', () => {
  it('does not throw for a Feb 29 yearly event viewed in a non-leap year', () => {
    const ev = mockEvent({ dateIso: '2020-02-29', repeats: 'Yearly' });
    expect(() => buildEventDaysMap([ev], 2027)).not.toThrow();
    const map = buildEventDaysMap([ev], 2027);
    expect(map.get(dateIsoToDayOfYear('2027-02-28'))).toBe(ev.color);
  });
});
