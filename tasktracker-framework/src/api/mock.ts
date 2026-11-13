// In-browser mock of the backend. It enforces the same rules the API must enforce
// (roles, project membership, private projects, locks, 72-hour unlock window, audit),
// so the screens behave as they will against the real backend.
import type { Api, NewEntry } from './client';
import { ApiError } from './errors';
import type { EntryRow, Notification, Role, User } from './types';
import * as db from './mockData';
import { TODAY, NOW } from '../config';
import { daysBetween, isWeekend, workdays } from '../utils/dates';
import { effortMinutes, hm } from '../utils/format';
import { creditBlock, leaveBalance, leaveInfo } from '../utils/leave';

let me: User | null = null;

const wait = <T>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(v), 60));
const fail = (status: number, msg: string): never => {
  throw new ApiError(status, msg);
};

function current(): User {
  return me ?? fail(401, 'Please sign in');
}
function need(...roles: Role[]): User {
  const u = current();
  if (!roles.includes(u.role)) fail(403, 'Not allowed for your role');
  return u;
}
function log(action: string, target: string, reason = '') {
  db.audit.unshift({ id: db.nextId(db.audit), actorId: me?.id ?? null, action, target, reason, at: `${TODAY} ${NOW}` });
}

const teamOf = (leadId: number) => db.users.filter((x) => x.teamLeadId === leadId).map((x) => x.id);
const memberProjects = (uid: number) => new Set(db.members.filter((m) => m.userId === uid).map((m) => m.projectId));

/** Who the signed-in user may see: own data; team lead adds the team; manager and admin see everyone. */
function visibleUserIds(u: User): Set<number> {
  if (u.role === 'manager' || u.role === 'admin') return new Set(db.users.map((x) => x.id));
  if (u.role === 'team_lead') return new Set([u.id, ...teamOf(u.id)]);
  return new Set([u.id]);
}

function canSeeProject(u: User, pid: number): boolean {
  const p = db.projects.find((x) => x.id === pid);
  if (!p) return false;
  if (u.role === 'manager' || u.role === 'admin') return true;
  if (p.visibility === 'public' && u.role === 'team_lead') return true;
  return memberProjects(u.id).has(pid) || p.leadId === u.id;
}

function itemPath(itemId: number) {
  const it = db.items.find((i) => i.id === itemId)!;
  const t = db.tasks.find((x) => x.id === it.taskId)!;
  const p = db.projects.find((x) => x.id === t.projectId)!;
  return { it, t, p };
}

function lockedDay(date: string) {
  return db.locks.some((l) => l.startDate <= date && l.endDate >= date);
}

/** A locked day is open for one person only while an allowed request is less than 72 hours old. */
function openForUser(uid: number, date: string): boolean {
  if (!lockedDay(date)) return true;
  const nowIso = `${TODAY}T${NOW}:00+08:00`;
  return db.unlockRequests.some((r) => r.userId === uid && r.date === date && r.status === 'allowed' && r.expiresAt > nowIso);
}

/** A project, task or item the current user may change: Managers and Admins any, Team leads only their own projects. */
function editableOption(kind: 'project' | 'task' | 'item', id: number) {
  const u = need('team_lead', 'manager', 'admin');
  const list: { id: number; name: string; active: boolean }[] = kind === 'project' ? db.projects : kind === 'task' ? db.tasks : db.items;
  const row = list.find((x) => x.id === id) ?? fail(404, 'Not found');
  const taskId = kind === 'item' ? db.items.find((i) => i.id === id)!.taskId : kind === 'task' ? id : null;
  const projectId = taskId === null ? id : db.tasks.find((t) => t.id === taskId)!.projectId;
  const project = db.projects.find((p) => p.id === projectId)!;
  if (u.role === 'team_lead' && project.leadId !== u.id) fail(403, 'Only the project owner can change this project');
  return row;
}

function checkWritable(u: User, date: string, reason?: string) {
  if (date > TODAY) fail(400, 'Cannot log future dates');
  if (openForUser(u.id, date)) return;
  const override = (u.role === 'manager' || u.role === 'admin') && reason && reason.trim();
  if (!override) fail(423, 'This day is locked. Request an unlock first.');
}

