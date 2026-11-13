// Number formatting used everywhere, so hours always look the same.

/** 450 -> '7.5h', 480 -> '8h' */
export function hours(minutes: number): string {
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h.toLocaleString('en-US')}h`;
}

/** 405 -> '6h 45m', 480 -> '8h', 45 -> '45m' */
export function hm(minutes: number): string {
  const m = Math.round(minutes);
  if (m === 0) return '0h';
  if (m < 60) return `${m}m`;
  return m % 60 === 0 ? `${m / 60}h` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** '150h / 180h' */
export function ofPlanned(minutes: number, planned: number): string {
  return `${hours(minutes).slice(0, -1)}h / ${hours(planned)}`;
}

/** Effort between two HH:MM times, in minutes (end must be after start). */
export function effortMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) throw new Error('End time must be after start time');
  return diff;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
