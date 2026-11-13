// Leave (FR-024): VL, SL or EL, whole day or half day (morning / afternoon), with remarks.
// Leave hours go straight into the timesheet, so they are never logged as tasks.
import { useState } from 'react';
import { api } from '../api/client';
import type { Leave as LeaveRow, Lock } from '../api/types';
import { useMe } from '../auth/AuthContext';
import { Card, Empty, ErrorBox, Field, Loading, PageHead } from '../components/ui';
import { TODAY } from '../config';
import { useAction, useLoad } from '../hooks';
import { addDays, parse, workdays } from '../utils/dates';
import { creditBlock, LEAVE_TYPES, leaveBalance, leaveInfo, leaveUsed, type LeaveType } from '../utils/leave';

/** How far back the "Past leave" card looks. */
const PAST_DAYS = 90;

type Duration = 'whole' | 'am' | 'pm';
const DURATIONS: { value: Duration; label: string }[] = [
  { value: 'whole', label: 'Whole day · 8h' },
  { value: 'am', label: 'Half day (morning) · 4h' },
  { value: 'pm', label: 'Half day (afternoon) · 4h' },
];

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** '2026-10-09 Fri' */
const isoDay = (d: string) => `${d} ${WD[parse(d).getUTCDay()]}`;
/** One date, or a range; the end drops the year when it matches ('2026-10-29 Thu – 10-30 Fri'). */
const dateCell = (l: LeaveRow) => {
  if (l.startDate === l.endDate) return isoDay(l.startDate);
  const end = l.endDate.slice(0, 4) === l.startDate.slice(0, 4) ? isoDay(l.endDate).slice(5) : isoDay(l.endDate);
  return `${isoDay(l.startDate)} – ${end}`;
};
const durationCell = (l: LeaveRow) => {
  if (l.dayPart === 'half') return l.halfPart === 'pm' ? 'Half day (afternoon)' : l.halfPart === 'am' ? 'Half day (morning)' : 'Half day';
  const n = l.hours / 8;
  return n === 1 ? 'Whole day' : `${n} whole days`;
};
const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

