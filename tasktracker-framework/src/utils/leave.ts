// Leave rules, shared by the Leave page and the mock API so both agree.
import type { Leave } from '../api/types';

export type LeaveType = Leave['type'];

/** Leave types in display order. `credits` = days per calendar year (null = no limit). */
export const LEAVE_TYPES: { value: LeaveType; label: string; credits: number | null; advance: boolean }[] = [
  { value: 'VL', label: 'Vacation Leave', credits: 12, advance: true },
  { value: 'SL', label: 'Sick Leave', credits: null, advance: false },
  { value: 'EL', label: 'Emergency Leave', credits: 3, advance: false },
];
export const leaveInfo = (t: LeaveType) => LEAVE_TYPES.find((x) => x.value === t)!;

/** Days a leave row uses: 8h = 1 day, a half day = 0.5. */
export const leaveDays = (l: Pick<Leave, 'hours'>) => l.hours / 8;

/** Days of one leave type filed (not cancelled) by a user in the year of `year` ('YYYY' or any 'YYYY-…' date). */
export function leaveUsed(rows: Leave[], userId: number, type: LeaveType, year: string): number {
  const y = year.slice(0, 4);
  return rows
    .filter((l) => l.userId === userId && l.type === type && l.status === 'filed' && l.startDate.slice(0, 4) === y)
    .reduce((s, l) => s + leaveDays(l), 0);
}

/** Days of a leave type still available that year (never below 0), or null when the type has no limit. */
export function leaveBalance(rows: Leave[], userId: number, type: LeaveType, year: string): number | null {
  const { credits } = leaveInfo(type);
  return credits === null ? null : Math.max(0, credits - leaveUsed(rows, userId, type, year));
}

/** Why a request can't be filed for credit reasons, or null when it can. `days` is the request size in days. */
export function creditBlock(type: LeaveType, balance: number | null, days: number): string | null {
  if (balance === null) return null;
  const name = leaveInfo(type).label.toLowerCase();
  if (balance <= 0) return `Cannot file: you have 0 ${name} credits left.`;
  if (days > balance) return `Cannot file: only ${balance} ${name} day${balance === 1 ? '' : 's'} left.`;
  return null;
}
