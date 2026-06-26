/**
 * Date Utility Functions
 * Provides calculations and manipulations for date operations
 */

export class DateUtils {
  /**
   * Calculates the number of days remaining in the current year
   */
  static daysRemainingInYear(date: Date): number {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    const currentYear = date.getFullYear();
    const lastDayOfYear = new Date(currentYear, 11, 31);
    const timeDiff = lastDayOfYear.getTime() - date.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  }

  /**
   * Detects if a year is a leap year
   */
  static isLeapYear(year: number): boolean {
    if (!Number.isInteger(year)) {
      throw new Error('Year must be an integer');
    }
    
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Calculates the day of year (1-365/366)
   */
  static getDayOfYear(date: Date): number {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const timeDiff = date.getTime() - firstDayOfYear.getTime();
    const dayOfYear = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    
    return dayOfYear;
  }

  /**
   * Calculates the number of days between two dates
   */
  static daysBetween(date1: Date, date2: Date): number {
    if (!(date1 instanceof Date) || isNaN(date1.getTime())) {
      throw new Error('Invalid first date provided');
    }
    if (!(date2 instanceof Date) || isNaN(date2.getTime())) {
      throw new Error('Invalid second date provided');
    }
    
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  }

  /**
   * Checks if a given date is valid
   */
  static isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Handles year transitions by normalizing dates
   */
  static normalizeYearTransition(date: Date): Date {
    if (!this.isValidDate(date)) {
      throw new Error('Invalid date provided');
    }
    
    const normalized = new Date(date);
    return new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate());
  }
}
