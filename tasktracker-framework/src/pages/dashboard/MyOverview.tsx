// Tiled personal dashboard (FR-008, FR-021, FR-023). Used by Employees and by the Team lead Overview tab
// (`lead` adds "My projects" and the "My …" titles). The period comes from the page header.
import { useRef } from 'react';
import { api } from '../../api/client';
import type { Notification } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { Icon } from '../../components/Icons';
import { Card, Empty, ErrorBox, Loading, Progress } from '../../components/ui';
import { TODAY } from '../../config';
import { useLoad } from '../../hooks';
import { Link } from '../../router';
import { daysBetween, fmtDay, fmtRange, isWeekend } from '../../utils/dates';
import { hours } from '../../utils/format';
import { expectedMinutes, sumBy, total, useCatalog, workOnly } from '../shared';

/** Bar colours per project, in order of hours (tasks use a lighter tint of their project's colour). */
const COLOURS = ['var(--primary)', 'var(--purple)', 'var(--teal)', 'var(--meeting)'];

const NOTE_ACTION: Record<Notification['type'], string> = {
  under_8h: 'Open day to edit',
  locked_day: 'Request unlock',
  unlock_pending: 'View unlock request',
  unlock_decision: 'View unlock request',
  lock_verification: 'Review in Locks',
  template_approval: 'Review in Setup',
};

function noteText(n: Notification) {
  const day = `${fmtDay(n.date)}${n.date === TODAY ? ' (today)' : ''}`;
  if (n.type === 'under_8h') return `${day}: ${n.message} of the 8-hour target.`;
  if (n.type === 'locked_day') return `${day} · Locked: ${n.message} of the 8-hour target.`;
  if (n.type === 'unlock_pending') return `${day} · Locked: ${n.message}.`;
  return `${day} · ${n.message}.`;
}

