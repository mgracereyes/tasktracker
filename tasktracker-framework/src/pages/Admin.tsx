// Admin (FR-004, FR-014, FR-015, FR-032): people, business unit, role, projects, status;
// audit log (Admin only). The Manager sees People & projects inside Assignments & Admin.
import { useState } from 'react';
import { api } from '../api/client';
import { ROLE_LABEL, type Role, type User } from '../api/types';
import { useMe } from '../auth/AuthContext';
import { Card, Empty, ErrorBox, Loading, PageHead, Pill, Tabs } from '../components/ui';
import { useAction, useLoad } from '../hooks';
import { initials } from '../utils/format';
import { useCatalog } from './shared';

export function Admin() {
  const [tab, setTab] = useState<'people' | 'audit'>('people');
  return (
    <>
      <PageHead title="Admin" sub="People, roles, projects and the audit log." />
      <Tabs tabs={[{ id: 'people', label: 'People & projects' }, { id: 'audit', label: 'Audit log' }]} value={tab} onChange={setTab} />
      {tab === 'people' ? <People /> : <AuditLog />}
    </>
  );
}

export function People() {
  const me = useMe();
  const cat = useCatalog();
  const act = useAction();
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState<Role | ''>('');
  const [changes, setChanges] = useState<Record<number, { role?: Role; projects?: number[] }>>({});

  if (cat.loading || !cat.data) return <Loading />;
  const c = cat.data;
  const projOf = (u: User) => changes[u.id]?.projects ?? c.members.filter((m) => m.userId === u.id).map((m) => m.projectId);
  const editable = (u: User) => u.active && u.id !== me.id && (me.role === 'admin' || (u.role !== 'admin' && u.role !== 'manager'));
  const roles: Role[] = me.role === 'admin' ? ['employee', 'team_lead', 'manager', 'admin'] : ['employee', 'team_lead'];
  const list = c.users.filter((u) => (!q || (u.name + u.email).toLowerCase().includes(q.toLowerCase())) && (!roleF || u.role === roleF));
  const dirty = Object.keys(changes).length > 0;

  const save = () =>
    act.run(async () => {
      for (const [id, ch] of Object.entries(changes)) {
        if (ch.role) await api.updateUser(Number(id), { role: ch.role });
        if (ch.projects) await api.setUserProjects(Number(id), ch.projects);
      }
    }, () => { setChanges({}); cat.reload(); });

  return (
    <Card>
      <div className="row wrap">
        <label className="fld grow"><span>Search</span><input placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label className="fld"><span>Role</span>
          <select value={roleF} onChange={(e) => setRoleF(e.target.value as Role | '')}>
            <option value="">All roles</option>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </label>
      </div>
      <div className="tbl scroll">
        <div className="tr th c7"><span>Person</span><span>Business unit</span><span>Role</span><span>Projects</span><span>Last sign-in</span><span>Status</span><span /></div>
        {list.map((u) => (
          <div key={u.id} className={`tr c7 ${u.active ? '' : 'off'}`}>
            <span className="who"><span className="av">{initials(u.name)}</span><span><b>{u.name}</b><small>{u.email}</small></span></span>
            <span>{u.businessUnit}</span>
            {editable(u) ? (
              <select aria-label={`Role for ${u.name}`} value={changes[u.id]?.role ?? u.role} onChange={(e) => setChanges({ ...changes, [u.id]: { ...changes[u.id], role: e.target.value as Role } })}>
                {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            ) : <Pill tone="blue">{ROLE_LABEL[u.role]}</Pill>}
            {editable(u) && u.role !== 'manager' && u.role !== 'admin' ? (
              <details className="multi">
                <summary aria-label={`Projects for ${u.name}`}>{projOf(u).map((id) => c.projects.find((p) => p.id === id)?.name).filter(Boolean).join(', ') || 'None'}</summary>
                <div className="fpanel">
                  {c.projects.map((p) => {
                    const on = projOf(u).includes(p.id);
                    return (
                      <label key={p.id} className="radio">
                        <input type="checkbox" checked={on} onChange={() => setChanges({ ...changes, [u.id]: { ...changes[u.id], projects: on ? projOf(u).filter((x) => x !== p.id) : [...projOf(u), p.id] } })} />
                        {p.name}
                      </label>
                    );
                  })}
                </div>
              </details>
            ) : <span className="mut">{u.role === 'manager' || u.role === 'admin' ? '—' : projOf(u).map((id) => c.projects.find((p) => p.id === id)?.name).join(', ')}</span>}
            <span className="mut">{u.lastSignIn}</span>
            <Pill tone={u.active ? 'ok' : 'grey'}>{u.active ? 'Active' : 'Deactivated'}</Pill>
            {me.role === 'admin' && u.id !== me.id ? (
              <button className="link" onClick={() => act.run(() => api.updateUser(u.id, { active: !u.active }), cat.reload)}>{u.active ? 'Deactivate' : 'Activate'}</button>
            ) : <span />}
          </div>
        ))}
      </div>
      <ErrorBox msg={act.error} />
      <div className="row end">
        <button className="btn ghost" disabled={!dirty} onClick={() => setChanges({})}>Cancel</button>
        <button className="btn" disabled={!dirty || act.busy} onClick={save}>Save changes</button>
      </div>
      <p className="small mut">Every role or project change is recorded in the audit log.{me.role === 'manager' ? ' Manager and Admin roles and deactivation are done by an admin.' : ''}</p>
    </Card>
  );
}

function AuditLog() {
  const log = useLoad(() => api.audit(), []);
  const users = useLoad(() => api.users(), []);
  const who = (id: number | null) => (id === null ? 'System' : users.data?.find((u) => u.id === id)?.name ?? `User ${id}`);
  return (
    <Card title="Audit log" actions={<span className="small mut">Entries can be added but never changed or deleted.</span>}>
      <ErrorBox msg={log.error} />
      {log.loading ? <Loading /> : (log.data ?? []).length === 0 ? <Empty>No entries.</Empty> : (
        <div className="tbl scroll">
          <div className="tr th c5"><span>When</span><span>Who</span><span>Action</span><span>Target</span><span>Reason</span></div>
          {(log.data ?? []).map((a) => (
            <div key={a.id} className="tr c5"><span>{a.at}</span><span>{who(a.actorId)}</span><code>{a.action}</code><span className="ell">{a.target}</span><span className="mut">{a.reason}</span></div>
          ))}
        </div>
      )}
    </Card>
  );
}
