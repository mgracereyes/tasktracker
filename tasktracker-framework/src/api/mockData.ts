// Sample data for mock mode. Period 21 Sep - 21 Oct 2026, the same people and projects as the mockups.
import type { AuditEntry, Entry, Item, Leave, Lock, Member, Notification, Project, Task, Template, UnlockRequest, User } from './types';
import { minutesToTime, workdays } from '../utils/dates';

export const PERIOD = { from: '2026-09-21', to: '2026-10-21' };

const u = (id: number, name: string, role: User['role'], lead: number | null, bu = 'Dev C', active = true, last = 'Today 08:10'): User => ({
  id, name, role, teamLeadId: lead, businessUnit: bu, active, lastSignIn: last,
  email: name.toLowerCase().replace(' ', '.') + '@awsys-i.com',
});

export const users: User[] = [
  u(1, 'Fay Ong', 'admin', null, 'Admin', true, 'Today 08:30'),
  u(2, 'Eli Park', 'manager', null, 'Dev C', true, 'Today 08:40'),
  u(3, 'Dana Lopez', 'team_lead', 2),
  u(4, 'Mia Cruz', 'team_lead', 2),
  u(5, 'Sam Reyes', 'team_lead', 2),
  u(6, 'Aisha Rahman', 'employee', 3),
  u(7, 'Ben Ortiz', 'employee', 3),
  u(8, 'Jo Tan', 'employee', 3),
  u(9, 'Raf Cruz', 'employee', 3),
  u(10, 'Lea Sison', 'employee', 4),
  u(11, 'Tom Lim', 'employee', 4),
  u(12, 'Paolo Reyes', 'employee', 4),
  u(13, 'Omar Diaz', 'employee', 5),
  u(14, 'Nina Go', 'employee', 5),
  u(15, 'Kim Bautista', 'employee', 3, 'Dev C', false, '2 Sep'),
  u(16, 'Lito Ramos', 'employee', 4, 'Dev C', false, '28 Aug'),
];

export const projects: Project[] = [
  { id: 1, name: 'Alpha', description: 'Client portal', visibility: 'public', active: true, leadId: 3 },
  { id: 2, name: 'Beta', description: 'Support desk', visibility: 'public', active: true, leadId: 3 },
  { id: 3, name: 'Gamma', description: 'Design system', visibility: 'private', active: true, leadId: 4 },
  { id: 4, name: 'Delta', description: 'Integrations', visibility: 'public', active: true, leadId: 5 },
  { id: 5, name: 'Team management', description: 'Internal meetings', visibility: 'public', active: true, leadId: 2 },
];

export const tasks: Task[] = [
  { id: 1, projectId: 1, name: 'Build', active: true },
  { id: 2, projectId: 1, name: 'Design', active: true },
  { id: 3, projectId: 2, name: 'Support', active: true },
  { id: 4, projectId: 3, name: 'Design', active: true },
  { id: 5, projectId: 3, name: 'Build', active: true },
  { id: 6, projectId: 4, name: 'Build', active: true },
  { id: 7, projectId: 5, name: 'Meetings', active: true },
];

const h = (n: number) => n * 60;
export const items: Item[] = [
  { id: 1, taskId: 1, name: 'API', workType: 'task', plannedMinutes: h(160), active: true },
  { id: 2, taskId: 1, name: 'UI', workType: 'task', plannedMinutes: h(150), active: true },
  { id: 3, taskId: 1, name: 'Testing', workType: 'task', plannedMinutes: h(130), active: true },
  { id: 4, taskId: 2, name: 'Wireframes', workType: 'task', plannedMinutes: h(60), active: true },
  { id: 5, taskId: 2, name: 'Review', workType: 'meeting', plannedMinutes: h(40), active: true },
  { id: 6, taskId: 3, name: 'Tickets', workType: 'task', plannedMinutes: h(180), active: true },
  { id: 7, taskId: 3, name: 'Escalations', workType: 'meeting', plannedMinutes: h(70), active: true },
  { id: 8, taskId: 4, name: 'Review', workType: 'meeting', plannedMinutes: h(200), active: true },
  { id: 9, taskId: 4, name: 'Prototype', workType: 'task', plannedMinutes: h(250), active: true },
  { id: 10, taskId: 5, name: 'Frontend', workType: 'task', plannedMinutes: h(260), active: true },
  { id: 11, taskId: 6, name: 'API', workType: 'task', plannedMinutes: h(250), active: true },
  { id: 12, taskId: 6, name: 'Integration', workType: 'task', plannedMinutes: h(260), active: true },
  { id: 13, taskId: 7, name: 'Stand-up', workType: 'meeting', plannedMinutes: h(110), active: true },
  { id: 14, taskId: 7, name: 'Planning', workType: 'meeting', plannedMinutes: h(80), active: true },
  { id: 15, taskId: 1, name: 'Legacy item', workType: 'task', plannedMinutes: 0, active: false },
];

