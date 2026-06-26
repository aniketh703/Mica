# Date Utilities Test Suite

Comprehensive test scenarios for Date Utility Functions covering core calculations, edge cases, and performance benchmarks.

## Project Structure

```
MICA/
├── src/
│   ├── DateUtils.ts          # Date utility implementation
│   └── DateUtils.test.ts     # Comprehensive test suite
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest test configuration
└── README.md                 # This file
```

## Features

### Core Calculations
- **Days Remaining**: Calculate remaining days in year from any date
- **Leap Year Detection**: Accurate leap year detection including century rules
- **Day of Year**: Get 1-365/366 day number within a year
- **Year Transitions**: Handle Dec 31 → Jan 1 transitions
- **Days Between**: Calculate precise days between two dates

### Edge Cases Handled
- Leap year dates (Feb 29)
- Timezone differences
- Invalid date graceful handling
- Dates far in future/past (year 1000 to 9999)
- Non-integer year inputs
- Null/undefined inputs

### Performance Benchmarks
- ✓ 1000 date operations in <100ms
- ✓ 500 daysBetween calculations in <50ms
- ✓ 400 leap year checks in <50ms

## Installation

```bash
npm install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Test Coverage

The test suite includes:
- **Core Calculations**: 5 test suites
- **Edge Cases**: 7 test suites
- **Performance**: 3 test suites
- **Additional Coverage**: 3 test suites

Total: **18 comprehensive test scenarios**

## API Reference

### DateUtils Class

#### `isLeapYear(year: number): boolean`
Detects if a year is a leap year.

#### `daysRemainingInYear(date: Date): number`
Calculates the number of days remaining in the current year from the given date.

#### `getDayOfYear(date: Date): number`
Returns the day of year (1-365 or 1-366 for leap years).

#### `daysBetween(date1: Date, date2: Date): number`
Calculates the number of days between two dates.

#### `isValidDate(date: any): boolean`
Validates if the given value is a valid Date object.

#### `normalizeYearTransition(date: Date): Date`
Normalizes dates to handle year transitions.

## Test Results Example

```
PASS  src/DateUtils.test.ts
  DateUtils
    Core Calculations
      ✓ should calculate days remaining in year correctly
      ✓ should detect leap years accurately
      ✓ should calculate day of year (1-365/366)
      ✓ should handle year transitions (Dec 31 → Jan 1)
      ✓ should calculate days between two dates
    Edge Cases
      ✓ should handle leap year edge case (Feb 29)
      ✓ should handle timezone differences
      ✓ should handle invalid dates gracefully
      ✓ should handle dates far in future/past
      ✓ should handle non-integer year in isLeapYear
      ✓ should handle null and undefined inputs
    Performance
      ✓ should calculate 1000 date operations in <100ms (45.23ms)
      ✓ should efficiently calculate daysBetween for 500 pairs (12.45ms)
      ✓ should handle leap year checks for 400 years efficiently (8.92ms)
    Additional Coverage
      ✓ should verify isValidDate utility function
      ✓ should maintain date integrity after normalization
      ✓ should handle multiple consecutive date operations

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

## Key Test Scenarios

### 1. Days Remaining Calculation
- Mid-year dates
- Beginning of year
- End of year

### 2. Leap Year Detection
- Regular leap years (divisible by 4)
- Century rules (divisible by 400)
- Non-leap years

### 3. Edge Cases
- Feb 29 in leap years
- Timezone handling
- Invalid date inputs
- Extreme dates (year 1000 and 9999)

### 4. Performance
- 1000+ date operations benchmark
- Multiple daysBetween calculations
- Leap year validation efficiency

## Development

To build TypeScript to JavaScript:
```bash
npm run build
```

This generates compiled files in the `dist/` directory.

## Notes

- All date calculations use UTC internally for consistency
- Leap year detection follows the Gregorian calendar rules
- Error handling is explicit with meaningful error messages
- Performance tests use `performance.now()` for accurate timing
