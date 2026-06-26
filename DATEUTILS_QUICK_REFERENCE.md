# DateUtils Quick Reference Guide

## Installation & Imports

```typescript
// Option 1: Default import (DateUtils class)
import DateUtils from '@utils/dateUtils';

// Option 2: Named imports (both class and error)
import DateUtils, { MicaError } from '@utils/dateUtils';

// Option 3: Direct file import
import DateUtils from '../../src/utils/dateUtils';
```

## Getting Started

```typescript
// Get singleton instance (always returns same instance)
const utils = DateUtils.getInstance();

// All methods available on this instance
const dayOfYear = utils.getDayOfYear(new Date());
```

---

## Method Reference

### 1. getDayOfYear(date: Date): number

**Purpose:** Get the day number within a year (1-365/366)

```typescript
const utils = DateUtils.getInstance();

// January 1st = 1
utils.getDayOfYear(new Date('2024-01-01')); // 1

// March 15th, 2024 (leap year) = 75
utils.getDayOfYear(new Date('2024-03-15')); // 75

// December 31st = 366 (leap year)
utils.getDayOfYear(new Date('2024-12-31')); // 366

// December 31st = 365 (regular year)
utils.getDayOfYear(new Date('2023-12-31')); // 365
```

**Error Handling:**
```typescript
try {
  utils.getDayOfYear(new Date('invalid'));
} catch (error) {
  if (error instanceof MicaError) {
    console.log(error.code);       // 'INVALID_DATE'
    console.log(error.severity);   // 'high'
  }
}
```

---

### 2. getDaysRemainingInYear(date: Date): number

**Purpose:** Get remaining days in year including current day

```typescript
const utils = DateUtils.getInstance();

// December 31st = 1 day remaining
utils.getDaysRemainingInYear(new Date('2024-12-31')); // 1

// December 30th = 2 days remaining
utils.getDaysRemainingInYear(new Date('2024-12-30')); // 2

// January 1st, leap year = 366 days
utils.getDaysRemainingInYear(new Date('2024-01-01')); // 366

// January 1st, regular year = 365 days
utils.getDaysRemainingInYear(new Date('2023-01-01')); // 365

// March 15th, 2024 = 292 days remaining
utils.getDaysRemainingInYear(new Date('2024-03-15')); // 292
```

---

### 3. isLeapYear(year: number): boolean

**Purpose:** Check if a year is a leap year (cached for performance)

```typescript
const utils = DateUtils.getInstance();

// Regular leap years (divisible by 4)
utils.isLeapYear(2024); // true
utils.isLeapYear(2020); // true
utils.isLeapYear(2023); // false
utils.isLeapYear(2021); // false

// Century years (divisible by 400 = leap, else not)
utils.isLeapYear(2000); // true  (divisible by 400)
utils.isLeapYear(1900); // false (divisible by 100, not 400)
utils.isLeapYear(1600); // true  (divisible by 400)
utils.isLeapYear(1800); // false (divisible by 100, not 400)
```

**Leap Year Rules:**
```
If year % 400 === 0 → LEAP YEAR
Else if year % 100 === 0 → NOT leap year
Else if year % 4 === 0 → LEAP YEAR
Else → NOT leap year
```

---

### 4. getDaysBetween(start: Date, end: Date): number

**Purpose:** Calculate absolute days between two dates

```typescript
const utils = DateUtils.getInstance();

// 9 days apart
utils.getDaysBetween(
  new Date('2024-01-01'),
  new Date('2024-01-10')
); // 9

// Order doesn't matter (returns absolute value)
utils.getDaysBetween(
  new Date('2024-01-10'),
  new Date('2024-01-01')
); // 9

// Same date
utils.getDaysBetween(
  new Date('2024-01-01'),
  new Date('2024-01-01')
); // 0

// Across year boundary
utils.getDaysBetween(
  new Date('2023-12-31'),
  new Date('2024-01-01')
); // 1

// Across leap day
utils.getDaysBetween(
  new Date('2024-02-28'),
  new Date('2024-03-01')
); // 2

// Full year
utils.getDaysBetween(
  new Date('2023-01-01'),
  new Date('2024-01-01')
); // 365
```

**Time Handling:**
```typescript
// Time components are ignored (dates normalized to midnight)
utils.getDaysBetween(
  new Date('2024-01-01T23:59:59'),
  new Date('2024-01-02T00:00:00')
); // 1 (not 0)
```

---

### 5. getTotalDaysInYear(year: number): number

**Purpose:** Get total days in a year (365 or 366)

```typescript
const utils = DateUtils.getInstance();

// Regular years
utils.getTotalDaysInYear(2023); // 365
utils.getTotalDaysInYear(2021); // 365

// Leap years
utils.getTotalDaysInYear(2024); // 366
utils.getTotalDaysInYear(2020); // 366

// Century leap year
utils.getTotalDaysInYear(2000); // 366

// Century non-leap year
utils.getTotalDaysInYear(1900); // 365
```

---

## Error Handling

### MicaError Class

```typescript
import { MicaError } from '@utils/dateUtils';

// Error properties
const error = new MicaError(
  'Invalid date provided',
  'INVALID_DATE',
  'high'
);

error.message;   // 'Invalid date provided'
error.code;      // 'INVALID_DATE'
error.severity;  // 'high'
error.name;      // 'MicaError'
```

### Error Catching

