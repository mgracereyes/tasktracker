// Manager / Admin "Organization overview" (FR-010) with the project drill-down modal (FR-034)
// and the filter results modal (FR-035).
import { useState } from 'react';
import { api } from '../../api/client';
import type { EntryRow, Leave, Lock, UnlockRequest } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { DateRange } from '../../components/DateRange';
import { HoverSelect } from '../../components/HoverSelect';
import { Icon } from '../../components/Icons';
import { Card, Empty, ErrorBox, Loading, Modal, PageHead, Progress } from '../../components/ui';
import { NOW, TODAY } from '../../config';
import { useLoad } from '../../hooks';
import { Link } from '../../router';
import { addDays, fmtDay, fmtRange, fmtShort, parse, weekStart, workdays } from '../../utils/dates';
import { download, toCsv } from '../../utils/csv';
import { hm, hours, ofPlanned } from '../../utils/format';
import { type Catalog, plannedOf, sumBy, total, useCatalog, workOnly } from '../shared';

/** Chart colours per project, in catalogue order: blue, teal, green, crimson, purple, then extras. */
const CHART_COLORS = ['#2B52C9', '#14897F', '#3B8C3F', '#C23B63', '#7B3FC4', '#D98A00', '#3A7CA5', '#6C7A89'];

/** Logged plus leave below 8h on a past or current workday. */
type ShortDay = { userId: number; date: string; logged: number };

