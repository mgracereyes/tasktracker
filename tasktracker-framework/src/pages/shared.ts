// Helpers shared by the dashboard and report pages. Totals shown on screen come from
// API rows; these helpers only group them.
import { useLoad } from '../hooks';
import { api } from '../api/client';
import type { EntryRow, Item, Member, Project, Task, User } from '../api/types';
import { addDays, weekStart, workdays } from '../utils/dates';
import { TODAY } from '../config';

export interface Catalog {
  users: User[];
  projects: Project[];
  tasks: Task[];
  items: Item[];
  members: Member[];
}

export function useCatalog() {
  return useLoad<Catalog>(async () => {
    const [users, projects, tasks, items, members] = await Promise.all([api.users(), api.projects(), api.tasks(), api.items(), api.members()]);
    return { users, projects, tasks, items, members };
  });
}

export const workOnly = (rows: EntryRow[]) => rows.filter((r) => r.type === 'work');

export function sumBy<K extends string | number>(rows: EntryRow[], key: (r: EntryRow) => K): Map<K, number> {
  const m = new Map<K, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + r.minutes);
  return m;
}

export function total(rows: EntryRow[]): number {
  return rows.reduce((s, r) => s + r.minutes, 0);
}

/** Default dashboard period: the current week, Monday to Friday (FR-021). */
export function currentWeek(): { from: string; to: string } {
  const mon = weekStart(TODAY);
  return { from: mon, to: addDays(mon, 4) };
}

/** Expected minutes from the start of the period up to today (8 h per weekday). */
export function expectedMinutes(from: string, to: string): number {
  const end = to < TODAY ? to : TODAY;
  return end < from ? 0 : workdays(from, end).length * 480;
}

export const plannedOf = (cat: Catalog, filter: (it: Item, t: Task) => boolean) =>
  cat.items.filter((it) => filter(it, cat.tasks.find((t) => t.id === it.taskId)!)).reduce((s, it) => s + it.plannedMinutes, 0);
