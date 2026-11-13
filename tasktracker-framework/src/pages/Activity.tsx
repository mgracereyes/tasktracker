// Activity (FR-018 to FR-020, FR-022, FR-025, FR-026): timer, timeline, edits, locked days,
// unlock requests. Admin gets two tabs: My time and Correct an entry (FR-019).
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { EntryRow, UnlockRequest } from '../api/types';
import { useMe } from '../auth/AuthContext';
import { HoverSelect } from '../components/HoverSelect';
import { Icon } from '../components/Icons';
import { Card, Empty, ErrorBox, Field, Loading, Modal, PageHead, Pill, Tabs } from '../components/ui';
import { TODAY } from '../config';
import { useAction, useLoad } from '../hooks';
import { useRouter } from '../router';
import { addDays, fmtDay, isWeekend, parse } from '../utils/dates';
import { effortMinutes, hours } from '../utils/format';
import { useCatalog } from './shared';

const clock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Minutes between two HH:MM times, 0 when the end is not after the start. */
const span = (start: string, end: string) => {
  try {
    return Math.max(0, effortMinutes(start, end));
  } catch {
    return 0;
  }
};

/** '2h', '15m', '1h 30m' */
const dur = (m: number) => (m < 60 ? `${m}m` : m % 60 === 0 ? `${m / 60}h` : `${Math.floor(m / 60)}h ${m % 60}m`);

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** 'Tuesday 29 September' */
const fmtLong = (d: string) => {
  const x = parse(d);
  return `${WEEKDAY[x.getUTCDay()]} ${x.getUTCDate()} ${MONTH[x.getUTCMonth()]}`;
};
/** 'Tue 29' */
const fmtChip = (d: string) => fmtDay(d).split(' ').slice(0, 2).join(' ');

/** The n weekdays ending on `end` (inclusive), oldest first. */
const lastWorkdays = (end: string, n: number) => {
  const out: string[] = [];
  for (let d = end; out.length < n; d = addDays(d, -1)) if (!isWeekend(d)) out.unshift(d);
  return out;
};

/** Colours for projects (day blocks) and categories (bars), in order of first appearance. */
const PALETTE = [
  { css: 'var(--primary)', name: 'Blue' },
  { css: 'var(--teal)', name: 'Teal' },
  { css: 'var(--purple)', name: 'Purple' },
  { css: 'var(--meeting)', name: 'Orange' },
];
const colourOf = (keys: string[], key: string) => PALETTE[keys.indexOf(key) % PALETTE.length];

const UNLOCK_STATUS: Record<UnlockRequest['status'], { label: string; tone: 'grey' | 'ok' | 'bad' }> = {
  pending: { label: 'Waiting for a manager', tone: 'grey' },
  allowed: { label: 'Allowed', tone: 'ok' },
  declined: { label: 'Declined', tone: 'bad' },
  expired: { label: 'Expired', tone: 'grey' },
};

export function Activity() {
  const me = useMe();
  const [tab, setTab] = useState<'mine' | 'correct'>('mine');
  return (
    <>
      <PageHead title="Activity" sub="Pick a task to start the clock. Only projects assigned to you appear in the list. Aim for 8 hours each weekday." />
      {me.role === 'admin' && <Tabs tabs={[{ id: 'mine', label: 'My time' }, { id: 'correct', label: 'Correct an entry' }]} value={tab} onChange={setTab} />}
      {tab === 'mine' ? <MyTime /> : <CorrectEntry />}
    </>
  );
}

type Running = { itemId: number; start: string; remarks: string; breakFrom?: string };