function dayTotal(uid: number, date: string, exceptId?: number) {
  return db.entries.filter((e) => e.userId === uid && e.date === date && e.type === 'work' && e.id !== exceptId).reduce((s, e) => s + e.minutes, 0);
}

function buildNotifications(u: User): Notification[] {
  const out: Notification[] = [];
  let id = 1;
  const from = '2026-10-12';
  // Unlock requests still waiting for a decision (the day stays locked until then).
  const approver = db.users.find((x) => x.role === 'manager' && x.active)?.name ?? 'a manager';
  const pending = db.unlockRequests.filter((r) => r.userId === u.id && r.status === 'pending');
  for (const r of pending) {
    out.push({ id: id++, userId: u.id, type: 'unlock_pending', date: r.date, message: `your unlock request is waiting for ${approver}`, link: `/activity?date=${r.date}`, read: false });
  }
  // Short days up to and including today: '6h 45m logged, 1h 15m short'.
  for (const d of workdays(from, TODAY)) {
    if (pending.some((r) => r.date === d)) continue;
    const leaveH = db.leave.filter((l) => l.userId === u.id && l.status === 'filed' && l.startDate <= d && l.endDate >= d).reduce((s, l) => s + l.hours, 0);
    const logged = dayTotal(u.id, d) + leaveH * 60;
    if (logged < 480) {
      out.push({ id: id++, userId: u.id, type: lockedDay(d) ? 'locked_day' : 'under_8h', date: d, message: `${hm(logged)} logged, ${hm(480 - logged)} short`, link: `/activity?date=${d}`, read: false });
    }
  }
  for (const r of db.unlockRequests.filter((r) => r.userId === u.id && r.status !== 'pending')) {
    out.push({ id: id++, userId: u.id, type: 'unlock_decision', date: r.date, message: `Unlock request ${r.status}`, link: `/activity?date=${r.date}`, read: false });
  }
  if (u.role === 'manager' || u.role === 'admin') {
    for (const r of db.unlockRequests.filter((r) => r.status === 'pending')) {
      const who = db.users.find((x) => x.id === r.userId)!.name;
      out.push({ id: id++, userId: u.id, type: 'lock_verification', date: r.date, message: `${who} asks to ${r.action} time on a locked day`, link: '/locks', read: false });
    }
    for (const t of db.templates.filter((t) => t.approval === 'pending')) {
      out.push({ id: id++, userId: u.id, type: 'template_approval', date: TODAY, message: `Template "${t.name}" waits for approval`, link: '/setup', read: false });
    }
  }
  return out;
}

