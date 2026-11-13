// Backend implementation. Endpoints follow the backend modules (auth, setup, assignments,
// activity, leave, dashboards, locks, notifications, reports, admin). The session is an
// httpOnly cookie set by the backend, so no token is ever stored in the browser.
import type { Api } from './client';
import { ApiError } from './errors';

const BASE = import.meta.env?.VITE_API_URL ?? 'http://localhost:8000';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = (await res.json()).detail ?? msg;
    } catch {
      /* keep status text */
    }
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const get = <T>(p: string) => req<T>('GET', p);
const post = <T>(p: string, b?: unknown) => req<T>('POST', p, b ?? {});
const put = <T>(p: string, b: unknown) => req<T>('PUT', p, b);
const del = <T>(p: string, b?: unknown) => req<T>('DELETE', p, b);
const qs = (o: object) =>
  '?' + new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();

export const httpApi: Api = {
  signIn: (email, password) => post('/auth/login', { email, password }),
  signOut: () => post('/auth/logout'),

  users: () => get('/admin/users'),
  updateUser: (id, patch) => put(`/admin/users/${id}`, patch),

  projects: () => get('/setup/projects'),
  tasks: () => get('/setup/tasks'),
  items: () => get('/setup/items'),
  createProject: (p) => post('/setup/projects', p),
  renameOption: (kind, id, name) => put(`/setup/${kind}s/${id}`, { name }),
  archiveOption: (kind, id) => post(`/setup/${kind}s/${id}/archive`),
  restoreOption: (kind, id) => post(`/setup/${kind}s/${id}/restore`),
  addTask: (projectId, name) => post(`/setup/projects/${projectId}/tasks`, { name }),
  addItem: (taskId, name) => post(`/setup/tasks/${taskId}/items`, { name }),

  templates: () => get('/setup/templates'),
  saveTemplate: (t) => post('/setup/templates', t),
  approveTemplate: (id) => post(`/setup/templates/${id}/approve`),

  members: () => get('/assignments'),
  assign: (m) => post('/assignments', m),
  updateMember: (id, patch) => put(`/assignments/${id}`, patch),
  removeMember: (id) => del(`/assignments/${id}`),
  setUserProjects: (userId, projectIds) => put(`/admin/users/${userId}/projects`, { projectIds }),

  entries: (f) => get(`/activity${qs(f)}`),
  addEntry: (e) => post('/activity', e),
  updateEntry: (id, e, reason) => put(`/activity/${id}`, { ...e, reason }),
  deleteEntry: (id, reason) => del(`/activity/${id}`, { reason }),
  addBreak: (date, start, end) => post('/activity/breaks', { date, start, end }),
  correctEntry: (id, e, reason) => post(`/activity/${id}/correct`, { ...e, reason }),

  leave: (userId) => get(`/leave${qs({ userId })}`),
  fileLeave: (l) => post('/leave', l),
  cancelLeave: (id) => post(`/leave/${id}/cancel`),

  locks: () => get('/locks'),
  addLock: (l) => post('/locks', l),
  removeLock: (id) => del(`/locks/${id}`),
  unlockRequests: () => get('/locks/requests'),
  requestUnlock: (r) => post('/locks/requests', r),
  decideUnlock: (id, allow) => post(`/locks/requests/${id}/${allow ? 'allow' : 'decline'}`),
  isOpen: (userId, date) => get(`/locks/open${qs({ userId, date })}`),

  notifications: () => get('/notifications'),
  audit: () => get('/admin/audit'),
};