export function MyOverview({ range, lead = false }: { range: { from: string; to: string }; lead?: boolean }) {
  const me = useMe();
  const strip = useRef<HTMLDivElement>(null);
  const cat = useCatalog();
  const { data, error, loading } = useLoad(async () => {
    const [rows, leave, notes, locks] = await Promise.all([
      api.entries({ ...range, userId: me.id }),
      api.leave(me.id),
      api.notifications(),
      api.locks(),
    ]);
    return { rows: workOnly(rows), leave: leave.filter((l) => l.status === 'filed'), notes, locks };
  }, [range.from, range.to, me.id]);

  const scroll = (dir: number) => strip.current?.scrollBy({ left: dir * 640, behavior: 'smooth' });
  if (error) return <ErrorBox msg={error} />;
  if (loading || !data || (lead && !cat.data)) return <Loading />;

  const days = daysBetween(range.from, range.to).filter((d) => !isWeekend(d));
  const leaveOn = (d: string) => data.leave.filter((l) => l.startDate <= d && l.endDate >= d && !isWeekend(d));
  const leaveMinOn = (d: string) => leaveOn(d).reduce((a, l) => a + (l.dayPart === 'half' ? 240 : 480), 0);
  const periodLeave = days.flatMap(leaveOn);
  const leaveMin = days.reduce((s, d) => s + leaveMinOn(d), 0);
  const wholeLeave = periodLeave.filter((l) => l.dayPart !== 'half').length;
  const halfLeave = periodLeave.length - wholeLeave;
  const logged = total(data.rows) + leaveMin;
  const toDate = expectedMinutes(range.from, range.to);
  const periodExpected = days.length * 480;
  const byDay = sumBy(data.rows, (r) => r.date);
  const shortDays = days.filter((d) => d < TODAY && (byDay.get(d) ?? 0) + leaveMinOn(d) < 480);
  const locked = (d: string) => data.locks.some((l) => l.startDate <= d && l.endDate >= d);

  // Hours by project, then by task (task bars take their project's colour).
  const byProject = [...sumBy(data.rows, (r) => r.project).entries()].sort((a, b) => b[1] - a[1]);
  const colourOf = (project: string) => COLOURS[Math.max(0, byProject.findIndex(([p]) => p === project)) % COLOURS.length];
  const taskProject = new Map(data.rows.map((r) => [r.task, r.project]));
  const byTask = [...sumBy(data.rows, (r) => r.task).entries()].sort((a, b) => b[1] - a[1]);
  const maxBar = Math.max(1, ...byProject.map(([, v]) => v), ...byTask.map(([, v]) => v));

  // My projects (team lead): projects I belong to, with my hours in the period.
  const c = cat.data;
  const myProjects = c
    ? c.projects
        .filter((p) => p.active && c.members.some((m) => m.projectId === p.id && m.userId === me.id))
        .map((p) => ({
          p,
          members: c.members.filter((m) => m.projectId === p.id).length,
          mine: data.rows.filter((r) => r.projectId === p.id).reduce((s, r) => s + r.minutes, 0),
          owner: p.leadId === me.id,
        }))
        .sort((a, b) => Number(b.owner) - Number(a.owner) || b.mine - a.mine)
    : [];

  // Newest first (today on top), personal notices only.
  const notes = data.notes
    .filter((n) => n.type === 'under_8h' || n.type === 'locked_day' || n.type === 'unlock_pending' || n.type === 'unlock_decision')
    .sort((a, b) => b.date.localeCompare(a.date));
  const status = shortDays.length ? `${shortDays.length} short day${shortDays.length === 1 ? '' : 's'}` : 'all days complete';

  return (
    <div className="col gap">
      <div className="tiles">
        <div className="tile top-blue"><span>Logged so far</span><b>{hours(logged)}</b><small>of {hours(toDate)} expected to date</small></div>
        <div className="tile top-gray"><span>Expected this period</span><b>{hours(periodExpected)}</b><small>{days.length} workday{days.length === 1 ? '' : 's'} × 8h</small></div>
        <div className={`tile top-amber ${shortDays.length ? 'warn' : ''}`}>
          <span>Short days</span><b>{shortDays.length}</b>
          <small>{shortDays.length ? shortDays.map((d) => `${fmtDay(d)} · ${hours(480 - (byDay.get(d) ?? 0) - leaveMinOn(d))} short`).join(', ') : 'All days complete'}</small>
        </div>
        <div className="tile top-faint">
          <span>Leave</span><b>{hours(leaveMin)}</b>
          <small>{periodLeave.length === 0 ? 'No leave this period' : [wholeLeave && `${wholeLeave} whole`, halfLeave && `${halfLeave} half day${halfLeave === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</small>
        </div>
      </div>

      <div className={lead ? 'grid3' : 'grid2'}>
        <Card title={<span className="row">{lead ? 'My notifications' : 'Notifications'}{notes.length > 0 && <span className="count">{notes.length}</span>}</span>}>
          {notes.length === 0 ? <Empty>Nothing needs your attention.</Empty> : (
            <ul className="notes">
              {notes.slice(0, 5).map((n) => (
                <li key={n.id} className={n.type}>
                  <span className="ntext">{(n.type === 'locked_day' || n.type === 'unlock_pending') && <>{Icon.lock} </>}{noteText(n)}</span>
                  <Link to={n.link} className="go">{NOTE_ACTION[n.type]} {Icon.right}</Link>
                </li>
              ))}
            </ul>
          )}
          <p className="small mut">Select a short day to fix it. Locked days open an unlock request.</p>
        </Card>

        {lead && (
          <Card title="My projects">
            {myProjects.length === 0 ? <Empty>You are not on any project yet.</Empty> : (
              <div className="tbl">
                {myProjects.map(({ p, members, mine, owner }) => (
                  <div key={p.id} className="tr projrow">
                    <span className="col0"><b>{p.name}</b><span className="mut">{p.description}{owner && ` · ${members} member${members === 1 ? '' : 's'}`}</span></span>
                    <span className={`pill ${owner ? 'blue' : ''}`}>{owner ? `Owner · ${hours(mine)}` : hours(mine)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <Card title={lead ? 'My hours by project' : 'Hours by project'}>
          {byProject.length === 0 ? <Empty>No time logged in this period.</Empty> : (
            <div className="bars compact">
              {byProject.map(([k, v]) => (
                <div key={k} className="barrow">
                  <span title={k}>{k}</span>
                  <div className="pb"><div className="pf" style={{ width: `${(v / maxBar) * 100}%`, background: colourOf(k) }} /></div>
                  <b>{hours(v)}</b>
                </div>
              ))}
              <span className="cap">By task</span>
              {byTask.map(([k, v]) => (
                <div key={k} className="barrow">
                  <span>{k}</span>
                  <div className="pb"><div className="pf tint" style={{ width: `${(v / maxBar) * 100}%`, background: colourOf(taskProject.get(k) ?? '') }} /></div>
                  <b>{hours(v)}</b>
                </div>
              ))}
            </div>
          )}
          <p className="small mut">{fmtRange(range.from, range.to)}.</p>
        </Card>
      </div>

      <Card
        title={<span className="col0"><span>{fmtRange(range.from, range.to)}</span><span className="hsub">{days.length} workday{days.length === 1 ? '' : 's'}{lead ? ' · my own effort' : days.length > 5 ? ' · scroll or use the arrows to see more days' : ''}</span></span>}
        actions={
          <span className="row">
            <span><b>{hours(logged)}</b> <span className="mut">of {hours(periodExpected)} expected · {status}</span></span>
            {days.length > 5 && (
              <>
                <button className="iconbtn" aria-label="Previous days" onClick={() => scroll(-1)}>{Icon.left}</button>
                <button className="iconbtn" aria-label="Next days" onClick={() => scroll(1)}>{Icon.right}</button>
              </>
            )}
          </span>
        }
      >
        <div className="strip" ref={strip}>
          {days.map((d) => {
            const dayRows = data.rows.filter((r) => r.date === d);
            const lv = leaveOn(d);
            const m = byDay.get(d) ?? 0;
            const lvMin = leaveMinOn(d);
            const short = d < TODAY && m + lvMin < 480;
            const parts = [...sumBy(dayRows, (r) => `${r.project}\u0000${r.task} › ${r.item}`).entries()];
            const today = d === TODAY;
            return (
              <Link key={d} to={`/activity?date=${d}`} className={`day ${lvMin >= 480 ? 'leave' : ''} ${short ? 'short' : ''} ${today ? 'today' : ''}`}>
                <div className="row between">
                  <span className="dd">{fmtDay(d)}{today && ' · Today'}</span>
                  {locked(d) && <span className="pill">Locked</span>}
                </div>
                <span className="dh">{d > TODAY && m + lvMin === 0 ? '—' : hours(m + lvMin)}</span>
                <Progress value={m} leave={lvMin} max={480} />
                {lv.map((l) => <span key={l.id} className="lv">{l.type} · {l.dayPart === 'half' ? 'half day' : 'whole day'}</span>)}
                {parts.length > 0 && <span className="cap">Project / task / item</span>}
                {parts.map(([k, v]) => {
                  const [project, path] = k.split('\u0000');
                  return (
                    <span key={k} className="dp">
                      <span className="col0"><b>{project}</b><span className="ell">{path}</span></span>
                      <b>{hours(v)}</b>
                    </span>
                  );
                })}
                {parts.length === 0 && lvMin === 0 && <span className="mut small">{d > TODAY ? 'Upcoming' : 'No time logged'}</span>}
                {today && <span className="open">Open day {Icon.right}</span>}
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
