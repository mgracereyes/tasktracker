import { describe, expect, it } from 'vitest';
import type { Leave } from '../src/api/types';
import { creditBlock, leaveBalance, leaveInfo, leaveUsed } from '../src/utils/leave';

const row = (p: Partial<Leave>): Leave => ({
  id: 1, userId: 6, type: 'VL', startDate: '2026-10-09', endDate: '2026-10-09', dayPart: 'whole', hours: 8, status: 'filed', ...p,
});

describe('vacation leave credits', () => {
  it('gives 12 days a year', () => {
    expect(leaveInfo('VL').credits).toBe(12);
    expect(leaveBalance([], 6, 'VL', '2026')).toBe(12);
  });
  it('counts filed VL only: half days, not SL, not cancelled, not other users or years', () => {
    const rows = [
      row({ hours: 16 }),
      row({ hours: 4, dayPart: 'half' }),
      row({ type: 'SL' }),
      row({ status: 'cancelled' }),
      row({ userId: 7 }),
      row({ startDate: '2025-12-01', endDate: '2025-12-01' }),
    ];
    expect(leaveUsed(rows, 6, 'VL', '2026-11-02')).toBe(2.5);
    expect(leaveBalance(rows, 6, 'VL', '2026')).toBe(9.5);
  });
  it('blocks filing at 0 credits or beyond the balance', () => {
    expect(leaveBalance([row({ hours: 96 })], 6, 'VL', '2026')).toBe(0);
    expect(creditBlock('VL', 0, 1)).toMatch(/0 vacation leave credits/);
    expect(creditBlock('VL', 2, 3)).toMatch(/only 2 vacation leave days left/);
    expect(creditBlock('VL', 2, 2)).toBeNull();
    expect(creditBlock('VL', 0.5, 0.5)).toBeNull();
  });
});

describe('sick and emergency leave credits', () => {
  it('sick leave has no limit', () => {
    const rows = Array.from({ length: 15 }, (_, i) => row({ id: i, type: 'SL' }));
    expect(leaveUsed(rows, 6, 'SL', '2026')).toBe(15);
    expect(leaveBalance(rows, 6, 'SL', '2026')).toBeNull();
    expect(creditBlock('SL', null, 5)).toBeNull();
  });
  it('emergency leave gives 3 days a year and blocks at 0', () => {
    expect(leaveBalance([], 6, 'EL', '2026')).toBe(3);
    const rows = [row({ type: 'EL', hours: 16 }), row({ type: 'EL', hours: 8 })];
    expect(leaveBalance(rows, 6, 'EL', '2026')).toBe(0);
    expect(creditBlock('EL', 0, 1)).toMatch(/0 emergency leave credits/);
  });
});
