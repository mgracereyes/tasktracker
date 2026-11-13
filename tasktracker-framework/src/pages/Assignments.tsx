// Assignments (FR-007, FR-031, FR-033): role on project with start and end dates.
// Team leads assign their own team; the Manager gets "Assignments & Admin" with two tabs.
import { useState } from 'react';
import { api } from '../api/client';
import { useMe } from '../auth/AuthContext';
import { HoverSelect } from '../components/HoverSelect';
import { Card, Empty, ErrorBox, Field, Loading, Modal, PageHead, Tabs } from '../components/ui';
import { TODAY } from '../config';
import { useAction } from '../hooks';
import { addDays, fmtDay } from '../utils/dates';
import { People } from './Admin';
import { useCatalog } from './shared';

const ROLES = [
  { group: 'Delivery', value: 'Developer', hint: 'Build, API, UI' },
  { group: 'Delivery', value: 'Designer', hint: 'Wireframes, review' },
  { group: 'Delivery', value: 'QA / Tester', hint: 'Testing' },
  { group: 'Operations', value: 'Support', hint: 'Tickets, escalations' },
  { group: 'Operations', value: 'Business analyst', hint: 'Requirements' },
  { group: 'Operations', value: 'Project coordinator', hint: 'Planning, stand-ups' },
];

export function AssignmentsPage() {
  const me = useMe();
  const [tab, setTab] = useState<'asg' | 'people'>('asg');
  if (me.role === 'manager') {
    return (
      <>
        <PageHead title="Assignments & Admin" sub="Assign people to projects, and manage roles and project access." />
        <Tabs tabs={[{ id: 'asg', label: 'Assignments' }, { id: 'people', label: 'People & projects' }]} value={tab} onChange={setTab} />
        {tab === 'asg' ? <Assignments /> : <People />}
      </>
    );
  }
  return (
    <>
      <PageHead title="Assignments" sub="Give people a role on a project with a start and end date. Assigning also gives the person access to log time on that project." />
      <Assignments />
    </>
  );
}

function Assignments() {
  const me = useMe();
  const cat = useCatalog();
  const act = useAction();
  const [form, setForm] = useState({ userId: 0, projectId: 0, roleOnProject: 'Developer', startDate: TODAY, endDate: addDays(TODAY, 30) });
  const [dates, setDates] = useState<{ id: number; startDate: string; endDate: string } | null>(null);

  if (cat.loading || !cat.data) return <Loading />;
  const c = cat.data;
  const people = c.users.filter((u) => u.active && (me.role === 'team_lead' ? u.teamLeadId === me.id : u.role === 'employee' || u.role === 'team_lead'));
  const projects = c.projects.filter((p) => p.active && (me.role !== 'team_lead' || p.leadId === me.id || c.members.some((m) => m.projectId === p.id && m.userId === me.id)));
  const rows = c.members.filter((m) => people.some((p) => p.id === m.userId) && projects.some((p) => p.id === m.projectId) && c.projects.find((p) => p.id === m.projectId)?.name !== 'Team management');
  const onProject = (pid: number) => new Set(c.members.filter((m) => m.projectId === pid).map((m) => m.userId));
  const badDates = form.endDate < form.startDate;
  const name = (id: number) => c.users.find((u) => u.id === id);

  return (
    <div className="col gap">
      <Card>
        <div className="fbar c6">
          <HoverSelect label={me.role === 'team_lead' ? 'Employee (your team)' : 'Employee'} value={form.userId} placeholder="Pick a person" options={people.map((u) => ({ value: u.id, label: u.name, hint: `${c.members.filter((m) => m.userId === u.id).length} projects`, disabled: form.projectId ? onProject(form.projectId).has(u.id) : false }))} onChange={(v) => setForm({ ...form, userId: v })} />
          <HoverSelect label="Project" value={form.projectId} placeholder="Pick a project" options={projects.map((p) => ({ value: p.id, label: p.name, hint: `${p.description} · ${onProject(p.id).size} members` }))} onChange={(v) => setForm({ ...form, projectId: v })} />
          <HoverSelect label="Role on project" value={form.roleOnProject} options={ROLES.map((r) => ({ value: r.value, label: r.value, hint: r.hint, group: r.group }))} onChange={(v) => setForm({ ...form, roleOnProject: v })} />
          <Field label="Start date"><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="End date"><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          <button className="btn self-end" disabled={!form.userId || !form.projectId || badDates || act.busy} onClick={() => act.run(() => api.assign(form), cat.reload)}>Assign</button>
        </div>
        {badDates && <p className="err small">End date must be on or after the start date.</p>}
        <ErrorBox msg={act.error} />
      </Card>
      <Card title={me.role === 'team_lead' ? 'Team assignments' : 'Assignments'} actions={<span className="small mut">Today is {fmtDay(TODAY)}</span>}>
        {rows.length === 0 ? <Empty>No assignments yet.</Empty> : (
          <div className="tbl scroll">
            <div className="tr th c6"><span>Employee</span><span>Business unit</span><span>Project / role</span><span>Start date</span><span>End date</span><span /></div>
            {rows.sort((a, b) => a.endDate.localeCompare(b.endDate)).map((m) => (
              <div key={m.id} className="tr c6">
                <b>{name(m.userId)?.name}</b>
                <span>{name(m.userId)?.businessUnit}</span>
                <span>{c.projects.find((p) => p.id === m.projectId)?.name} / {m.roleOnProject}</span>
                <span>{fmtDay(m.startDate)}</span>
                <span className={m.endDate < TODAY ? 'late' : ''}>{fmtDay(m.endDate)}{m.endDate < TODAY ? ' · past end date' : ''}</span>
                <span className="row">
                  <button className="link" onClick={() => setDates({ id: m.id, startDate: m.startDate, endDate: m.endDate })}>Change dates</button>
                  <button className="link" onClick={() => act.run(() => api.removeMember(m.id), cat.reload)}>Remove</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
      {dates && (
        <Modal title="Change dates" onClose={() => setDates(null)} footer={<><button className="btn ghost" onClick={() => setDates(null)}>Cancel</button><button className="btn" disabled={dates.endDate < dates.startDate} onClick={() => act.run(() => api.updateMember(dates.id, dates), () => { setDates(null); cat.reload(); })}>Save</button></>}>
          <div className="row">
            <Field label="Start date"><input type="date" value={dates.startDate} onChange={(e) => setDates({ ...dates, startDate: e.target.value })} /></Field>
            <Field label="End date"><input type="date" value={dates.endDate} onChange={(e) => setDates({ ...dates, endDate: e.target.value })} /></Field>
          </div>
          <ErrorBox msg={act.error} />
        </Modal>
      )}
    </div>
  );
}
