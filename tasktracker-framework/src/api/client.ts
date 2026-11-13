// One API for the whole app. Pages call `api.*` only; they never touch data directly.
// VITE_USE_MOCK=true -> the in-browser sample data (mock.ts), which applies the same permission
// rules as the backend. Otherwise -> the FastAPI backend (http.ts).
import type {
  AuditEntry, EntryRow, Filters, Item, Leave, Lock, Member, Notification, Project, Task, Template, UnlockRequest, User,
} from './types';
import { mockApi } from './mock';
import { httpApi } from './http';

export { ApiError } from './errors';

export interface NewEntry {
  itemId: number;
  date: string;
  start: string;
  end: string;
  remarks: string;
}

export interface Api {
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;

  users(): Promise<User[]>;
  updateUser(id: number, patch: Partial<Pick<User, 'role' | 'active' | 'businessUnit' | 'teamLeadId'>>): Promise<void>;

  projects(): Promise<Project[]>;
  tasks(): Promise<Task[]>;
  items(): Promise<Item[]>;
  /** `leadId` sets the owner (Managers and Admins only; Team leads always own what they create). */
  createProject(p: { name: string; description: string; visibility: Project['visibility']; tasks: { name: string; items: string[] }[]; leadId?: number }): Promise<Project>;
  renameOption(kind: 'project' | 'task' | 'item', id: number, name: string): Promise<void>;
  archiveOption(kind: 'project' | 'task' | 'item', id: number): Promise<void>;
  restoreOption(kind: 'project' | 'task' | 'item', id: number): Promise<void>;
  addTask(projectId: number, name: string): Promise<void>;
  addItem(taskId: number, name: string): Promise<void>;

  templates(): Promise<Template[]>;
  saveTemplate(t: Omit<Template, 'id' | 'approval' | 'ownerId'>): Promise<Template>;
  approveTemplate(id: number): Promise<void>;

  members(): Promise<Member[]>;
  assign(m: Omit<Member, 'id'>): Promise<void>;
  updateMember(id: number, patch: Partial<Pick<Member, 'startDate' | 'endDate' | 'roleOnProject'>>): Promise<void>;
  removeMember(id: number): Promise<void>;
  setUserProjects(userId: number, projectIds: number[]): Promise<void>;

  entries(f: Filters): Promise<EntryRow[]>;
  addEntry(e: NewEntry): Promise<void>;
  updateEntry(id: number, e: Pick<NewEntry, 'start' | 'end' | 'remarks'>, reason?: string): Promise<void>;
  deleteEntry(id: number, reason?: string): Promise<void>;
  addBreak(date: string, start: string, end: string): Promise<void>;
  correctEntry(id: number, e: Pick<NewEntry, 'start' | 'end'>, reason: string): Promise<void>;

  leave(userId?: number): Promise<Leave[]>;
  fileLeave(l: Omit<Leave, 'id' | 'userId' | 'hours' | 'status'>): Promise<void>;
  cancelLeave(id: number): Promise<void>;

  locks(): Promise<Lock[]>;
  addLock(l: Omit<Lock, 'id' | 'lockedBy'>): Promise<void>;
  removeLock(id: number): Promise<void>;
  unlockRequests(): Promise<UnlockRequest[]>;
  requestUnlock(r: Pick<UnlockRequest, 'date' | 'action' | 'reason' | 'details'>): Promise<void>;
  decideUnlock(id: number, allow: boolean): Promise<void>;
  isOpen(userId: number, date: string): Promise<boolean>;

  notifications(): Promise<Notification[]>;
  audit(): Promise<AuditEntry[]>;
}

export const useMock = (import.meta.env?.VITE_USE_MOCK ?? 'true') !== 'false';

export const api: Api = useMock ? mockApi : httpApi;
