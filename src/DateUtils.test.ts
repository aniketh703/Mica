import { DateUtils } from './DateUtils';

describe('DateUtils', () => {
  describe('Core Calculations', () => {
    test('should calculate days remaining in year correctly', () => {
      // Test mid-year date
      const midYear = new Date(2024, 5, 15); // June 15
      const daysRemaining = DateUtils.daysRemainingInYear(midYear);
      expect(daysRemaining).toBeGreaterThan(0);
      expect(daysRemaining).toBeLessThanOrEqual(365);

      // Test beginning of year
      const beginYear = new Date(2024, 0, 1); // Jan 1
      const daysRemainingStart = DateUtils.daysRemainingInYear(beginYear);
      expect(daysRemainingStart).toBe(365); // Leap year 2024 has 366 days

      // Test end of year
      const endYear = new Date(2024, 11, 31); // Dec 31
      const daysRemainingEnd = DateUtils.daysRemainingInYear(endYear);
      expect(daysRemainingEnd).toBe(0);
    });

    test('should detect leap years accurately', () => {
      // Leap years
      expect(DateUtils.isLeapYear(2024)).toBe(true);
      expect(DateUtils.isLeapYear(2020)).toBe(true);
      expect(DateUtils.isLeapYear(2000)).toBe(true);
      expect(DateUtils.isLeapYear(1996)).toBe(true);

      // Non-leap years
      expect(DateUtils.isLeapYear(2023)).toBe(false);
      expect(DateUtils.isLeapYear(2022)).toBe(false);
      expect(DateUtils.isLeapYear(1900)).toBe(false);
      expect(DateUtils.isLeapYear(2100)).toBe(false);

      // Century leap year rule
      expect(DateUtils.isLeapYear(2000)).toBe(true); // Divisible by 400
      expect(DateUtils.isLeapYear(1900)).toBe(false); // Divisible by 100 but not 400
    });

    test('should calculate day of year (1-365/366)', () => {
      // First day of year
      const jan1 = new Date(2024, 0, 1);
      expect(DateUtils.getDayOfYear(jan1)).toBe(1);

      // Middle of year
      const june15 = new Date(2024, 5, 15);
      const dayOfYear = DateUtils.getDayOfYear(june15);
      expect(dayOfYear).toBeGreaterThan(1);
      expect(dayOfYear).toBeLessThanOrEqual(366);

      // Last day of non-leap year
      const dec31_2023 = new Date(2023, 11, 31);
      expect(DateUtils.getDayOfYear(dec31_2023)).toBe(365);

      // Last day of leap year
      const dec31_2024 = new Date(2024, 11, 31);
      expect(DateUtils.getDayOfYear(dec31_2024)).toBe(366);
    });

    test('should handle year transitions (Dec 31 → Jan 1)', () => {
      const dec31 = new Date(2023, 11, 31);
      const jan1 = new Date(2024, 0, 1);

      const normalized1 = DateUtils.normalizeYearTransition(dec31);
      const normalized2 = DateUtils.normalizeYearTransition(jan1);

      expect(normalized1).toBeInstanceOf(Date);
      expect(normalized2).toBeInstanceOf(Date);
      expect(normalized1.getFullYear()).toBe(2023);
      expect(normalized2.getFullYear()).toBe(2024);
    });

    test('should calculate days between two dates', () => {
      const date1 = new Date(2024, 0, 1); // Jan 1
      const date2 = new Date(2024, 0, 8); // Jan 8
      const daysBetween = DateUtils.daysBetween(date1, date2);
      expect(daysBetween).toBe(7);

      // Same date
      const sameDateDiff = DateUtils.daysBetween(date1, date1);
      expect(sameDateDiff).toBe(0);

      // Reverse order (should still give positive result)
      const reverseOrder = DateUtils.daysBetween(date2, date1);
      expect(reverseOrder).toBe(7);

      // Different years
      const date3 = new Date(2023, 0, 1);
      const date4 = new Date(2024, 0, 1);
      const yearDiff = DateUtils.daysBetween(date3, date4);
      expect(yearDiff).toBe(366); // 2024 is leap year
    });
  });

  describe('Edge Cases', () => {
    test('should handle leap year edge case (Feb 29)', () => {
      const feb29_2024 = new Date(2024, 1, 29); // Feb 29, 2024
      expect(DateUtils.isValidDate(feb29_2024)).toBe(true);

      const dayOfYear = DateUtils.getDayOfYear(feb29_2024);
      expect(dayOfYear).toBe(60); // Jan has 31 days, Feb 1-29 = 60th day

      const daysRemaining = DateUtils.daysRemainingInYear(feb29_2024);
      expect(daysRemaining).toBeGreaterThan(0);
    });

    test('should handle timezone differences', () => {
      // Create dates in different ways to test timezone handling
      const date1 = new Date('2024-06-15T00:00:00Z');
      const date2 = new Date(2024, 5, 15);

      expect(DateUtils.isValidDate(date1)).toBe(true);
      expect(DateUtils.isValidDate(date2)).toBe(true);

      // Both should be valid even if timezone handling differs
      const dayOfYear1 = DateUtils.getDayOfYear(date1);
      const dayOfYear2 = DateUtils.getDayOfYear(date2);
      expect(dayOfYear1).toBeGreaterThan(0);
      expect(dayOfYear2).toBeGreaterThan(0);
    });

    test('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      expect(DateUtils.isValidDate(invalidDate)).toBe(false);

      expect(() => {
        DateUtils.daysRemainingInYear(invalidDate);
      }).toThrow('Invalid date provided');

      expect(() => {
        DateUtils.getDayOfYear(invalidDate);
      }).toThrow('Invalid date provided');

      expect(() => {
        DateUtils.daysBetween(invalidDate, new Date());
      }).toThrow('Invalid first date provided');
    });

    test('should handle dates far in future/past', () => {
      // Far future
      const futureDate = new Date(3000, 0, 1);
      expect(DateUtils.isValidDate(futureDate)).toBe(true);
      expect(DateUtils.getDayOfYear(futureDate)).toBe(1);

      // Far past
      const pastDate = new Date(1000, 0, 1);
      expect(DateUtils.isValidDate(pastDate)).toBe(true);
      expect(DateUtils.getDayOfYear(pastDate)).toBe(1);

      // Extreme future
      const extremeFuture = new Date(9999, 11, 31);
      const dayOfYear = DateUtils.getDayOfYear(extremeFuture);
      expect(dayOfYear).toBe(365);

      // Large date difference
      const diff = DateUtils.daysBetween(pastDate, futureDate);
      expect(diff).toBeGreaterThan(0);
    });

    test('should handle non-integer year in isLeapYear', () => {
      expect(() => {
        DateUtils.isLeapYear(2024.5);
      }).toThrow('Year must be an integer');
    });

    test('should handle null and undefined inputs', () => {
      expect(() => {
        DateUtils.daysRemainingInYear(null as any);
      }).toThrow('Invalid date provided');

      expect(() => {
        DateUtils.getDayOfYear(undefined as any);
      }).toThrow('Invalid date provided');

      expect(() => {
        DateUtils.isLeapYear(null as any);
      }).toThrow('Year must be an integer');
    });
  });

  describe('Performance', () => {
    test('should calculate 1000 date operations in <100ms', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        DateUtils.daysRemainingInYear(date);
        DateUtils.getDayOfYear(date);
        DateUtils.isLeapYear(date.getFullYear());
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100);
      console.log(`✓ 1000 date operations completed in ${executionTime.toFixed(2)}ms`);
    });

    test('should efficiently calculate daysBetween for 500 pairs', () => {
      const startTime = performance.now();

      for (let i = 0; i < 500; i++) {
        const date1 = new Date(2024, 0, 1);
        const date2 = new Date(2024, 0, i + 1);
        DateUtils.daysBetween(date1, date2);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(50);
      console.log(`✓ 500 daysBetween calculations completed in ${executionTime.toFixed(2)}ms`);
    });

    test('should handle leap year checks for 400 years efficiently', () => {
      const startTime = performance.now();

      for (let year = 1600; year < 2000; year++) {
        DateUtils.isLeapYear(year);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(50);
      console.log(`✓ 400 leap year checks completed in ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Additional Coverage', () => {
    test('should verify isValidDate utility function', () => {
      expect(DateUtils.isValidDate(new Date())).toBe(true);
      expect(DateUtils.isValidDate(new Date('2024-01-01'))).toBe(true);
      expect(DateUtils.isValidDate(new Date('invalid'))).toBe(false);
      expect(DateUtils.isValidDate(null)).toBe(false);
      expect(DateUtils.isValidDate('2024-01-01' as any)).toBe(false);
    });

    test('should maintain date integrity after normalization', () => {
      const originalDate = new Date(2024, 5, 15, 14, 30, 45);
      const normalized = DateUtils.normalizeYearTransition(originalDate);

      expect(normalized.getFullYear()).toBe(2024);
      expect(normalized.getMonth()).toBe(5);
      expect(normalized.getDate()).toBe(15);
    });

    test('should handle multiple consecutive date operations', () => {
      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 11, 31);

      const daysRemaining = DateUtils.daysRemainingInYear(startDate);
      const dayOfYear = DateUtils.getDayOfYear(startDate);
      const daysBetween = DateUtils.daysBetween(startDate, endDate);
      const isLeap = DateUtils.isLeapYear(2024);

      expect(daysRemaining).toBeGreaterThan(0);
      expect(dayOfYear).toBe(1);
      expect(daysBetween).toBe(365);
      expect(isLeap).toBe(true);
    });
  });
});