// Which items each person works on (besides Team management meetings).
const WORK: Record<number, number[]> = {
  3: [1, 4, 6], 6: [1, 2, 7], 7: [3, 6], 8: [4, 5, 6], 9: [2, 4, 6],
  4: [8, 9], 10: [9, 10], 11: [10, 8], 12: [9, 10],
  5: [11, 12], 13: [11, 12], 14: [12, 11],
};

const projectOfItem = (itemId: number) => tasks.find((t) => t.id === items.find((i) => i.id === itemId)!.taskId)!.projectId;

export const members: Member[] = [];
const roleName: Record<number, string> = { 3: 'Team lead', 4: 'Team lead', 5: 'Team lead', 6: 'Developer', 7: 'QA / Tester', 8: 'Designer', 9: 'Designer', 10: 'Designer', 11: 'Developer', 12: 'Developer', 13: 'Developer', 14: 'Developer' };
for (const [uid, its] of Object.entries(WORK)) {
  const pids = new Set([...its.map(projectOfItem), 5]);
  for (const pid of pids) {
    members.push({ id: members.length + 1, projectId: pid, userId: Number(uid), roleOnProject: pid === 5 ? 'Member' : roleName[Number(uid)], startDate: '2026-09-01', endDate: '2026-12-31' });
  }
}
// One assignment that has already ended, to show the 'past end date' highlight.
const joBeta = members.find((m) => m.userId === 8 && m.projectId === 2);
if (joBeta) Object.assign(joBeta, { roleOnProject: 'Support', endDate: '2026-10-16' });

// Deterministic pseudo-random numbers so the sample data is the same on every load.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export const leave: Leave[] = [
  { id: 1, userId: 6, type: 'VL', startDate: '2026-10-09', endDate: '2026-10-09', dayPart: 'whole', hours: 8, status: 'filed', remarks: 'Long weekend' },
  { id: 2, userId: 6, type: 'SL', startDate: '2026-10-14', endDate: '2026-10-14', dayPart: 'half', halfPart: 'pm', hours: 4, status: 'filed', remarks: 'Clinic visit' },
  { id: 3, userId: 6, type: 'VL', startDate: '2026-10-29', endDate: '2026-10-30', dayPart: 'whole', hours: 16, status: 'filed', remarks: 'Family trip' },
  { id: 4, userId: 6, type: 'VL', startDate: '2026-11-02', endDate: '2026-11-02', dayPart: 'half', halfPart: 'am', hours: 4, status: 'filed' },
  { id: 5, userId: 6, type: 'SL', startDate: '2026-09-04', endDate: '2026-09-04', dayPart: 'whole', hours: 8, status: 'filed' },
  { id: 6, userId: 6, type: 'VL', startDate: '2026-08-21', endDate: '2026-08-21', dayPart: 'whole', hours: 8, status: 'filed' },
];

export const entries: Entry[] = [];
for (const [uidS, its] of Object.entries(WORK)) {
  const uid = Number(uidS);
  for (const d of workdays(PERIOD.from, PERIOD.to)) {
    const lv = leave.find((l) => l.userId === uid && l.startDate <= d && l.endDate >= d);
    let target = lv ? 480 - lv.hours * 60 : 480;
    if (!lv && rnd() < 0.12) target = 360; // some short days for the 8-hour reminder
    if (target <= 0) continue;
    let t = 9 * 60;
    const push = (itemId: number | null, mins: number, type: Entry['type'] = 'work') => {
      entries.push({ id: entries.length + 1, userId: uid, itemId, date: d, type, start: minutesToTime(t), end: minutesToTime(t + mins), minutes: mins, remarks: '' });
      t += mins;
    };
    push(13, 30); // stand-up
    let left = target - 30;
    if (rnd() < 0.25) { push(14, 60); left -= 60; }
    const first = its[Math.floor(rnd() * its.length)];
    const second = its[Math.floor(rnd() * its.length)];
    const a = Math.min(left, 180);
    push(first, a); left -= a;
    push(null, 60, 'break');
    push(second, left);
  }
}
export const locks: Lock[] = [{ id: 1, startDate: '2026-09-01', endDate: '2026-09-30', lockedBy: 2, reason: 'September closed' }];