export function OrgOverview() {
  const me = useMe();
  const [range, setRange] = useState({ from: addDays(TODAY, -30), to: TODAY });
  const [f, setF] = useState({ projectId: 0, taskId: 0, itemId: 0, userId: 0 });
  const [drill, setDrill] = useState<number | null>(null);
  const [results, setResults] = useState(false);
  const cat = useCatalog();
  const data = useLoad(async () => {
    const [rows, notes, requests, locks, leave] = await Promise.all([api.entries(range), api.notifications(), api.unlockRequests(), api.locks(), api.leave()]);
    // Hours logged on each pending request's day (the day may sit outside the chosen period).
    const pending = requests.filter((r) => r.status === 'pending');
    const reqRows = await Promise.all(pending.map((r) => api.entries({ from: r.date, to: r.date, userId: r.userId })));
    return { rows: workOnly(rows), notes, pending, reqLogged: pending.map((_, i) => total(workOnly(reqRows[i]))), locks, leave: leave.filter((l) => l.status === 'filed') };
  }, [range.from, range.to]);

  if (!cat.data || !data.data) return cat.error || data.error ? <ErrorBox msg={cat.error ?? data.error} /> : <Loading />;
  const c = cat.data;
  const d = data.data;
  const rows = d.rows;
  const anyFilter = f.projectId || f.taskId || f.itemId || f.userId;
  const apply = (from: string, to: string) => {
    setRange({ from, to });
    if (anyFilter) setResults(true);
  };
  const exportRows = (fmt: 'CSV' | 'XLSX') => {
    const table = [['Date', 'Employee', 'Project', 'Task', 'Item', 'Hours'], ...rows.map((r) => [r.date, name(c, r.userId), r.project, r.task, r.item, (r.minutes / 60).toFixed(2)])];
    // The backend builds the real XLSX (FR-013); mock mode downloads CSV for both buttons.
    download(`organization_${range.from}_${range.to}${fmt === 'XLSX' ? '_xlsx' : ''}.csv`, toCsv(table));
  };

  // People who log time (not admins or managers), grouped into teams by their team lead.
  const staff = c.users.filter((u) => u.active && u.role !== 'admin' && u.role !== 'manager');
  const leads = staff.filter((u) => u.role === 'team_lead');
  const teamMembers = (leadId: number) => staff.filter((u) => u.id === leadId || u.teamLeadId === leadId);
  const pastDays = workdays(range.from, range.to < TODAY ? range.to : TODAY);
  const short = shortDays(staff.map((u) => u.id), pastDays, rows, d.leave);
  const pendingFor = (uids: number[]) => d.pending.filter((r) => uids.includes(r.userId));

  const notices = buildNotices(c, d.pending, d.reqLogged, d.locks, short, range);
  const templateNotes = d.notes.filter((n) => n.type === 'template_approval');
  const noticeCount = notices.length + templateNotes.length;

  const byProject = sumBy(rows, (r) => r.projectId);
  const projects = c.projects.filter((p) => p.active);
  const lead = (id: number) => c.users.find((u) => u.id === id)?.name ?? '—';

  return (
    <>
      <PageHead
        title="Organization overview"
        sub={`${plural(leads.length, 'team')} · ${plural(staff.length, 'person', 'people')} · ${fmtRange(range.from, range.to, true)}`}
        actions={<>
          <DateRange from={range.from} to={range.to} onApply={apply} />
          <button className="btn ghost" onClick={() => exportRows('CSV')}>Export CSV</button>
          <button className="btn ghost" onClick={() => exportRows('XLSX')}>Export XLSX</button>
        </>}
      />
      <div className="col gap">
        <Card>
          <div className="fbar orgfilters">
            <HoverSelect label="Project" value={f.projectId} placeholder="All projects" active={!!f.projectId} options={[{ value: 0, label: 'All projects' }, ...c.projects.map((p) => ({ value: p.id, label: p.name, hint: p.visibility === 'private' ? 'Private' : p.description }))]} onChange={(v) => setF({ ...f, projectId: v, taskId: 0, itemId: 0 })} />
            <HoverSelect label="Task" value={f.taskId} placeholder="All tasks" active={!!f.taskId} options={[{ value: 0, label: 'All tasks' }, ...c.tasks.filter((t) => t.projectId === f.projectId).map((t) => ({ value: t.id, label: t.name }))]} onChange={(v) => setF({ ...f, taskId: v, itemId: 0 })} />
            <HoverSelect label="Item" value={f.itemId} placeholder="All items" active={!!f.itemId} options={[{ value: 0, label: 'All items' }, ...c.items.filter((i) => i.taskId === f.taskId).map((i) => ({ value: i.id, label: i.name }))]} onChange={(v) => setF({ ...f, itemId: v })} />
            <HoverSelect label="Member" value={f.userId} placeholder="All members" active={!!f.userId} options={[{ value: 0, label: 'All members' }, ...c.users.filter((u) => u.active && u.role !== 'admin' && u.id !== me.id).map((u) => ({ value: u.id, label: u.name }))]} onChange={(v) => setF({ ...f, userId: v })} />
            <button className="link clearf" disabled={!anyFilter} onClick={() => setF({ projectId: 0, taskId: 0, itemId: 0, userId: 0 })}>Clear filters</button>
          </div>
          {anyFilter ? <span className="small mut">Press Apply to see the filter results.</span> : null}
        </Card>

        <Card
          title={<span className="row">Notifications{noticeCount > 0 && <span className="count">{noticeCount}</span>}</span>}
          actions={<span className="small mut">Select a notification to verify it in Locks. Requests expire after 72 hours.</span>}
        >
          {noticeCount === 0 ? <Empty>Nothing waiting.</Empty> : (
            <ul className="notes orgnotes">
              {notices.map((n) => (
                <li key={n.key} className="locked_day">
                  <span className="ntext">{Icon.lock} {n.text} <span className="ndetail">{n.detail}</span></span>
                  <Link to="/locks" className="go">Review in Locks {Icon.right}</Link>
                </li>
              ))}
              {templateNotes.map((n) => (
                <li key={`t${n.id}`}>
                  <span className="ntext">{n.message}.</span>
                  <Link to={n.link} className="go">Review in Setup {Icon.right}</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid2">
          <Card title="By project" actions={<span className="small mut">{plural(projects.length, 'project')}{projects.length > 3 ? ' · scroll for more' : ''}</span>}>
            <div className="tbl orgtbl">
              <div className="tr th proj"><span>Project</span><span>Lead</span><span>People</span><span>Logged / planned</span><span className="num">Short days</span></div>
              {projects.map((p) => {
                const planned = plannedOf(c, (_it, t) => t.projectId === p.id);
                const done = byProject.get(p.id) ?? 0;
                const memberIds = c.members.filter((m) => m.projectId === p.id).map((m) => m.userId);
                const sd = short.filter((s) => memberIds.includes(s.userId)).length;
                return (
                  <div key={p.id} className="tr proj">
                    <button className="link strong" onClick={() => setDrill(p.id)}>{p.name}</button>
                    <span className="ell">{lead(p.leadId)}</span>
                    <span>{memberIds.length}</span>
                    <span className="lp"><Progress value={done} max={planned || done || 1} /><span>{ofPlanned(done, planned)}</span></span>
                    <span className="num"><span className={`count ${sd ? '' : 'zero'}`}>{sd}</span></span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="By team" actions={<span className="small mut">{plural(leads.length, 'team')} · {plural(staff.length, 'person', 'people')}{leads.length > 3 ? ' · scroll for more' : ''}</span>}>
            <div className="tbl orgtbl">
              <div className="tr th team"><span>Team</span><span>Lead</span><span>People</span><span>Logged / expected</span><span className="num">Short days</span><span className="num">Unlock req.</span></div>
              {leads.map((t) => {
                const ids = teamMembers(t.id).map((u) => u.id);
                const logged = total(rows.filter((r) => ids.includes(r.userId)));
                const expected = ids.length * pastDays.length * 480;
                const sd = short.filter((s) => ids.includes(s.userId)).length;
                const waiting = pendingFor(ids).length;
                const low = expected > 0 && logged / expected < 0.9;
                return (
                  <div key={t.id} className="tr team">
                    <b>{t.name.split(' ')[0]}'s team</b>
                    <span className="ell">{t.name}</span>
                    <span>{ids.length}</span>
                    <span className={`lp ${low ? 'low' : ''}`}><Progress value={logged} max={expected || logged || 1} /><span>{hours(logged)} / {hours(expected)}</span></span>
                    <span className="num"><span className={`count ${sd ? '' : 'zero'}`}>{sd}</span></span>
                    <span className="num">{waiting ? `${waiting} waiting` : 'None'}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <DayChart rows={rows} cat={c} from={range.from} to={range.to} people={staff.length} />
        {drill !== null && <DrillDown cat={c} rows={rows} projectId={drill} onClose={() => setDrill(null)} />}
        {results && <FilterResults cat={c} rows={rows} f={f} range={range} onClose={() => setResults(false)} />}
      </div>
    </>
  );
}

const name = (c: Catalog, uid: number) => c.users.find((u) => u.id === uid)?.name ?? `User ${uid}`;
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** Every (person, workday) in `days` where logged work plus leave is under 8 hours. */
function shortDays(userIds: number[], days: string[], rows: EntryRow[], leave: Leave[]): ShortDay[] {
  const out: ShortDay[] = [];
  for (const userId of userIds) {
    for (const date of days) {
      const logged = total(rows.filter((r) => r.userId === userId && r.date === date));
      const lv = leave.filter((l) => l.userId === userId && l.startDate <= date && l.endDate >= date).reduce((s, l) => s + (l.dayPart === 'half' ? 240 : 480), 0);
      if (logged + lv < 480) out.push({ userId, date, logged: logged + lv });
    }
  }
  return out;
}

/** Notices for the manager: each pending unlock request, then each locked week with short days nobody has asked about. */
function buildNotices(c: Catalog, pending: UnlockRequest[], reqLogged: number[], locks: Lock[], short: ShortDay[], range: { from: string; to: string }) {
  const nowMs = parse(TODAY).getTime() + (Number(NOW.slice(0, 2)) * 60 + Number(NOW.slice(3, 5))) * 60000;
  const who = (uid: number) => {
    const u = c.users.find((x) => x.id === uid);
    return `${u?.name ?? `User ${uid}`}${u?.role === 'team_lead' ? ' (Team lead)' : ''}`;
  };
  const out: { key: string; text: string; detail: string }[] = [];
  pending
    .map((r, i) => ({ r, logged: reqLogged[i] }))
    .sort((a, b) => a.r.expiresAt.localeCompare(b.r.expiresAt))
    .forEach(({ r, logged }) => {
      const gap = Math.max(0, 480 - logged);
      const ask = r.action === 'add' ? `Unlock request to add ${hm(gap || 60)}` : r.action === 'edit' ? 'Unlock request to edit time' : 'Unlock request to delete time';
      const left = Math.max(0, Math.ceil((new Date(r.expiresAt).getTime() - nowMs) / 86400000));
      out.push({
        key: `r${r.id}`,
        text: `${who(r.userId)} · ${fmtDay(r.date)} · Locked: ${hm(logged)} logged${gap ? `, ${hm(gap)} short` : ''}. ${ask}.`,
        detail: `Reason: "${r.reason}" · Sent ${fmtDay(r.createdAt.slice(0, 10))} · ${left === 0 ? 'expires today' : `${left} day${left === 1 ? '' : 's'} left`}`,
      });
    });
  const isLocked = (d: string) => locks.some((l) => l.startDate <= d && l.endDate >= d);
  const open = short.filter((s) => isLocked(s.date) && s.date >= range.from && !pending.some((r) => r.userId === s.userId && r.date === s.date));
  const weeks = [...new Set(open.map((s) => weekStart(s.date)))].sort();
  for (const w of weeks) {
    const inWeek = open.filter((s) => weekStart(s.date) === w);
    const people = [...new Set(inWeek.map((s) => name(c, s.userId)))];
    out.push({
      key: `w${w}`,
      text: `Week of ${fmtDay(w)} is locked · ${plural(inWeek.length, 'short day')} to verify (${people.slice(0, 3).join(', ')}${people.length > 3 ? ` and ${people.length - 3} more` : ''}).`,
      detail: 'No unlock requests yet. Check the hours before the week is closed.',
    });
  }
  return out;
}

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Stacked hours per workday by project: solid = task work, light = meetings; dashed line = expected hours. */
function DayChart({ rows, cat, from, to, people }: { rows: EntryRow[]; cat: Catalog; from: string; to: string; people: number }) {
  const days = workdays(from, to);
  const projects = cat.projects;
  const color = (j: number) => CHART_COLORS[j % CHART_COLORS.length];
  const expected = people * 480;
  const per = days.map((d) => projects.map((p) => {
    const r = rows.filter((x) => x.date === d && x.projectId === p.id);
    return { task: total(r.filter((x) => x.workType === 'task')), meeting: total(r.filter((x) => x.workType === 'meeting')) };
  }));
  const dayTotal = per.map((ps) => ps.reduce((s, p) => s + p.task + p.meeting, 0));
  const grand = dayTotal.reduce((s, v) => s + v, 0);
  const projTotal = projects.map((_, j) => per.reduce((s, ps) => s + ps[j].task + ps[j].meeting, 0));

  // Y axis: a "nice" step in whole hours, at most 5 gridlines, top at or above the expected line.
  const peakH = Math.max(expected, ...dayTotal) / 60;
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find((s) => peakH / s <= 4) ?? 1000;
  const topH = Math.max(step, Math.ceil(peakH / step) * step);
  const ticks = Array.from({ length: topH / step + 1 }, (_, i) => i * step);

  const bw = 56, padL = 48, padT = 22, plotH = 260, padB = 46;
  const W = padL + days.length * bw + 8, H = padT + plotH + padB;
  const y = (m: number) => padT + plotH - (m / 60 / topH) * plotH;

  return (
    <Card
      title={<span className="col0"><span>Hours per day by project</span><span className="hsub">{hours(grand)} over {plural(days.length, 'workday')} · solid = task work, light = meetings · dashed = {hours(expected)} a day expected</span></span>}
      actions={
        <div className="legend chartlegend">
          {projects.map((p, j) => <span key={p.id}><i style={{ background: color(j) }} />{p.name} {hours(projTotal[j])}</span>)}
          <span><i className="sw-task" />Task work</span>
          <span><i className="sw-meet" />Meetings</span>
        </div>
      }
    >
      {days.length === 0 ? <Empty>No workdays in this period.</Empty> : (
        <div className="chart orgchart">
          <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: Math.min(W, days.length * 40 + padL) }} role="img" aria-label={`Stacked hours per day by project, ${hours(grand)} in total`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padL} x2={W} y1={y(t * 60)} y2={y(t * 60)} className="grid" />
                <text x={padL - 8} y={y(t * 60) + 4} textAnchor="end" className="axis">{t}h</text>
              </g>
            ))}
            <line x1={padL} x2={W} y1={y(expected)} y2={y(expected)} className="expected" />
            {per.map((ps, i) => {
              let acc = 0;
              const x = padL + i * bw + bw * 0.18;
              const w = bw * 0.64;
              const date = parse(days[i]);
              const newMonth = i === 0 || date.getUTCDate() === 1 || days[i].slice(5, 7) !== days[i - 1].slice(5, 7);
              return (
                <g key={days[i]}>
                  {ps.flatMap((p, j) => [
                    { m: p.task, op: 1, kind: 'task work' },
                    { m: p.meeting, op: 0.42, kind: 'meetings' },
                  ].map((part, k) => {
                    const y0 = y(acc), y1 = y(acc + part.m);
                    acc += part.m;
                    return part.m > 0 ? (
                      <rect key={`${j}${k}`} x={x} width={w} y={y1} height={Math.max(0, y0 - y1)} fill={color(j)} opacity={part.op}>
                        <title>{`${fmtDay(days[i])} · ${projects[j].name} ${part.kind}: ${hours(part.m)}`}</title>
                      </rect>
                    ) : null;
                  }))}
                  {dayTotal[i] > 0 && <text x={x + w / 2} y={y(dayTotal[i]) - 6} textAnchor="middle" className="barval">{Math.round(dayTotal[i] / 60)}</text>}
                  <text x={x + w / 2} y={padT + plotH + 18} textAnchor="middle" className="xday">{date.getUTCDate()}</text>
                  <text x={x + w / 2} y={padT + plotH + 34} textAnchor="middle" className="axis">{newMonth ? MONTH[date.getUTCMonth()] : WEEKDAY[date.getUTCDay()]}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </Card>
  );
}

function DrillDown({ cat, rows, projectId, onClose }: { cat: Catalog; rows: EntryRow[]; projectId: number; onClose: () => void }) {
  const [view, setView] = useState<'items' | 'members'>('items');
  const p = cat.projects.find((x) => x.id === projectId)!;
  const pr = rows.filter((r) => r.projectId === projectId);
  const byItem = sumBy(pr, (r) => `${r.task}|${r.item}`);
  const tasks = cat.tasks.filter((t) => t.projectId === projectId);
  const byMember = sumBy(pr, (r) => r.userId);
  const planned = plannedOf(cat, (_i, t) => t.projectId === projectId);
  return (
    <Modal title={`${p.name} · ${ofPlanned(total(pr), planned)}`} onClose={onClose} wide footer={<><Link to={`/reports?projectId=${projectId}`} className="btn ghost">Open in Reports</Link><button className="btn" onClick={onClose}>Close</button></>}>
      <div className="row">
        <button className={`chip ${view === 'items' ? 'on' : ''}`} onClick={() => setView('items')}>Tasks and items</button>
        <button className={`chip ${view === 'members' ? 'on' : ''}`} onClick={() => setView('members')}>Members</button>
      </div>
      {view === 'items' ? (
        tasks.map((t) => {
          const its = cat.items.filter((i) => i.taskId === t.id && i.active);
          const tDone = its.reduce((s, i) => s + (byItem.get(`${t.name}|${i.name}`) ?? 0), 0);
          const tPlan = its.reduce((s, i) => s + i.plannedMinutes, 0);
          return (
            <div key={t.id} className="drill">
              <div className="row between"><b>{t.name}</b><span>{ofPlanned(tDone, tPlan)}</span></div>
              {its.map((i) => {
                const d = byItem.get(`${t.name}|${i.name}`) ?? 0;
                return (
                  <div key={i.id} className="barrow">
                    <span>{i.name}</span>
                    <Progress value={d} max={i.plannedMinutes || d || 1} kind={i.workType} />
                    <span>{ofPlanned(d, i.plannedMinutes)}</span>
                  </div>
                );
              })}
            </div>
          );
        })
      ) : (
        <div className="drill">
          {[...byMember.entries()].sort((a, b) => b[1] - a[1]).map(([uid, m]) => {
            const mine = pr.filter((r) => r.userId === uid);
            const its = sumBy(mine, (r) => `${r.task} / ${r.item}`);
            return (
              <div key={uid} className="member">
                <div className="row between"><b>{name(cat, uid)}</b><span>{hours(m)}</span></div>
                {[...its.entries()].map(([k, v]) => (
                  <div key={k} className="barrow">
                    <span>{k}</span>
                    <Progress value={v} max={m} kind={mine.find((r) => `${r.task} / ${r.item}` === k)?.workType} />
                    <span>{hours(v)}</span>
                  </div>
                ))}
              </div>
            );
          })}
          {byMember.size === 0 && <Empty>No time logged on this project in the period.</Empty>}
        </div>
      )}
    </Modal>
  );
}

function FilterResults({ cat, rows, f, range, onClose }: { cat: Catalog; rows: EntryRow[]; f: { projectId: number; taskId: number; itemId: number; userId: number }; range: { from: string; to: string }; onClose: () => void }) {
  const r = rows.filter((x) => (!f.projectId || x.projectId === f.projectId) && (!f.taskId || cat.items.find((i) => i.id === x.itemId)?.taskId === f.taskId) && (!f.itemId || x.itemId === f.itemId) && (!f.userId || x.userId === f.userId));
  const planned = plannedOf(cat, (it, t) => (!f.projectId || t.projectId === f.projectId) && (!f.taskId || t.id === f.taskId) && (!f.itemId || it.id === f.itemId));
  const chips = [
    f.projectId && cat.projects.find((p) => p.id === f.projectId)?.name,
    f.taskId && cat.tasks.find((t) => t.id === f.taskId)?.name,
    f.itemId && cat.items.find((i) => i.id === f.itemId)?.name,
    f.userId && name(cat, f.userId),
    `${fmtShort(range.from)} – ${fmtShort(range.to)}`,
  ].filter(Boolean) as string[];
  const byItem = sumBy(r, (x) => x.itemId ?? 0);
  const byMember = sumBy(r, (x) => x.userId);
  const byWeek = sumBy(r, (x) => weekStart(x.date));
  const exportCsv = () => download('filter_results.csv', toCsv([['Date', 'Employee', 'Project', 'Task', 'Item', 'Hours'], ...r.map((x) => [x.date, name(cat, x.userId), x.project, x.task, x.item, (x.minutes / 60).toFixed(2)])]));
  return (
    <Modal title="Filter results" onClose={onClose} wide footer={<><button className="btn ghost" onClick={exportCsv}>Export CSV</button><button className="btn ghost" onClick={onClose}>Change filters</button><button className="btn" onClick={onClose}>Close</button></>}>
      <div className="row wrap">{chips.map((c) => <span key={c} className="chip on">{c}</span>)}</div>
      <div className="tiles">
        <div className="tile"><span>Logged</span><b>{hours(total(r))}</b><small>{planned ? `of ${hours(planned)} planned` : 'No plan set'}</small></div>
        <div className="tile"><span>Entries</span><b>{r.length}</b><small>{byMember.size} people</small></div>
      </div>
      {r.length === 0 ? <Empty>No time matches these filters.</Empty> : (
        <div className="grid3">
          <div><h3>By item</h3>{[...byItem.entries()].map(([id, m]) => {
            const it = cat.items.find((i) => i.id === id)!;
            return <div key={id} className="barrow"><span>{it.name}</span><Progress value={m} max={it.plannedMinutes || m} kind={it.workType} /><span>{ofPlanned(m, it.plannedMinutes)}</span></div>;
          })}</div>
          <div><h3>By member</h3>{[...byMember.entries()].map(([uid, m]) => <div key={uid} className="barrow"><span>{name(cat, uid)}</span><Progress value={m} max={total(r)} /><span>{hours(m)}</span></div>)}</div>
          <div><h3>By week</h3>{[...byWeek.entries()].sort().map(([w, m]) => <div key={w} className="barrow"><span>Week of {fmtShort(w)}</span><Progress value={m} max={total(r)} /><span>{hours(m)}</span></div>)}</div>
        </div>
      )}
    </Modal>
  );
}
