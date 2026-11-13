import { describe, expect, it } from 'vitest';
import { canOpen, navFor } from '../src/nav';

describe('role-based sidebar (FR-028)', () => {
  it('Employee sees Dashboard, Activity and Leave only', () => {
    expect(navFor('employee').map((n) => n.label)).toEqual(['Dashboard', 'Activity', 'Leave']);
  });
  it('Team lead has no Locks or Admin', () => {
    const labels = navFor('team_lead').map((n) => n.label);
    expect(labels).toContain('Assignments');
    expect(labels).not.toContain('Locks');
    expect(labels).not.toContain('Admin');
  });
  it('Manager gets the combined Assignments & Admin page (FR-033)', () => {
    expect(navFor('manager').map((n) => n.label)).toContain('Assignments & Admin');
  });
  it('blocks pages outside the role', () => {
    expect(canOpen('employee', '/locks')).toBe(false);
    expect(canOpen('admin', '/admin')).toBe(true);
  });
});