const iso = (d: string, hhmm: string) => `${d}T${hhmm}:00+08:00`;
export const unlockRequests: UnlockRequest[] = [
  { id: 1, userId: 6, date: '2026-09-24', action: 'add', reason: 'Forgot to log the afternoon API work', details: '2 hours on Alpha / Build / API', status: 'pending', createdAt: iso('2026-10-20', '10:00'), expiresAt: iso('2026-10-23', '10:00') },
  { id: 2, userId: 7, date: '2026-09-29', action: 'edit', reason: 'Wrong item selected', details: 'Testing, not UI', status: 'pending', createdAt: iso('2026-10-21', '09:15'), expiresAt: iso('2026-10-24', '09:15') },
  { id: 3, userId: 9, date: '2026-09-22', action: 'delete', reason: 'Duplicate entry', details: '', status: 'expired', createdAt: iso('2026-10-10', '11:00'), expiresAt: iso('2026-10-13', '11:00') },
  { id: 4, userId: 3, date: '2026-09-18', action: 'add', reason: 'Missed logging the client workshop', details: '1h 15m on Alpha / Design / Review', status: 'pending', createdAt: iso('2026-10-20', '16:00'), expiresAt: iso('2026-10-23', '16:00') },
];

export const notifications: Notification[] = [];

export const templates: Template[] = [
  { id: 1, name: 'Software development', category: 'Development', sharing: 'everyone', approval: 'approved', ownerId: null, version: 3, updatedAt: '2026-10-02', updatedBy: 'Eli Park', tasks: [
    { name: 'Planning', items: ['Kickoff', 'Requirements', 'Sprint planning'] },
    { name: 'Design', items: ['Wireframes', 'UI design', 'Review'] },
    { name: 'Build', items: ['API', 'UI', 'Testing', 'Deployment'] },
    { name: 'Release', items: ['UAT', 'Go-live', 'Documentation'] }] },
  { id: 2, name: 'Client support', category: 'Operations', sharing: 'everyone', approval: 'approved', ownerId: null, version: 2, updatedAt: '2026-08-14', updatedBy: 'Eli Park', tasks: [
    { name: 'Support', items: ['Tickets', 'Escalations', 'Follow-ups'] },
    { name: 'Client calls', items: ['Check-ins', 'Workshops'] },
    { name: 'Reporting', items: ['Weekly report', 'Monthly review', 'SLA report'] }] },
  { id: 3, name: 'Internal operations', category: 'Management', sharing: 'everyone', approval: 'approved', ownerId: null, version: 1, updatedAt: '2026-06-30', updatedBy: 'Eli Park', tasks: [
    { name: 'Meetings', items: ['Stand-up', 'Planning', 'Retrospective'] },
    { name: 'Admin', items: ['Timesheets', 'Expenses'] },
    { name: 'Training', items: ['Courses', 'Mentoring'] }] },
  { id: 4, name: 'Client portal', category: 'Development', sharing: 'only_me', approval: 'not_needed', ownerId: 3, tasks: [
    { name: 'Design', items: ['Wireframes', 'Review'] },
    { name: 'Build', items: ['API', 'UI', 'Auth'] },
    { name: 'Test', items: ['Testing', 'Bug fixes', 'UAT'] },
    { name: 'Launch', items: ['Go-live', 'Handover', 'Docs'] }] },
];

export const audit: AuditEntry[] = [
  { id: 1, actorId: 2, action: 'lock', target: 'timesheet_locks 1 (1-30 Sep)', reason: 'September closed', at: '2026-10-01 09:00' },
  { id: 2, actorId: 1, action: 'role_change', target: 'users 3 (Dana Lopez) employee -> team_lead', reason: '', at: '2026-09-01 10:12' },
  { id: 3, actorId: 2, action: 'export', target: 'report XLSX, 412 rows', reason: '', at: '2026-10-05 16:40' },
  { id: 4, actorId: null, action: 'login_denied', target: 'someone@gmail.com', reason: 'Not a company account', at: '2026-10-07 08:02' },
];

export const nextId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
