// Date helpers. Dates are plain 'YYYY-MM-DD' strings so they never shift with time zones.

export function parse(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: string, n: number): string {
  const x = parse(d);
  x.setUTCDate(x.getUTCDate() + n);
  return iso(x);
}

export function isWeekend(d: string): boolean {
  const w = parse(d).getUTCDay();
  return w === 0 || w === 6;
}

export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function workdays(from: string, to: string): string[] {
  return daysBetween(from, to).filter((d) => !isWeekend(d));
}

/** Monday of the week that contains d. */
export function weekStart(d: string): string {
  const w = parse(d).getUTCDay();
  return addDays(d, w === 0 ? -6 : 1 - w);
}

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'Mon 21 Sep' */
export function fmtDay(d: string): string {
  const x = parse(d);
  return `${DAY[x.getUTCDay()]} ${x.getUTCDate()} ${MON[x.getUTCMonth()]}`;
}

/** 'Mon 21 to Fri 25 Sep' (same month) or 'Mon 28 Sep to Mon 26 Oct'; `year` appends ' 2026'. */
export function fmtRange(from: string, to: string, year = false): string {
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const start = sameMonth ? fmtDay(from).split(' ').slice(0, 2).join(' ') : fmtDay(from);
  return `${start} to ${fmtDay(to)}${year ? ` ${to.slice(0, 4)}` : ''}`;
}

/** '21 Sep' */
export function fmtShort(d: string): string {
  const x = parse(d);
  return `${x.getUTCDate()} ${MON[x.getUTCMonth()]}`;
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
