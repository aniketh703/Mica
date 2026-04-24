import {buildYearProgressModel} from './yearProgressService';

describe('buildYearProgressModel', () => {
  it('builds the correct model for the first day of a standard year', () => {
    const model = buildYearProgressModel(new Date(2025, 0, 1));

    expect(model.daysInYear).toBe(365);
    expect(model.dayOfYear).toBe(1);
    expect(model.daysRemaining).toBe(364);
    expect(model.cells).toHaveLength(365);
    expect(model.cells[0].state).toBe('today');
  });

  it('builds the correct model for leap day', () => {
    const model = buildYearProgressModel(new Date(2024, 1, 29));

    expect(model.daysInYear).toBe(366);
    expect(model.dayOfYear).toBe(60);
    expect(model.isLeapYear).toBe(true);
    expect(model.cells[58].state).toBe('past');
    expect(model.cells[59].state).toBe('today');
    expect(model.cells[60].state).toBe('future');
  });

  it('handles the last day of the year', () => {
    const model = buildYearProgressModel(new Date(2026, 11, 31));

    expect(model.dayOfYear).toBe(365);
    expect(model.daysRemaining).toBe(0);
    expect(model.percentComplete).toBe(100);
  });
});
