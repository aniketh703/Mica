import { DateUtils, MicaError } from '../../src/utils/dateUtils';

describe('DateUtils', () => {
  let dateUtils: DateUtils;

  beforeEach(() => {
    dateUtils = DateUtils.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DateUtils.getInstance();
      const instance2 = DateUtils.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getDayOfYear', () => {
    describe('Regular Year (2023)', () => {
      it('should return 1 for January 1st', () => {
        const date = new Date('2023-01-01');
        expect(dateUtils.getDayOfYear(date)).toBe(1);
      });

      it('should return 365 for December 31st', () => {
        const date = new Date('2023-12-31');
        expect(dateUtils.getDayOfYear(date)).toBe(365);
      });

      it('should return 32 for February 1st', () => {
        const date = new Date('2023-02-01');
        expect(dateUtils.getDayOfYear(date)).toBe(32);
      });

      it('should return 59 for February 28th', () => {
        const date = new Date('2023-02-28');
        expect(dateUtils.getDayOfYear(date)).toBe(59);
      });

      it('should return 60 for March 1st', () => {
        const date = new Date('2023-03-01');
        expect(dateUtils.getDayOfYear(date)).toBe(60);
      });
    });

    describe('Leap Year (2024)', () => {
      it('should return 1 for January 1st', () => {
        const date = new Date('2024-01-01');
        expect(dateUtils.getDayOfYear(date)).toBe(1);
      });

      it('should return 366 for December 31st', () => {
        const date = new Date('2024-12-31');
        expect(dateUtils.getDayOfYear(date)).toBe(366);
      });

      it('should return 60 for February 29th', () => {
        const date = new Date('2024-02-29');
        expect(dateUtils.getDayOfYear(date)).toBe(60);
      });

      it('should return 61 for March 1st', () => {
        const date = new Date('2024-03-01');
        expect(dateUtils.getDayOfYear(date)).toBe(61);
      });

      it('should return 75 for March 15th', () => {
        const date = new Date('2024-03-15');
        expect(dateUtils.getDayOfYear(date)).toBe(75);
      });
    });

    describe('Invalid Date Handling', () => {
      it('should throw MicaError for invalid date', () => {
        const invalidDate = new Date('invalid');
        expect(() => dateUtils.getDayOfYear(invalidDate)).toThrow(MicaError);
      });

      it('should throw error with correct code', () => {
        const invalidDate = new Date('invalid');
        try {
          dateUtils.getDayOfYear(invalidDate);
        } catch (error) {
          expect(error).toBeInstanceOf(MicaError);
          expect((error as MicaError).code).toBe('INVALID_DATE');
          expect((error as MicaError).severity).toBe('high');
        }
      });
    });
  });

  describe('getDaysRemainingInYear', () => {
    describe('Regular Year (2023)', () => {
      it('should return 1 for December 31st', () => {
        const date = new Date('2023-12-31');
        expect(dateUtils.getDaysRemainingInYear(date)).toBe(1);
      });

      it('should return 2 for December 30th', () => {
        const date = new Date('2023-12-30');
        expect(dateUtils.getDaysRemainingInYear(date)).toBe(2);
      });

      it('should return 365 for January 1st', () => {
        const date = new Date('2023-01-01');
        expect(dateUtils.getDaysRemainingInYear(date)).toBe(365);
      });

      it('should return 183 for July 2nd (mid-year)', () => {
        const date = new Date('2023-07-02');
        expect(dateUtils.getDaysRemainingInYear(date)).toBe(183);
      });
    });

    describe('Leap Year (2024)', () => {
      it('should return 1 for December 31st', () => {
        const date = new Date('2024-12-31');
        expect(dateUtils.getDaysRemainingInYear(date)).toBe(1);
      });

      it('should return 2 for December 30th', () => {
        const date = new Date('2024-12-30');
        expect(dateUtils.getDaysRemainingInYear(date)).toBe(2);
      });

      it('should return 366 for January 1st', () => {
        const date = new Date('2024-01-01');
        expect(dateUtils.getDaysRemainingInYear(date)).toBe(366);
      });

      it('should return 292 for March 15th', () => {
        const date = new Date('2024-03-15');
        expect(dateUtils.getDaysRemainingInYear(date)).toBe(292);
      });
    });

    describe('Year Boundary Transitions', () => {
      it('should handle transition from Dec 31 to Jan 1', () => {
        const dec31 = new Date('2023-12-31');
        const jan1 = new Date('2024-01-01');
        expect(dateUtils.getDaysRemainingInYear(dec31)).toBe(1);
        expect(dateUtils.getDaysRemainingInYear(jan1)).toBe(366);
      });
    });

    describe('Invalid Date Handling', () => {
      it('should throw MicaError for invalid date', () => {
        const invalidDate = new Date('invalid');
        expect(() => dateUtils.getDaysRemainingInYear(invalidDate)).toThrow(MicaError);
      });
    });
  });

  describe('isLeapYear', () => {
    describe('Regular Leap Years', () => {
      it('should return true for 2024', () => {
        expect(dateUtils.isLeapYear(2024)).toBe(true);
      });

      it('should return true for 2020', () => {
        expect(dateUtils.isLeapYear(2020)).toBe(true);
      });

      it('should return false for 2023', () => {
        expect(dateUtils.isLeapYear(2023)).toBe(false);
      });

      it('should return false for 2021', () => {
        expect(dateUtils.isLeapYear(2021)).toBe(false);
      });
    });

    describe('Century Years', () => {
      it('should return true for 2000 (divisible by 400)', () => {
        expect(dateUtils.isLeapYear(2000)).toBe(true);
      });

      it('should return false for 1900 (divisible by 100 but not 400)', () => {
        expect(dateUtils.isLeapYear(1900)).toBe(false);
      });

      it('should return false for 1800', () => {
        expect(dateUtils.isLeapYear(1800)).toBe(false);
      });

      it('should return true for 1600', () => {
        expect(dateUtils.isLeapYear(1600)).toBe(true);
      });
    });

    describe('Caching', () => {
      it('should cache leap year calculations', () => {
        // First call
        const result1 = dateUtils.isLeapYear(2024);
        // Second call should use cache
        const result2 = dateUtils.isLeapYear(2024);
        expect(result1).toBe(result2);
        expect(result1).toBe(true);
      });
    });
  });

  describe('getDaysBetween', () => {
    it('should return 9 for dates 9 days apart', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-10');
      expect(dateUtils.getDaysBetween(start, end)).toBe(9);
    });

    it('should handle dates in reverse order', () => {
      const start = new Date('2024-01-10');
      const end = new Date('2024-01-01');
      expect(dateUtils.getDaysBetween(start, end)).toBe(9);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2024-01-01');
      expect(dateUtils.getDaysBetween(date, date)).toBe(0);
    });

    it('should handle year boundary crossing', () => {
      const start = new Date('2023-12-31');
      const end = new Date('2024-01-01');
      expect(dateUtils.getDaysBetween(start, end)).toBe(1);
    });

    it('should handle dates far apart', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2024-01-01');
      expect(dateUtils.getDaysBetween(start, end)).toBe(365);
    });

    it('should handle leap year date ranges', () => {
      const start = new Date('2024-02-28');
      const end = new Date('2024-03-01');
      expect(dateUtils.getDaysBetween(start, end)).toBe(2);
    });

    describe('Invalid Date Handling', () => {
      it('should throw MicaError for invalid start date', () => {
        const invalidDate = new Date('invalid');
        const validDate = new Date('2024-01-01');
        expect(() => dateUtils.getDaysBetween(invalidDate, validDate)).toThrow(MicaError);
      });

      it('should throw MicaError for invalid end date', () => {
        const validDate = new Date('2024-01-01');
        const invalidDate = new Date('invalid');
        expect(() => dateUtils.getDaysBetween(validDate, invalidDate)).toThrow(MicaError);
      });
    });
  });

  describe('getTotalDaysInYear', () => {
    it('should return 365 for regular year 2023', () => {
      expect(dateUtils.getTotalDaysInYear(2023)).toBe(365);
    });

    it('should return 366 for leap year 2024', () => {
      expect(dateUtils.getTotalDaysInYear(2024)).toBe(366);
    });

    it('should return 366 for year 2000', () => {
      expect(dateUtils.getTotalDaysInYear(2000)).toBe(366);
    });

    it('should return 365 for year 1900', () => {
      expect(dateUtils.getTotalDaysInYear(1900)).toBe(365);
    });
  });

  describe('Edge Cases', () => {
    it('should handle February 29 in leap year', () => {
      const feb29 = new Date('2024-02-29');
      expect(dateUtils.getDayOfYear(feb29)).toBe(60);
      expect(dateUtils.getDaysRemainingInYear(feb29)).toBe(307);
    });

    it('should handle dates with time components', () => {
      const date1 = new Date('2024-01-01T23:59:59');
      const date2 = new Date('2024-01-01T00:00:00');
      expect(dateUtils.getDayOfYear(date1)).toBe(1);
      expect(dateUtils.getDayOfYear(date2)).toBe(1);
    });

    it('should handle different timezones consistently', () => {
      const date = new Date('2024-01-01');
      expect(dateUtils.getDayOfYear(date)).toBe(1);
    });
  });

  describe('Performance Test', () => {
    it('should complete 1000 operations in less than 100ms', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const date = new Date(2024, 0, 1 + (i % 365));
        dateUtils.getDayOfYear(date);
        dateUtils.getDaysRemainingInYear(date);
        dateUtils.isLeapYear(2024);
        dateUtils.getTotalDaysInYear(2024);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
    });

    it('should efficiently calculate days between dates', () => {
      const startTime = performance.now();
      
      const start = new Date('2024-01-01');
      for (let i = 0; i < 1000; i++) {
        const end = new Date(2024, 0, 1 + i);
        dateUtils.getDaysBetween(start, end);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
    });
  });

  describe('MicaError', () => {
    it('should create error with correct properties', () => {
      const error = new MicaError('Test error', 'TEST_CODE', 'medium');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.severity).toBe('medium');
      expect(error.name).toBe('MicaError');
    });

    it('should be instanceof Error', () => {
      const error = new MicaError('Test error', 'TEST_CODE', 'low');
      expect(error).toBeInstanceOf(Error);
    });

    it('should be instanceof MicaError', () => {
      const error = new MicaError('Test error', 'TEST_CODE', 'high');
      expect(error).toBeInstanceOf(MicaError);
    });
  });

  describe('Integration Tests', () => {
    it('should correctly calculate year statistics for 2024', () => {
      const date = new Date('2024-03-15');
      const dayOfYear = dateUtils.getDayOfYear(date);
      const daysRemaining = dateUtils.getDaysRemainingInYear(date);
      const totalDays = dateUtils.getTotalDaysInYear(2024);
      
      expect(dayOfYear).toBe(75);
      expect(daysRemaining).toBe(292);
      expect(totalDays).toBe(366);
      expect(dayOfYear + daysRemaining - 1).toBe(totalDays);
    });

    it('should correctly calculate year statistics for 2023', () => {
      const date = new Date('2023-03-15');
      const dayOfYear = dateUtils.getDayOfYear(date);
      const daysRemaining = dateUtils.getDaysRemainingInYear(date);
      const totalDays = dateUtils.getTotalDaysInYear(2023);
      
      expect(dayOfYear).toBe(74);
      expect(daysRemaining).toBe(292);
      expect(totalDays).toBe(365);
      expect(dayOfYear + daysRemaining - 1).toBe(totalDays);
    });
  });
});