export const mockApi: Api = {
  // Sample data has no passwords: any non-empty password is accepted.
  async signIn(email, password) {
    const e = email.trim().toLowerCase();
    if (!password) fail(400, 'Enter your password.');
    if (!e.endsWith('@awsys-i.com')) {
      log('login_denied', e, 'Not a company account');
      fail(403, 'Only @awsys-i.com accounts can sign in.');
    }
    const u = db.users.find((x) => x.email === e) ?? fail(404, 'No profile for this account yet. Ask an admin.');
    if (!u.active) fail(403, 'Your access is disabled. Contact an admin.');
    me = u;
    log('login', u.email);
    return wait({ ...u });
  },
  async signOut() {
    me = null;
    return wait(undefined);
  },

  async users() {
    const u = current();
    const ids = visibleUserIds(u);
    return wait(db.users.filter((x) => ids.has(x.id)).map((x) => ({ ...x })));
  },
  async updateUser(id, patch) {
    const u = need('manager', 'admin');
    const target = db.users.find((x) => x.id === id) ?? fail(404, 'Not found');
    if (id === u.id && (patch.role || patch.active === false)) fail(400, 'You cannot change your own role or access');
    if (u.role === 'manager' && (target.role === 'admin' || target.role === 'manager' || patch.role === 'admin' || patch.role === 'manager')) {
      fail(403, 'Only admins can manage manager and admin accounts');
    }
    if (patch.active !== undefined && u.role !== 'admin') fail(403, 'Only admins can deactivate accounts');
    if (patch.role && patch.role !== target.role) log('role_change', `${target.name} ${target.role} -> ${patch.role}`);
    if (patch.active !== undefined) log(patch.active ? 'reactivate' : 'deactivate', target.name);
    Object.assign(target, patch);
    return wait(undefined);
  },

  async projects() {
    const u = current();
    return wait(db.projects.filter((p) => canSeeProject(u, p.id)).map((p) => ({ ...p, leadName: db.users.find((x) => x.id === p.leadId)?.name })));
  },
  async tasks() {
    const u = current();
    return wait(db.tasks.filter((t) => canSeeProject(u, t.projectId)).map((t) => ({ ...t })));
  },
  async items() {
    const u = current();
    return wait(db.items.filter((i) => canSeeProject(u, db.tasks.find((t) => t.id === i.taskId)!.projectId)).map((i) => ({ ...i })));
  },
  async createProject(p) {
    const u = need('team_lead', 'manager', 'admin');
    if (!p.name.trim()) fail(422, 'Project name is required');
    if (db.projects.some((x) => x.name.toLowerCase() === p.name.trim().toLowerCase())) fail(400, 'A project with this name exists');
    const owner = p.leadId && p.leadId !== u.id ? (u.role === 'team_lead' ? fail(403, 'Team leads can only create projects they own') : db.users.find((x) => x.id === p.leadId && x.active) ?? fail(400, 'Owner not found')) : u;
    const proj = { id: db.nextId(db.projects), name: p.name.trim(), description: p.description, visibility: p.visibility, active: true, leadId: owner.id };
    db.projects.push(proj);
    for (const t of p.tasks) {
      const task = { id: db.nextId(db.tasks), projectId: proj.id, name: t.name, active: true };
      db.tasks.push(task);
      for (const name of t.items) db.items.push({ id: db.nextId(db.items), taskId: task.id, name, workType: 'task', plannedMinutes: 0, active: true });
    }
    db.members.push({ id: db.nextId(db.members), projectId: proj.id, userId: owner.id, roleOnProject: 'Team lead', startDate: TODAY, endDate: '2026-12-31' });
    log('create_project', proj.name);
    return wait(proj);
  },
  async renameOption(kind, id, name) {
    const row = editableOption(kind, id);
    if (!name.trim()) fail(422, 'A name is required');
    log('rename', `${kind} "${row.name}" -> "${name}"`);
    row.name = name.trim();
    return wait(undefined);
  },
  async archiveOption(kind, id) {
    const row = editableOption(kind, id);
    row.active = false; // never deleted: past entries keep their names
    log('archive', `${kind} "${row.name}"`);
    return wait(undefined);
  },
  async restoreOption(kind, id) {
    const row = editableOption(kind, id);
    row.active = true;
    log('restore', `${kind} "${row.name}"`);
    return wait(undefined);
  },
  async addTask(projectId, name) {
    const p = editableOption('project', projectId);
    if (!name.trim()) fail(422, 'Task name is required');
    if (db.tasks.some((t) => t.projectId === p.id && t.name.toLowerCase() === name.trim().toLowerCase())) fail(400, 'This project already has a task with that name');
    db.tasks.push({ id: db.nextId(db.tasks), projectId: p.id, name: name.trim(), active: true });
    log('add_task', `${p.name} / ${name.trim()}`);
    return wait(undefined);
  },
  async addItem(taskId, name) {
    const t = editableOption('task', taskId);
    if (!name.trim()) fail(422, 'Item name is required');
    if (db.items.some((i) => i.taskId === t.id && i.name.toLowerCase() === name.trim().toLowerCase())) fail(400, 'This task already has an item with that name');
    db.items.push({ id: db.nextId(db.items), taskId: t.id, name: name.trim(), workType: 'task', plannedMinutes: 0, active: true });
    log('add_item', `${t.name} / ${name.trim()}`);
    return wait(undefined);
  },

  async templates() {
    const u = current();
    const myTeam = u.role === 'team_lead' ? u.id : u.teamLeadId;
    return wait(
      db.templates.filter(
        (t) => t.ownerId === null || t.ownerId === u.id || (t.sharing === 'my_team' && myTeam !== null && (t.ownerId === myTeam || teamOf(myTeam).includes(t.ownerId))) || (t.sharing === 'everyone' && t.approval === 'approved') || u.role === 'manager',
      ),
    );
  },
  async saveTemplate(t) {
    const u = need('team_lead', 'manager', 'admin');
    if (!t.name.trim()) fail(422, 'Template name is required');
    const tpl = { ...t, id: db.nextId(db.templates), ownerId: u.id, approval: t.sharing === 'everyone' && u.role !== 'manager' ? ('pending' as const) : ('not_needed' as const) };
    db.templates.push(tpl);
    log('save_template', `${tpl.name} (${tpl.sharing})`);
    return wait(tpl);
  },
  async approveTemplate(id) {
    need('manager');
    const t = db.templates.find((x) => x.id === id) ?? fail(404, 'Not found');
    t.approval = 'approved';
    log('approve_template', t.name);
    return wait(undefined);
  },

  async members() {
    const u = current();
    const ids = visibleUserIds(u);
    return wait(db.members.filter((m) => ids.has(m.userId)).map((m) => ({ ...m })));
  },
  async assign(m) {
    const u = need('team_lead', 'manager', 'admin');
    if (u.role === 'team_lead' && !teamOf(u.id).includes(m.userId)) fail(403, 'You can only assign your own team');
    if (m.endDate < m.startDate) fail(400, 'End date must be on or after the start date');
    if (db.members.some((x) => x.userId === m.userId && x.projectId === m.projectId)) fail(400, 'This person is already on the project');
    db.members.push({ ...m, id: db.nextId(db.members) });
    log('assign', `user ${m.userId} -> project ${m.projectId} (${m.roleOnProject})`);
    return wait(undefined);
  },
  async updateMember(id, patch) {
    const u = need('team_lead', 'manager', 'admin');
    const m = db.members.find((x) => x.id === id) ?? fail(404, 'Not found');
    if (u.role === 'team_lead' && !teamOf(u.id).includes(m.userId)) fail(403, 'You can only change your own team');
    const next = { ...m, ...patch };
    if (next.endDate < next.startDate) fail(400, 'End date must be on or after the start date');
    Object.assign(m, patch);
    log('change_assignment', `member ${id}`);
    return wait(undefined);
  },
  async removeMember(id) {
    const u = need('team_lead', 'manager', 'admin');
    const i = db.members.findIndex((x) => x.id === id);
    if (i < 0) fail(404, 'Not found');
    if (u.role === 'team_lead' && !teamOf(u.id).includes(db.members[i].userId)) fail(403, 'You can only change your own team');
    log('remove_member', `member ${id}`);
    db.members.splice(i, 1); // past entries are kept
    return wait(undefined);
  },
  async setUserProjects(userId, projectIds) {
    need('manager', 'admin');
    const keep = new Set(projectIds);
    for (let i = db.members.length - 1; i >= 0; i--) {
      if (db.members[i].userId === userId && !keep.has(db.members[i].projectId)) db.members.splice(i, 1);
    }
    for (const pid of keep) {
      if (!db.members.some((m) => m.userId === userId && m.projectId === pid)) {
        db.members.push({ id: db.nextId(db.members), userId, projectId: pid, roleOnProject: 'Member', startDate: TODAY, endDate: '2026-12-31' });
      }
    }
    log('set_projects', `user ${userId}: ${[...keep].join(', ')}`);
    return wait(undefined);
  },

  async entries(f) {
    const u = current();
    const ids = visibleUserIds(u);
    if (f.userId !== undefined && !ids.has(f.userId)) fail(404, 'Not found');
    const rows: EntryRow[] = [];
    for (const e of db.entries) {
      if (!ids.has(e.userId) || e.date < f.from || e.date > f.to) continue;
      if (f.userId !== undefined && e.userId !== f.userId) continue;
      if (e.type === 'break') {
        if (f.projectId || f.taskId || f.itemId) continue;
        rows.push({ ...e, projectId: 0, project: '', task: '', item: 'Break', workType: 'task' });
        continue;
      }
      const { it, t, p } = itemPath(e.itemId!);
      if (f.projectId && p.id !== f.projectId) continue;
      if (f.taskId && t.id !== f.taskId) continue;
      if (f.itemId && it.id !== f.itemId) continue;
      rows.push({ ...e, projectId: p.id, project: p.name, task: t.name, item: it.name, workType: it.workType });
    }
    return wait(rows.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)));
  },
  async addEntry(e: NewEntry) {
    const u = current();
    const { it, p } = itemPath(e.itemId);
    if (!it.active) fail(400, 'This item is archived');
    if (!memberProjects(u.id).has(p.id)) fail(403, 'This project is not assigned to you');
    checkWritable(u, e.date);
    const mins = effortMinutes(e.start, e.end);
    if (dayTotal(u.id, e.date) + mins > 1440) fail(400, 'A day cannot exceed 24 hours');
    db.entries.push({ id: db.nextId(db.entries), userId: u.id, itemId: e.itemId, date: e.date, type: 'work', start: e.start, end: e.end, minutes: mins, remarks: e.remarks });
    log('add_entry', `${p.name} ${e.date} ${e.start}-${e.end}`);
    return wait(undefined);
  },
  async updateEntry(id, e, reason) {
    const u = current();
    const row = db.entries.find((x) => x.id === id && x.userId === u.id) ?? fail(404, 'Not found');
    checkWritable(u, row.date, reason);
    const mins = effortMinutes(e.start, e.end);
    if (dayTotal(u.id, row.date, id) + mins > 1440) fail(400, 'A day cannot exceed 24 hours');
    log('edit_entry', `entry ${id} ${row.start}-${row.end} -> ${e.start}-${e.end}`, reason ?? '');
    Object.assign(row, { start: e.start, end: e.end, remarks: e.remarks, minutes: mins });
    return wait(undefined);
  },
  async deleteEntry(id, reason) {
    const u = current();
    const i = db.entries.findIndex((x) => x.id === id && x.userId === u.id);
    if (i < 0) fail(404, 'Not found');
    checkWritable(u, db.entries[i].date, reason);
    log('delete_entry', `entry ${id}`, reason ?? '');
    db.entries.splice(i, 1);
    return wait(undefined);
  },
  async addBreak(date, start, end) {
    const u = current();
    checkWritable(u, date);
    db.entries.push({ id: db.nextId(db.entries), userId: u.id, itemId: null, date, type: 'break', start, end, minutes: effortMinutes(start, end), remarks: '' });
    return wait(undefined);
  },
  async correctEntry(id, e, reason) {
    need('admin');
    if (!reason.trim()) fail(400, 'A reason is required for a correction');
    const row = db.entries.find((x) => x.id === id) ?? fail(404, 'Not found');
    log('correct_entry', `entry ${id} ${row.start}-${row.end} -> ${e.start}-${e.end}`, reason);
    Object.assign(row, { start: e.start, end: e.end, minutes: effortMinutes(e.start, e.end) });
    return wait(undefined);
  },

  async leave(userId) {
    const u = current();
    const ids = visibleUserIds(u);
    return wait(db.leave.filter((l) => ids.has(l.userId) && (userId === undefined || l.userId === userId)).map((l) => ({ ...l })));
  },
  async fileLeave(l) {
    const u = current();
    if (l.endDate < l.startDate) fail(400, 'End date must be on or after the start date');
    if (l.dayPart === 'half' && l.startDate !== l.endDate) fail(400, 'A half day covers one date only');
    const days = workdays(l.startDate, l.endDate).length;
    if (days === 0) fail(400, 'Leave must include at least one weekday');
    const hours = l.dayPart === 'half' ? 4 : days * 8;
    const info = leaveInfo(l.type) ?? fail(400, 'Unknown leave type');
    if (!info.advance && l.endDate > TODAY) fail(400, `${info.label} cannot be filed in advance`);
    if (info.credits !== null) {
      if (l.startDate.slice(0, 4) !== l.endDate.slice(0, 4)) fail(400, `${info.label} must start and end in the same year`);
      const block = creditBlock(l.type, leaveBalance(db.leave, u.id, l.type, l.startDate), hours / 8);
      if (block) fail(400, block);
    }
    // Future days (VL only) are not checked; past days follow the normal lock rules.
    for (const d of workdays(l.startDate, l.endDate)) if (d <= TODAY) checkWritable(u, d);
    db.leave.push({
      ...l,
      halfPart: l.dayPart === 'half' ? l.halfPart ?? 'am' : undefined,
      remarks: l.remarks?.trim() || undefined,
      id: db.nextId(db.leave),
      userId: u.id,
      hours,
      status: 'filed',
    });
    log('file_leave', `${l.type} ${l.startDate}..${l.endDate}`);
    return wait(undefined);
  },
  async cancelLeave(id) {
    const u = current();
    const l = db.leave.find((x) => x.id === id && x.userId === u.id) ?? fail(404, 'Not found');
    for (const d of daysBetween(l.startDate, l.endDate)) if (!isWeekend(d) && d <= TODAY) checkWritable(u, d);
    l.status = 'cancelled';
    log('cancel_leave', `leave ${id}`);
    return wait(undefined);
  },

  async locks() {
    current();
    return wait(db.locks.map((l) => ({ ...l })));
  },
  async addLock(l) {
    const u = need('manager', 'admin');
    if (l.endDate < l.startDate) fail(400, 'End date must be on or after the start date');
    db.locks.push({ ...l, id: db.nextId(db.locks), lockedBy: u.id });
    log('lock', `${l.startDate}..${l.endDate}`, l.reason);
    return wait(undefined);
  },
  async removeLock(id) {
    need('manager', 'admin');
    const i = db.locks.findIndex((x) => x.id === id);
    if (i < 0) fail(404, 'Not found');
    log('unlock', `lock ${id}`);
    db.locks.splice(i, 1);
    return wait(undefined);
  },
  async unlockRequests() {
    const u = current();
    const nowIso = `${TODAY}T${NOW}:00+08:00`;
    for (const r of db.unlockRequests) if (r.status === 'pending' && r.expiresAt <= nowIso) r.status = 'expired';
    const ids = visibleUserIds(u);
    return wait(db.unlockRequests.filter((r) => ids.has(r.userId)).map((r) => ({ ...r })));
  },
  async requestUnlock(r) {
    const u = current();
    if (!lockedDay(r.date)) fail(400, 'Those dates are not locked');
    if (!r.reason.trim()) fail(422, 'A reason is required');
    const created = `${TODAY}T${NOW}:00+08:00`;
    const exp = new Date(new Date(created).getTime() + 72 * 3600 * 1000).toISOString();
    db.unlockRequests.push({ ...r, id: db.nextId(db.unlockRequests), userId: u.id, status: 'pending', createdAt: created, expiresAt: exp });
    log('unlock_request', `${r.date} (${r.action})`, r.reason);
    return wait(undefined);
  },
  async decideUnlock(id, allow) {
    need('manager', 'admin');
    const r = db.unlockRequests.find((x) => x.id === id) ?? fail(404, 'Not found');
    if (r.status !== 'pending') fail(400, `This request is ${r.status}`);
    r.status = allow ? 'allowed' : 'declined';
    if (allow) {
      const opened = `${TODAY}T${NOW}:00+08:00`;
      r.expiresAt = new Date(new Date(opened).getTime() + 72 * 3600 * 1000).toISOString();
    }
    log(allow ? 'unlock_allowed' : 'unlock_declined', `request ${id} (${r.date})`);
    return wait(undefined);
  },
  async isOpen(userId, date) {
    current();
    return wait(openForUser(userId, date));
  },

  async notifications() {
    return wait(buildNotifications(current()));
  },
  async audit() {
    need('admin');
    return wait(db.audit.map((a) => ({ ...a })));
  },
};
