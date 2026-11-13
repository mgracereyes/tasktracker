// Sidebar items by role (FR-028). The backend enforces the same rules on every request.
import type { Role } from './api/types';

export type NavKey = 'dashboard' | 'activity' | 'leave' | 'setup' | 'assignments' | 'reports' | 'locks' | 'admin';

export interface NavItem {
  key: NavKey;
  label: string;
  path: string;
}

const ITEMS: Record<NavKey, NavItem> = {
  dashboard: { key: 'dashboard', label: 'Dashboard', path: '/' },
  activity: { key: 'activity', label: 'Activity', path: '/activity' },
  leave: { key: 'leave', label: 'Leave', path: '/leave' },
  setup: { key: 'setup', label: 'Setup', path: '/setup' },
  assignments: { key: 'assignments', label: 'Assignments', path: '/assignments' },
  reports: { key: 'reports', label: 'Reports', path: '/reports' },
  locks: { key: 'locks', label: 'Locks', path: '/locks' },
  admin: { key: 'admin', label: 'Admin', path: '/admin' },
};

const BY_ROLE: Record<Role, NavKey[]> = {
  employee: ['dashboard', 'activity', 'leave'],
  team_lead: ['dashboard', 'activity', 'leave', 'setup', 'assignments', 'reports'],
  manager: ['dashboard', 'activity', 'leave', 'setup', 'assignments', 'reports', 'locks'],
  admin: ['dashboard', 'activity', 'leave', 'setup', 'assignments', 'reports', 'locks', 'admin'],
};

export function navFor(role: Role): NavItem[] {
  return BY_ROLE[role].map((k) => {
    // The Manager has one combined "Assignments & Admin" page (FR-033).
    if (role === 'manager' && k === 'assignments') return { ...ITEMS.assignments, label: 'Assignments & Admin' };
    return ITEMS[k];
  });
}

export function canOpen(role: Role, path: string): boolean {
  const base = '/' + (path.split('/')[1] ?? '');
  return navFor(role).some((n) => n.path === base);
}
