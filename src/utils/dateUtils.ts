/**
 * Custom error class for MICA application errors
 */
export class MicaError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high'
  ) {
    super(message);
    this.name = 'MicaError';
    Object.setPrototypeOf(this, MicaError.prototype);
  }
}

/**
 * Singleton utility class for date operations in React Native applications.
 * Provides efficient date calculations with comprehensive error handling.
 * 
 * @example
 * ```typescript
 * const utils = DateUtils.getInstance();
 * const today = new Date('2024-03-15');
 * console.log(utils.getDayOfYear(today)); // 75
 * console.log(utils.getDaysRemainingInYear(today)); // 292
 * console.log(utils.isLeapYear(2024)); // true
 * ```
 */
export class DateUtils {
  private static instance: DateUtils;
  private leapYearCache: Map<number, boolean> = new Map();
  private currentYearLeapStatus: boolean | null = null;
  private currentCachedYear: number | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize cache for current year
    const currentYear = new Date().getFullYear();
    this.currentYearLeapStatus = this.calculateLeapYear(currentYear);
    this.currentCachedYear = currentYear;
  }

  /**
   * Gets the singleton instance of DateUtils
   * 
   * @returns {DateUtils} The singleton instance
   * 
   * @example
   * ```typescript
   * const utils = DateUtils.getInstance();
   * ```
   */
  public static getInstance(): DateUtils {
    if (!DateUtils.instance) {
      DateUtils.instance = new DateUtils();
    }
    return DateUtils.instance;
  }

  /**
   * Validates if a date is valid
   * 
   * @param {Date} date - The date to validate
   * @throws {MicaError} If date is invalid
   * @private
   */
  private validateDate(date: Date): void {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new MicaError(
        'Invalid date provided',
        'INVALID_DATE',
        'high'
      );
    }
  }

  /**
   * Calculates if a year is a leap year
   * 
   * @param {number} year - The year to check
   * @returns {boolean} True if leap year
   * @private
   */
  private calculateLeapYear(year: number): boolean {
    // Divisible by 400: leap year
    if (year % 400 === 0) return true;
    // Divisible by 100 but not 400: not a leap year
    if (year % 100 === 0) return false;
    // Divisible by 4: leap year
    return year % 4 === 0;
  }

  /**
   * Returns the day of the year for a given date.
   * January 1st is day 1, December 31st is day 365 (or 366 for leap years).
   * 
   * @param {Date} date - The date to calculate day of year for
   * @returns {number} Day of year (1-365 for regular years, 1-366 for leap years)
   * @throws {MicaError} If date is invalid
   * 
   * @example
   * ```typescript
   * const utils = DateUtils.getInstance();
   * utils.getDayOfYear(new Date('2024-01-01')); // Returns 1
   * utils.getDayOfYear(new Date('2024-12-31')); // Returns 366
   * utils.getDayOfYear(new Date('2023-12-31')); // Returns 365
   * ```
   */
  public getDayOfYear(date: Date): number {
    this.validateDate(date);

    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const diffInMs = date.getTime() - startOfYear.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    return diffInDays + 1;
  }

  /**
   * Returns the number of days remaining in the current year, including today.
   * December 31st returns 1, December 30th returns 2, etc.
   * 
   * @param {Date} date - The date to calculate remaining days from
   * @returns {number} Number of days remaining in year (including today)
   * @throws {MicaError} If date is invalid
   * 
   * @example
   * ```typescript
   * const utils = DateUtils.getInstance();
   * utils.getDaysRemainingInYear(new Date('2024-12-31')); // Returns 1
   * utils.getDaysRemainingInYear(new Date('2024-12-30')); // Returns 2
   * utils.getDaysRemainingInYear(new Date('2024-01-01')); // Returns 366
   * ```
   */
  public getDaysRemainingInYear(date: Date): number {
    this.validateDate(date);

    const year = date.getFullYear();
    const totalDays = this.getTotalDaysInYear(year);
    const dayOfYear = this.getDayOfYear(date);
    
    return totalDays - dayOfYear + 1;
  }

  /**
   * Determines if a given year is a leap year.
   * A year is a leap year if it's divisible by 4, except for century years
   * which must be divisible by 400.
   * 
   * @param {number} year - The year to check
   * @returns {boolean} True if the year is a leap year, false otherwise
   * 
   * @example
   * ```typescript
   * const utils = DateUtils.getInstance();
   * utils.isLeapYear(2024); // Returns true
   * utils.isLeapYear(2023); // Returns false
   * utils.isLeapYear(2000); // Returns true
   * utils.isLeapYear(1900); // Returns false
   * ```
   */
  public isLeapYear(year: number): boolean {
    // Check current year cache
    if (year === this.currentCachedYear && this.currentYearLeapStatus !== null) {
      return this.currentYearLeapStatus;
    }

    // Check general cache
    if (this.leapYearCache.has(year)) {
      return this.leapYearCache.get(year)!;
    }

    // Calculate and cache
    const isLeap = this.calculateLeapYear(year);
    this.leapYearCache.set(year, isLeap);

    return isLeap;
  }

  /**
   * Calculates the absolute number of days between two dates.
   * The order of dates doesn't matter (handles start > end or end > start).
   * 
   * @param {Date} start - The first date
   * @param {Date} end - The second date
   * @returns {number} Absolute number of days between the two dates
   * @throws {MicaError} If either date is invalid
   * 
   * @example
   * ```typescript
   * const utils = DateUtils.getInstance();
   * utils.getDaysBetween(new Date('2024-01-01'), new Date('2024-01-10')); // Returns 9
   * utils.getDaysBetween(new Date('2024-01-10'), new Date('2024-01-01')); // Returns 9
   * utils.getDaysBetween(new Date('2023-12-31'), new Date('2024-01-01')); // Returns 1
   * ```
   */
  public getDaysBetween(start: Date, end: Date): number {
    this.validateDate(start);
    this.validateDate(end);

    const startTime = start.getTime();
    const endTime = end.getTime();
    const diffInMs = Math.abs(endTime - startTime);
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    return diffInDays;
  }

  /**
   * Returns the total number of days in a given year.
   * Returns 366 for leap years, 365 for regular years.
   * 
   * @param {number} year - The year to check
   * @returns {number} Total days in year (365 or 366)
   * 
   * @example
   * ```typescript
   * const utils = DateUtils.getInstance();
   * utils.getTotalDaysInYear(2024); // Returns 366
   * utils.getTotalDaysInYear(2023); // Returns 365
   * utils.getTotalDaysInYear(2000); // Returns 366
   * utils.getTotalDaysInYear(1900); // Returns 365
   * ```
   */
  public getTotalDaysInYear(year: number): number {
    return this.isLeapYear(year) ? 366 : 365;
  }
}