```typescript
try {
  const utils = DateUtils.getInstance();
  utils.getDayOfYear(new Date('invalid'));
} catch (error) {
  // Check if it's a MicaError
  if (error instanceof MicaError) {
    console.log(`${error.code}: ${error.message}`);
    
    // Handle by severity
    switch (error.severity) {
      case 'high':
        console.error('Critical error:', error.message);
        break;
      case 'medium':
        console.warn('Warning:', error.message);
        break;
      case 'low':
        console.info('Info:', error.message);
        break;
    }
  }
}
```

---

## Practical Examples

### Calculate Age in Days

```typescript
function getAgeInDays(birthDate: Date): number {
  const utils = DateUtils.getInstance();
  const today = new Date();
  return utils.getDaysBetween(birthDate, today);
}

const birthDate = new Date('2000-01-01');
console.log(getAgeInDays(birthDate)); // Number of days since birth
```

### Track Progress Through Year

```typescript
function getYearProgress(): { completed: number; remaining: number } {
  const utils = DateUtils.getInstance();
  const today = new Date();
  const dayOfYear = utils.getDayOfYear(today);
  const daysRemaining = utils.getDaysRemainingInYear(today);
  
  return {
    completed: dayOfYear,
    remaining: daysRemaining,
  };
}

const progress = getYearProgress();
console.log(`${progress.completed} days done, ${progress.remaining} to go`);
```

### Event Days Counter

```typescript
function daysUntilEvent(eventDate: Date): number {
  const utils = DateUtils.getInstance();
  const today = new Date();
  
  if (today > eventDate) {
    throw new Error('Event date is in the past');
  }
  
  return utils.getDaysBetween(today, eventDate);
}

const conference = new Date('2024-06-15');
console.log(`${daysUntilEvent(conference)} days until conference`);
```

### Year Validation

```typescript
function validateYear(year: number): boolean {
  const utils = DateUtils.getInstance();
  const totalDays = utils.getTotalDaysInYear(year);
  return totalDays === 365 || totalDays === 366;
}

console.log(validateYear(2024)); // true
console.log(validateYear(-5));   // false (but doesn't error)
```

---

## Performance Tips

1. **Reuse Instance:** Cache the singleton instance
   ```typescript
   // ✅ Good
   const utils = DateUtils.getInstance();
   for (let i = 0; i < 1000; i++) {
     utils.getDayOfYear(new Date());
   }

   // ❌ Avoid
   for (let i = 0; i < 1000; i++) {
     DateUtils.getInstance().getDayOfYear(new Date());
   }
   ```

2. **Cache Results:** For repeated calculations
   ```typescript
   // ✅ Good
   const utils = DateUtils.getInstance();
   const isLeap = utils.isLeapYear(2024);
   // Use isLeap multiple times

   // Automatically cached by isLeapYear internally
   ```

3. **Batch Date Operations:** When possible
   ```typescript
   const utils = DateUtils.getInstance();
   const dates = [date1, date2, date3];
   const dayNumbers = dates.map(d => utils.getDayOfYear(d));
   ```

---

## Common Mistakes to Avoid

### ❌ Don't: Create new instances
```typescript
// Wrong - creates unnecessary instances
const utils1 = DateUtils.getInstance();
const utils2 = DateUtils.getInstance();
```

### ✅ Do: Reuse singleton instance
```typescript
// Correct - reuses same instance
const utils = DateUtils.getInstance();
// Reuse utils throughout your code
```

### ❌ Don't: Ignore invalid dates
```typescript
// Wrong - no error handling
const dayOfYear = utils.getDayOfYear(invalidDate);
```

### ✅ Do: Handle errors properly
```typescript
// Correct - with error handling
try {
  const dayOfYear = utils.getDayOfYear(possiblyInvalidDate);
} catch (error) {
  if (error instanceof MicaError) {
    // Handle appropriately
  }
}
```

---

## Testing with DateUtils

```typescript
import DateUtils, { MicaError } from '@utils/dateUtils';

describe('My Date Feature', () => {
  let utils: DateUtils;

  beforeEach(() => {
    utils = DateUtils.getInstance();
  });

  it('should calculate days correctly', () => {
    const result = utils.getDayOfYear(new Date('2024-03-15'));
    expect(result).toBe(75);
  });

  it('should handle errors', () => {
    expect(() => {
      utils.getDayOfYear(new Date('invalid'));
    }).toThrow(MicaError);
  });
});
```

---

## Supported Date Formats

```typescript
const utils = DateUtils.getInstance();

// All these work:
utils.getDayOfYear(new Date());                    // Current time
utils.getDayOfYear(new Date('2024-01-01'));        // ISO string
utils.getDayOfYear(new Date(2024, 0, 1));          // Constructor
utils.getDayOfYear(new Date('2024-01-01T12:00')); // With time
utils.getDayOfYear(new Date(1704067200000));      // Timestamp

// Invalid formats throw MicaError:
utils.getDayOfYear(new Date('invalid'));          // ❌ throws
utils.getDayOfYear(null);                          // ❌ throws
utils.getDayOfYear(undefined);                     // ❌ throws
```

---

## API Reference Summary

| Method | Params | Returns | Throws |
|--------|--------|---------|--------|
| getDayOfYear | Date | number | MicaError |
| getDaysRemainingInYear | Date | number | MicaError |
| isLeapYear | number | boolean | - |
| getDaysBetween | Date, Date | number | MicaError |
| getTotalDaysInYear | number | number | - |

---

## For More Information

See [DATEUTILS_IMPLEMENTATION.md](DATEUTILS_IMPLEMENTATION.md) for:
- Complete implementation details
- Test results and coverage
- Performance benchmarks
- Advanced usage patterns

---

**Last Updated:** January 22, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
