// Locks (FR-025 to FR-027): lock date ranges, review unlock requests (72-hour window).
import { useState } from 'react';
import { api } from '../api/client';
import type { UnlockRequest } from '../api/types';
import { Card, Empty, ErrorBox, Field, Loading, PageHead, Pill } from '../components/ui';
import { TODAY } from '../config';
import { useAction, useLoad } from '../hooks';
import { download, toCsv } from '../utils/csv';
import { addDays, fmtDay } from '../utils/dates';

const TONE: Record<UnlockRequest['status'], 'warn' | 'ok' | 'bad' | 'grey'> = { pending: 'warn', allowed: 'ok', declined: 'bad', expired: 'grey' };

export function Locks() {
  const act = useAction();
  const [form, setForm] = useState({ startDate: addDays(TODAY, -30), endDate: addDays(TODAY, -1), reason: '' });
  const data = useLoad(async () => {
    const [locks, reqs, users] = await Promise.all([api.locks(), api.unlockRequests(), api.users()]);
    return { locks, reqs, users };
  }, []);
  const who = (id: number) => data.data?.users.find((u) => u.id === id)?.name ?? `User ${id}`;

  return (
    <>
      <PageHead title="Locks" sub="Lock finished periods. People can ask to unlock a day; an allowed request opens that day for 72 hours." />
      <ErrorBox msg={act.error ?? data.error} />
      {data.loading || !data.data ? <Loading /> : (
        <div className="col gap">
          <Card title="Unlock requests">
            {data.data.reqs.length === 0 ? <Empty>No requests.</Empty> : (
              <div className="tbl">
                <div className="tr th c6"><span>Employee</span><span>Day</span><span>Action</span><span>Reason</span><span>Status</span><span /></div>
                {data.data.reqs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => (
                  <div key={r.id} className="tr c6">
                    <b>{who(r.userId)}</b>
                    <span>{fmtDay(r.date)}</span>
                    <span>{r.action[0].toUpperCase() + r.action.slice(1)} time</span>
                    <span className="ell" title={r.details}>{r.reason}</span>
                    <span><Pill tone={TONE[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Pill>{r.status === 'pending' && <small className="mut"> expires {r.expiresAt.slice(0, 16).replace('T', ' ')}</small>}</span>
                    <span className="row">
                      {r.status === 'pending' && (
                        <>
                          <button className="btn sm" onClick={() => act.run(() => api.decideUnlock(r.id, true), data.reload)}>Allow</button>
                          <button className="btn sm ghost" onClick={() => act.run(() => api.decideUnlock(r.id, false), data.reload)}>Decline</button>
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <div className="grid2">
            <Card title="Lock a date range">
              <div className="row wrap">
                <Field label="Start date"><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
                <Field label="End date"><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
              </div>
              <Field label="Reason"><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. October closed" /></Field>
              <button className="btn" disabled={form.endDate < form.startDate || act.busy} onClick={() => act.run(() => api.addLock(form), data.reload)}>Lock</button>
            </Card>
            <Card title="Locked ranges" actions={<button className="link" onClick={() => download('lock_history.csv', toCsv([['Start', 'End', 'Locked by', 'Reason'], ...data.data!.locks.map((l) => [l.startDate, l.endDate, who(l.lockedBy), l.reason])]))}>Export history</button>}>
              {data.data.locks.length === 0 ? <Empty>Nothing is locked.</Empty> : data.data.locks.map((l) => (
                <div key={l.id} className="tr c3">
                  <b>{fmtDay(l.startDate)} – {fmtDay(l.endDate)}</b>
                  <span className="mut">{who(l.lockedBy)} · {l.reason}</span>
                  <button className="link" onClick={() => act.run(() => api.removeLock(l.id), data.reload)}>Unlock</button>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