export function Leave() {
  const me = useMe();
  const [form, setForm] = useState<{ type: LeaveType; duration: Duration; from: string; until: string; remarks: string }>({
    type: 'VL',
    duration: 'whole',
    from: TODAY,
    until: '',
    remarks: '',
  });
  const data = useLoad(async () => {
    const [leave, locks] = await Promise.all([api.leave(me.id), api.locks()]);
    return { leave, locks };
  }, [me.id]);
  const act = useAction();

  const all = data.data?.leave ?? [];
  const locks: Lock[] = data.data?.locks ?? [];
  const filed = all.filter((l) => l.status === 'filed');
  const upcoming = filed.filter((l) => l.endDate >= TODAY).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const pastFrom = addDays(TODAY, -PAST_DAYS);
  const past = filed.filter((l) => l.endDate < TODAY && l.endDate >= pastFrom).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lockedLeave = (l: LeaveRow) => workdays(l.startDate, l.endDate).some((d) => d <= TODAY && locks.some((k) => k.startDate <= d && k.endDate >= d));

  // The request being filed.
  const info = leaveInfo(form.type);
  const half = form.duration !== 'whole';
  const until = half || !form.until ? form.from : form.until;
  const n = until >= form.from ? workdays(form.from, until).length : 0;
  const credit = half ? (n ? 4 : 0) : n * 8;
  const balance = leaveBalance(all, me.id, form.type, form.from);
  const block =
    until < form.from ? 'The end date must be on or after the start date.'
    : n === 0 ? 'Pick at least one weekday.'
    : !info.advance && until > TODAY ? `${info.label} cannot be filed in advance.`
    : info.credits !== null && form.from.slice(0, 4) !== until.slice(0, 4) ? `${info.label} must start and end in the same year.`
    : creditBlock(form.type, balance, credit / 8);

  const file = () =>
    act.run(
      () => api.fileLeave({
        type: form.type,
        dayPart: half ? 'half' : 'whole',
        halfPart: half ? (form.duration as 'am' | 'pm') : undefined,
        startDate: form.from,
        endDate: until,
        remarks: form.remarks.trim() || undefined,
      }),
      () => { setForm({ ...form, until: '', remarks: '' }); data.reload(); },
    );
  const cancel = (id: number) => act.run(() => api.cancelLeave(id), data.reload);

  const balances = (
    <div className="balpills">
      {LEAVE_TYPES.map((t) => {
        const b = leaveBalance(all, me.id, t.value, TODAY);
        return (
          <span key={t.value} className="balpill" title={t.label}>
            <b>{t.value}</b> {b === null ? `${days(leaveUsed(all, me.id, t.value, TODAY))} used` : `${days(b)} left`}
          </span>
        );
      })}
    </div>
  );

  const table = (rows: LeaveRow[], footnote?: string) => (
    <>
      <div className="tbl">
        <div className="tr th lvt"><span>Date</span><span>Leave</span><span>Duration</span><span className="num">Credited</span><span>Remarks</span><span /></div>
        {rows.map((l) => (
          <div key={l.id} className="tr lvt">
            <span>{dateCell(l)}</span>
            <span><b>{l.type}</b>&nbsp; {leaveInfo(l.type)?.label ?? l.type}</span>
            <span>{durationCell(l)}</span>
            <span className="num">{l.hours}h</span>
            <span className="ell">{l.remarks || '—'}</span>
            <span className="lvact">
              {lockedLeave(l) ? <span className="mut">Locked</span> : <button className="link" disabled={act.busy} onClick={() => cancel(l.id)}>Cancel leave</button>}
            </span>
          </div>
        ))}
      </div>
      {footnote && <p className="small mut">{footnote}</p>}
    </>
  );

  return (
    <>
      <PageHead title="Leave" sub="File leave in one step. Leave hours go straight into your timesheet, so you don't log them as tasks." actions={balances} />
      <div className="col gap">
        <Card title="File leave">
          <div className="lvform">
            <Field label="Leave type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LeaveType })}>
                {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.value} — {t.label}</option>)}
              </select>
            </Field>
            <Field label="Duration">
              <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value as Duration, until: '' })}>
                {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="From">
              <input type="date" value={form.from} max={info.advance ? undefined : TODAY} onChange={(e) => setForm({ ...form, from: e.target.value })} />
            </Field>
            <Field label="Until (optional)">
              <input type="date" value={half ? '' : form.until} min={form.from} max={info.advance ? undefined : TODAY} disabled={half} title={half ? 'A half day covers one date only' : undefined} onChange={(e) => setForm({ ...form, until: e.target.value })} />
            </Field>
            <Field label="Remarks (optional)">
              <input value={form.remarks} maxLength={200} placeholder="For example: family trip" onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </Field>
            <button className="btn" disabled={act.busy || data.loading || !!block} onClick={file}>File leave</button>
          </div>
          {block && n > 0 ? <p className="warnbox">{block}</p> : (
            <p className="small mut">
              {half ? <>Half day = <b>4h</b></> : <>{n} workday{n === 1 ? '' : 's'} × 8h = <b>{credit}h</b></>} will be credited to your timesheet for the selected days (weekends are skipped).
            </p>
          )}
          <ErrorBox msg={act.error} />
        </Card>

        <Card title="Upcoming leave">
          {!data.data ? <Loading /> : upcoming.length === 0 ? <Empty>No upcoming leave.</Empty> : table(upcoming)}
        </Card>

        <Card title={<span>Past leave <span className="hsub">(last {PAST_DAYS} days)</span></span>}>
          {!data.data ? <Loading /> : past.length === 0 ? <Empty>No leave in the last {PAST_DAYS} days.</Empty> : table(
            past,
            past.some(lockedLeave) ? "Leave on a locked day can't be cancelled here. Ask your manager to unlock the day first." : undefined,
          )}
        </Card>
        <ErrorBox msg={data.error} />
      </div>
    </>
  );
}