function MyTime() {
  const me = useMe();
  const { query } = useRouter();
  const [date, setDate] = useState(query.get('date') ?? TODAY);
  const [remarks, setRemarks] = useState('');
  const [running, setRunning] = useState<Running | null>(null);
  const [manual, setManual] = useState({ itemId: 0, start: '09:00', end: '10:00', remarks: '' });
  const [editing, setEditing] = useState<{ id: number; start: string; end: string; remarks: string } | null>(null);
  const [unlock, setUnlock] = useState(false);
  const [now, setNow] = useState(clock());
  const act = useAction();
  const cat = useCatalog();

  // Day chips: the last 7 weekdays up to today, or up to the chosen day when it is older.
  const chips = lastWorkdays(TODAY, 7).includes(date) || date > TODAY ? lastWorkdays(TODAY, 7) : lastWorkdays(date, 7);
  const from = chips[0] < date ? chips[0] : date;
  const to = chips[chips.length - 1] > date ? chips[chips.length - 1] : date;
  const data = useLoad(async () => {
    const [rows, open, locks, leave, requests] = await Promise.all([
      api.entries({ from, to, userId: me.id }),
      api.isOpen(me.id, date),
      api.locks(),
      api.leave(me.id),
      api.unlockRequests(),
    ]);
    return { rows, open, locks, leave: leave.filter((l) => l.status === 'filed'), requests: requests.filter((r) => r.userId === me.id) };
  }, [from, to, date, me.id]);

  useEffect(() => {
    const q = query.get('date');
    if (q) setDate(q);
  }, [query]);

  // Keep the running row's duration current.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(clock()), 15000);
    return () => clearInterval(t);
  }, [running]);

  if (cat.loading || !cat.data || !data.data) return data.error ? <ErrorBox msg={data.error} /> : <Loading />;
  const c = cat.data;
  const d = data.data;

  const myProjects = c.projects.filter((p) => p.active && c.members.some((m) => m.userId === me.id && m.projectId === p.id));
  const itemPath = (itemId: number) => {
    const it = c.items.find((i) => i.id === itemId);
    const t = it && c.tasks.find((x) => x.id === it.taskId);
    const p = t && c.projects.find((x) => x.id === t.projectId);
    return { project: p?.name ?? '', task: t?.name ?? '', item: it?.name ?? '' };
  };
  const taskOptions = myProjects.map((p) => ({
    project: p,
    items: c.tasks
      .filter((t) => t.projectId === p.id && t.active)
      .flatMap((t) => c.items.filter((i) => i.taskId === t.id && i.active).map((i) => ({ id: i.id, label: `${t.name} / ${i.name}` }))),
  })).filter((g) => g.items.length > 0);
  const taskSelect = (value: number, onChange: (id: number) => void, placeholder: string, label: string) => (
    <select className="tasksel" aria-label={label} value={value || ''} onChange={(e) => onChange(Number(e.target.value))}>
      <option value="" disabled>{placeholder}</option>
      {taskOptions.map((g) => (
        <optgroup key={g.project.id} label={g.project.name}>
          {g.items.map((i) => <option key={i.id} value={i.id}>{g.project.name} / {i.label}</option>)}
        </optgroup>
      ))}
    </select>
  );

  const isLocked = (day: string) => d.locks.some((l) => l.startDate <= day && l.endDate >= day);
  const leaveMin = (day: string) => d.leave.filter((l) => l.startDate <= day && l.endDate >= day).reduce((s, l) => s + (l.dayPart === 'half' ? 240 : 480), 0);
  const workOn = (day: string) => d.rows.filter((r) => r.date === day && r.type === 'work').reduce((s, r) => s + r.minutes, 0);

  // The selected day, including the task that is running right now.
  const isToday = date === TODAY;
  const live = isToday && running ? span(running.breakFrom ?? running.start, now) : 0;
  const liveWork = running && !running.breakFrom ? live : 0;
  const rows = d.rows.filter((r) => r.date === date).sort((a, b) => a.start.localeCompare(b.start));
  const work = rows.filter((r) => r.type === 'work');
  const breakMin = rows.filter((r) => r.type === 'break').reduce((s, r) => s + r.minutes, 0) + (running?.breakFrom ? live : 0);
  const workMin = work.reduce((s, r) => s + r.minutes, 0) + liveWork;
  const dayLeave = leaveMin(date);
  const logged = workMin + dayLeave;
  const locked = isLocked(date);
  const writable = d.open && date <= TODAY;
  const short = !isWeekend(date) && date <= TODAY && logged < 480;
  const runningPath = running ? itemPath(running.itemId) : null;

  // Day blocks: 30-minute blocks in time order, coloured by project; leave fills after work.
  const segments = [
    ...work.map((r) => ({ project: r.project, minutes: r.minutes })),
    ...(liveWork && runningPath ? [{ project: runningPath.project, minutes: liveWork }] : []),
  ];
  const projects = [...new Set(segments.map((s) => s.project))];
  const blockCount = Math.max(16, Math.ceil(logged / 30));
  const blockFill = (i: number) => {
    let at = i * 30 + 15;
    for (const s of segments) {
      if (at < s.minutes) return colourOf(projects, s.project).css;
      at -= s.minutes;
    }
    return at < dayLeave ? 'var(--faint)' : undefined;
  };

  // By category = task name.
  const byTask = new Map<string, number>();
  for (const r of work) byTask.set(r.task, (byTask.get(r.task) ?? 0) + r.minutes);
  if (liveWork && runningPath) byTask.set(runningPath.task, (byTask.get(runningPath.task) ?? 0) + liveWork);
  const tasksSorted = [...byTask.entries()].sort((a, b) => b[1] - a[1]);
  const taskKeys = tasksSorted.map(([k]) => k);
  const maxTask = Math.max(1, ...byTask.values());

  // Timer: picking a task ends the previous one (or the break) and starts the new one now.
  const saveRunning = async (r: Running, end: string) => {
    if (r.breakFrom) {
      if (span(r.breakFrom, end) > 0) await api.addBreak(date, r.breakFrom, end);
    } else if (span(r.start, end) > 0) {
      await api.addEntry({ itemId: r.itemId, date, start: r.start, end, remarks: r.remarks });
    }
  };
  const pick = (itemId: number) => {
    const t = clock();
    const prev = running;
    act.run(async () => { if (prev) await saveRunning(prev, t); }, () => {
      setRunning({ itemId, start: t, remarks: remarks.trim() });
      setRemarks('');
      setNow(t);
      if (prev) data.reload();
    });
  };
  const toggleBreak = () => {
    if (!running) return;
    const t = clock();
    const prev = running;
    act.run(() => saveRunning(prev, t), () => {
      setRunning(prev.breakFrom ? { itemId: prev.itemId, start: t, remarks: '' } : { ...prev, breakFrom: t });
      setNow(t);
      data.reload();
    });
  };
  const end = () => {
    if (!running) return;
    const prev = running;
    act.run(() => saveRunning(prev, clock()), () => { setRunning(null); data.reload(); });
  };
  const addManual = () => {
    if (!manual.itemId) return act.setError('Pick a task first.');
    act.run(() => api.addEntry({ itemId: manual.itemId, date, start: manual.start, end: manual.end, remarks: manual.remarks }), () => {
      setManual({ ...manual, remarks: '' });
      data.reload();
    });
  };

  return (
    <div className="col gap">
      <div className="daychips" role="tablist" aria-label="Day">
        {chips.map((day) => {
          const m = workOn(day) + leaveMin(day) + (day === TODAY ? liveWork : 0);
          const dayShort = day <= TODAY && m < 480;
          const lk = isLocked(day);
          return (
            <button
              key={day}
              role="tab"
              aria-selected={day === date}
              className={`dchip ${day === date ? 'on' : ''}`}
              onClick={() => { setDate(day); setEditing(null); }}
            >
              <b>{fmtChip(day)}{day === TODAY && ' · Today'}</b>
              <span className={lk || (dayShort && day === TODAY) ? 'warnt' : ''}>{day > TODAY ? '—' : dur(m)}{lk && ' · Locked'}</span>
            </button>
          );
        })}
      </div>

      {short && (
        <p className="shortbox" role="status">
          {isToday ? 'Today' : fmtDay(date)}: {dur(logged)} logged, {dur(480 - logged)} short of the 8-hour target.
        </p>
      )}
      {locked && (
        <div className="row wrap between lockbar">
          <span className="row">{Icon.lock} {d.open ? `${fmtDay(date)} is locked, but unlocked for you for 72 hours.` : `${fmtDay(date)} is locked.`}</span>
          {!d.open && <button className="btn ghost sm" onClick={() => setUnlock(true)}>Request unlock</button>}
        </div>
      )}

      <Card title={fmtLong(date)} actions={<b className={short ? 'warnt' : ''}>{dur(logged)} of 8h</b>}>
        <div className="blocks" role="img" aria-label={`${dur(logged)} of 8 hours logged`}>
          {Array.from({ length: blockCount }, (_, i) => (
            <span key={i} className={i === 15 ? 'mark' : ''} style={{ background: blockFill(i) }} />
          ))}
        </div>
        <p className="small mut">
          {projects.map((p) => `${colourOf(projects, p).name}: ${p}`).join(' · ')}
          {projects.length > 0 && ' · '}
          {dayLeave > 0 && `Gray: leave (${dur(dayLeave)}) · `}
          Each block is 30 minutes; the outlined block marks 8 hours.
        </p>
      </Card>

      {writable && isToday && (
        <Card
          title="Task"
          actions={running && runningPath && (
            <span className={`runpill ${running.breakFrom ? 'brk' : ''}`}>
              <i />
              {running.breakFrom
                ? `On break · ${dur(live)} since ${running.breakFrom}`
                : `Running: ${runningPath.project} / ${runningPath.task} / ${runningPath.item} · ${dur(live)} since ${running.start}`}
            </span>
          )}
        >
          <div className="taskrow">
            {taskSelect(0, pick, '▶ Choose a task to start…', 'Choose a task to start')}
            <button className="btn purple" onClick={toggleBreak} disabled={!running || act.busy}>{Icon.coffee} {running?.breakFrom ? 'Resume' : 'Break'}</button>
            <button className="btn danger" onClick={end} disabled={!running || act.busy}>{Icon.stop} End task</button>
          </div>
          <input
            aria-label="Remarks"
            value={remarks}
            maxLength={500}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Remarks (optional) — picking a task starts the clock and ends the previous one; edit remarks later in the Timeline"
          />
          <ErrorBox msg={act.error} />
        </Card>
      )}

      {writable && !isToday && (
        <Card title="Add time">
          <div className="taskrow">
            {taskSelect(manual.itemId, (itemId) => setManual({ ...manual, itemId }), 'Choose a task…', 'Task')}
            <input type="time" aria-label="Start time" value={manual.start} onChange={(e) => setManual({ ...manual, start: e.target.value })} />
            <input type="time" aria-label="End time" value={manual.end} onChange={(e) => setManual({ ...manual, end: e.target.value })} />
            <button className="btn" onClick={addManual} disabled={!manual.itemId || act.busy}>Add</button>
          </div>
          <input aria-label="Remarks" placeholder="Remarks (optional)" value={manual.remarks} maxLength={500} onChange={(e) => setManual({ ...manual, remarks: e.target.value })} />
          <ErrorBox msg={act.error} />
        </Card>
      )}

      <div className="actgrid">
        <Card title={<span>Timeline{writable && <span className="hsub"> — click the edit icon to change a start or end time, then Save or Cancel</span>}</span>}>
          {rows.length === 0 && !running ? <Empty>No entries on this day.</Empty> : (
            <div className="tbl">
              <div className="tr th tl"><span>Start</span><span>End</span><span>Effort (work)</span><span className="dur">Duration</span><span /></div>
              {rows.map((r) => editing?.id === r.id ? (
                <div key={r.id} className="tr tl editing">
                  <input type="time" aria-label="Start" value={editing.start} onChange={(e) => setEditing({ ...editing, start: e.target.value })} />
                  <input type="time" aria-label="End" value={editing.end} onChange={(e) => setEditing({ ...editing, end: e.target.value })} />
                  <span className="eff">
                    <b>{label(r)}</b>
                    {r.type === 'work' && <input aria-label="Remarks" placeholder="Remarks" value={editing.remarks} onChange={(e) => setEditing({ ...editing, remarks: e.target.value })} />}
                  </span>
                  <span className="dur">{dur(span(editing.start, editing.end))}</span>
                  <span className="tlact">
                    <button className="btn sm" disabled={act.busy} onClick={() => act.run(() => api.updateEntry(r.id, editing), () => { setEditing(null); data.reload(); })}>Save</button>
                    <button className="btn ghost sm" onClick={() => setEditing(null)}>Cancel</button>
                    <button className="link small" disabled={act.busy} onClick={() => act.run(() => api.deleteEntry(r.id), () => { setEditing(null); data.reload(); })}>Delete</button>
                  </span>
                </div>
              ) : (
                <div key={r.id} className={`tr tl ${r.type === 'break' ? 'brk' : ''}`}>
                  <span>{r.start}</span>
                  <span>{r.end}</span>
                  <span className="eff">{r.type === 'break' ? 'Break' : <><b>{label(r)}</b>{r.remarks && <small>{r.remarks}</small>}</>}</span>
                  <span className="dur">{dur(r.minutes)}</span>
                  <span className="tlact">
                    {writable && (
                      <button className="iconbtn bare" aria-label="Edit entry" onClick={() => setEditing({ id: r.id, start: r.start, end: r.end ?? r.start, remarks: r.remarks })}>{Icon.edit}</button>
                    )}
                  </span>
                </div>
              ))}
              {isToday && running && runningPath && (
                <div className={`tr tl ${running.breakFrom ? 'brk' : 'live'}`}>
                  <span>{running.breakFrom ?? running.start}</span>
                  <span>Now</span>
                  <span className="eff">
                    {running.breakFrom ? 'Break' : <><b>{runningPath.project} / {runningPath.task} / {runningPath.item}</b>{running.remarks && <small>{running.remarks}</small>}</>}
                  </span>
                  <span className="dur">{dur(live)}</span>
                  <span />
                </div>
              )}
              <div className="tr tl total"><span /><span /><b>{isToday ? 'Total work today' : 'Total work'}</b><b className="dur">{dur(workMin)}</b><span /></div>
            </div>
          )}
          {!(writable && isToday) && <ErrorBox msg={act.error} />}
        </Card>

        <div className="col gap">
          <Card title="By category" actions={<b className={short ? 'warnt' : ''}>{dur(logged)} of 8h</b>}>
            {tasksSorted.length === 0 ? <Empty>No time logged on this day.</Empty> : (
              <div className="bars">
                {tasksSorted.map(([task, m]) => (
                  <div key={task} className="barrow">
                    <span>{task}</span>
                    <div className="pb"><div className="pf" style={{ width: `${(m / maxTask) * 100}%`, background: colourOf(taskKeys, task).css }} /></div>
                    <b>{dur(m)}</b>
                  </div>
                ))}
              </div>
            )}
            <p className="small mut">Breaks aren't counted ({dur(breakMin)} {isToday ? 'today' : 'this day'}).</p>
          </Card>

          <Card title="My unlock requests">
            {d.requests.length === 0 ? <Empty>No unlock requests.</Empty> : (
              <div className="tbl">
                {d.requests.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((r) => (
                  <div key={r.id} className="tr c3 ureq">
                    <span className="ell"><b>{fmtChip(r.date)} {fmtDay(r.date).split(' ')[2]}</b> · {r.reason}</span>
                    <span />
                    <Pill tone={UNLOCK_STATUS[r.status].tone}>{UNLOCK_STATUS[r.status].label}</Pill>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {unlock && <UnlockModal date={date} onClose={() => setUnlock(false)} onDone={() => { setUnlock(false); data.reload(); }} />}
    </div>
  );
}

const label = (r: EntryRow) => (r.type === 'break' ? 'Break' : `${r.project} / ${r.task} / ${r.item}`);

function UnlockModal({ date, onClose, onDone }: { date: string; onClose: () => void; onDone: () => void }) {
  const [action, setAction] = useState<UnlockRequest['action']>('add');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const act = useAction();
  return (
    <Modal
      title="Request to unlock a day"
      onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={!reason.trim() || act.busy} onClick={() => act.run(() => api.requestUnlock({ date, action, reason, details }), onDone)}>Send request</button></>}
    >
      <p><b>{fmtDay(date)}</b> is locked. If allowed, this day opens for you for 72 hours.</p>
      <div className="row">
        {(['add', 'edit', 'delete'] as const).map((a) => (
          <label key={a} className="radio"><input type="radio" name="act" checked={action === a} onChange={() => setAction(a)} />{a[0].toUpperCase() + a.slice(1)} time</label>
        ))}
      </div>
      <Field label="Reason (required)"><textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <Field label="Details"><textarea rows={2} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. 2 hours on Alpha / Build / API" /></Field>
      <p className="small mut">Approver: Eli Park (Manager)</p>
      <ErrorBox msg={act.error} />
    </Modal>
  );
}

function CorrectEntry() {
  const cat = useCatalog();
  const [userId, setUserId] = useState(6);
  const [date, setDate] = useState(TODAY);
  const [edit, setEdit] = useState<{ id: number; start: string; end: string } | null>(null);
  const [reason, setReason] = useState('');
  const act = useAction();
  const rows = useLoad(() => api.entries({ from: date, to: date, userId }), [date, userId]);
  if (cat.loading || !cat.data) return <Loading />;
  const people = cat.data.users.filter((u) => u.active);
  return (
    <div className="col gap">
      <Card title="Correct an entry">
        <p className="mut">Fix another person's hours. A reason is required and is saved in the day's change history and the audit log.</p>
        <div className="row wrap">
          <HoverSelect label="Person" value={userId} options={people.map((u) => ({ value: u.id, label: u.name }))} onChange={setUserId} />
          <Field label="Day"><input type="date" value={date} max={TODAY} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
      </Card>
      <Card title="Entries">
        {rows.loading ? <Loading /> : (rows.data ?? []).filter((r) => r.type === 'work').length === 0 ? <Empty>No entries for this person on this day.</Empty> : (
          <div className="tbl">
            <div className="tr th c5"><span>Start</span><span>End</span><span>Project / task / item</span><span>Effort</span><span /></div>
            {(rows.data ?? []).filter((r) => r.type === 'work').map((r) => edit?.id === r.id ? (
              <div key={r.id} className="tr c5 editing">
                <input type="time" aria-label="Start" value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} />
                <input type="time" aria-label="End" value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} />
                <input aria-label="Reason" placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
                <span />
                <span className="row">
                  <button className="btn sm" disabled={!reason.trim()} onClick={() => act.run(() => api.correctEntry(r.id, edit, reason), () => { setEdit(null); setReason(''); rows.reload(); })}>Save</button>
                  <button className="link" onClick={() => setEdit(null)}>Cancel</button>
                </span>
              </div>
            ) : (
              <div key={r.id} className="tr c5">
                <span>{r.start}</span><span>{r.end}</span><span>{label(r)}</span><span>{hours(r.minutes)}</span>
                <button className="link" onClick={() => setEdit({ id: r.id, start: r.start, end: r.end ?? r.start })}>Correct</button>
              </div>
            ))}
          </div>
        )}
        <ErrorBox msg={act.error ?? rows.error} />
      </Card>
    </div>
  );
}
