// Shared types. Field names follow Database Schema v1.3.

export type Role = 'employee' | 'team_lead' | 'manager' | 'admin';

export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Employee',
  team_lead: 'Team lead',
  manager: 'Manager',
  admin: 'Admin',
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  teamLeadId: number | null;
  businessUnit: string;
  active: boolean;
  lastSignIn: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  visibility: 'public' | 'private';
  active: boolean;
  leadId: number;
  /** Owner's display name (sent with the project so every role can show it). */
  leadName?: string;
}

export interface Task {
  id: number;
  projectId: number;
  name: string;
  active: boolean;
}

export interface Item {
  id: number;
  taskId: number;
  name: string;
  workType: 'task' | 'meeting';
  plannedMinutes: number;
  active: boolean;
}

export interface Member {
  id: number;
  projectId: number;
  userId: number;
  roleOnProject: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
}

export interface Entry {
  id: number;
  userId: number;
  itemId: number | null; // null = break
  date: string;
  type: 'work' | 'break';
  start: string; // HH:MM
  end: string | null; // null while running
  minutes: number;
  remarks: string;
}

export interface Leave {
  id: number;
  userId: number;
  type: 'VL' | 'SL' | 'EL';
  startDate: string;
  endDate: string;
  dayPart: 'whole' | 'half';
  /** Which half of the day, for half-day leave. */
  halfPart?: 'am' | 'pm';
  remarks?: string;
  hours: number;
  status: 'filed' | 'cancelled';
}

export interface Lock {
  id: number;
  startDate: string;
  endDate: string;
  lockedBy: number;
  reason: string;
}

export interface UnlockRequest {
  id: number;
  userId: number;
  date: string;
  action: 'add' | 'edit' | 'delete';
  reason: string;
  details: string;
  status: 'pending' | 'allowed' | 'declined' | 'expired';
  createdAt: string; // ISO
  expiresAt: string; // ISO, created + 72 h
}

export interface Notification {
  id: number;
  userId: number;
  /** unlock_pending: a short, locked day whose unlock request still waits for a decision. */
  type: 'under_8h' | 'locked_day' | 'unlock_pending' | 'unlock_decision' | 'lock_verification' | 'template_approval';
  date: string;
  message: string;
  link: string;
  read: boolean;
}

export interface Template {
  id: number;
  name: string;
  category: string;
  sharing: 'only_me' | 'my_team' | 'everyone';
  approval: 'not_needed' | 'pending' | 'approved';
  ownerId: number | null; // null = predefined
  tasks: { name: string; items: string[] }[];
  /** Template revision info, shown as "template v3, updated 2 Oct 2026 by Eli Park". */
  version?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuditEntry {
  id: number;
  actorId: number | null;
  action: string;
  target: string;
  reason: string;
  at: string;
}

/** A work entry joined with its project / task / item names. */
export interface EntryRow extends Entry {
  projectId: number;
  project: string;
  task: string;
  item: string;
  workType: 'task' | 'meeting';
}

export interface Filters {
  projectId?: number;
  taskId?: number;
  itemId?: number;
  userId?: number;
  from: string;
  to: string;
}
