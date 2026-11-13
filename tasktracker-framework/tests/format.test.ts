import { describe, expect, it } from 'vitest';
import { effortMinutes, hours, ofPlanned } from '../src/utils/format';
import { addDays, weekStart, workdays } from '../src/utils/dates';

describe('format', () => {
  it('formats hours', () => {
    expect(hours(450)).toBe('7.5h');
    expect(hours(480)).toBe('8h');
    expect(ofPlanned(150 * 60, 180 * 60)).toBe('150h / 180h');
  });
  it('calculates effort and rejects an end before the start', () => {
    expect(effortMinutes('09:00', '12:30')).toBe(210);
    expect(() => effortMinutes('12:00', '11:00')).toThrow();
  });
});

describe('dates', () => {
  it('skips weekends', () => {
    expect(workdays('2026-10-09', '2026-10-12')).toEqual(['2026-10-09', '2026-10-12']);
  });
  it('finds Monday of the week', () => {
    expect(weekStart('2026-10-21')).toBe('2026-10-19');
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
  });
});
