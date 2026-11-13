// Team lead "Team" tab (FR-009): own team only, filters Project / Task / Item / Member,
// expected versus actual effort.
import { useState } from 'react';
import { api } from '../../api/client';
import { useMe } from '../../auth/AuthContext';
import { HoverSelect } from '../../components/HoverSelect';
import { Card, Empty, ErrorBox, Loading, Pill, Progress } from '../../components/ui';
import { TODAY } from '../../config';
import { useLoad } from '../../hooks';
import { workdays } from '../../utils/dates';
import { hours } from '../../utils/format';
import { expectedMinutes, sumBy, total, useCatalog, workOnly } from '../shared';

/** The period comes from the page header and is shared with the Overview tab. */
export function TeamTab({ range }: { range: { from: string; to: string } }) {
  const me = useMe();
  const [projectId, setProjectId] = useState(0);
  const [taskId, setTaskId] = useState(0);
  const [itemId, setItemId] = useState(0);
  const [userId, setUserId] = useState(0);
  const cat = useCatalog();
  const rows = useLoad(
    () => api.entries({ ...range, projectId: projectId || undefined, taskId: taskId || undefined, itemId: itemId || undefined, userId: userId || undefined }),
    [range.from, range.to, projectId, taskId, itemId, userId],
  );

  if (cat.loading || !cat.data) return <Loading />;
  const c = cat.data;
  const team = c.users.filter((u) => u.teamLeadId === me.id && u.active);
  const teamProjects = c.projects.filter((p) => c.members.some((m) => m.projectId === p.id && (m.userId === me.id || team.some((t) => t.id === m.userId))));
  const tasks = c.tasks.filter((t) => t.projectId === projectId);
  const items = c.items.filter((i) => i.taskId === taskId);
  const all = { value: 0, label: 'All' };
  const work = workOnly(rows.data ?? []).filter((r) => team.some((t) => t.id === r.userId));
  const byUser = sumBy(work, (r) => r.userId);
  const expected = expectedMinutes(range.from, range.to);
  const filtered = projectId || taskId || itemId || userId;

  return (
    <div className="col gap">
      <p className="mut">Your team: {team.map((t) => t.name).join(', ')}.</p>
      <Card>
        <div className="fbar">
          <HoverSelect label="Project" value={projectId} active={!!projectId} options={[all, ...teamProjects.map((p) => ({ value: p.id, label: p.name, hint: p.description }))]} onChange={(v) => { setProjectId(v); setTaskId(0); setItemId(0); }} />
          <HoverSelect label="Task" value={taskId} active={!!taskId} options={[all, ...tasks.map((t) => ({ value: t.id, label: t.name }))]} onChange={(v) => { setTaskId(v); setItemId(0); }} />
          <HoverSelect label="Item" value={itemId} active={!!itemId} options={[all, ...items.map((i) => ({ value: i.id, label: i.name }))]} onChange={setItemId} />
          <HoverSelect label="Member" value={userId} active={!!userId} options={[all, ...team.map((t) => ({ value: t.id, label: t.name }))]} onChange={setUserId} />
        </div>
        {filtered ? <button className="link clear" onClick={() => { setProjectId(0); setTaskId(0); setItemId(0); setUserId(0); }}>Clear filters</button> : null}
      </Card>
      <ErrorBox msg={rows.error ?? cat.error} />
      <div className="tiles">
        <div className="tile"><span>Team hours</span><b>{hours(total(work))}</b><small>{range.from} to {range.to}</small></div>
        <div className="tile"><span>Expected per person</span><b>{hours(expected)}</b><small>{workdays(range.from, range.to < TODAY ? range.to : TODAY).length} workdays so far</small></div>
        <div className="tile"><span>Members</span><b>{team.length}</b><small>Active in your team</small></div>
      </div>
      <Card title="Expected versus actual">
        {rows.loading ? (
          <Loading />
        ) : team.length === 0 ? (
          <Empty>No team members yet.</Empty>
        ) : (
          <div className="tbl">
            <div className="tr th c5"><span>Member</span><span>Actual</span><span>Expected</span><span>Progress</span><span>Status</span></div>
            {team.filter((t) => !userId || t.id === userId).map((t) => {
              const a = byUser.get(t.id) ?? 0;
              return (
                <div key={t.id} className="tr c5">
                  <b>{t.name}</b>
                  <span>{hours(a)}</span>
                  <span>{filtered && !userId ? '—' : hours(expected)}</span>
                  <Progress value={a} max={expected || 1} />
                  {filtered && !userId ? <span className="mut">Filtered</span> : a >= expected ? <Pill tone="ok">On track</Pill> : <Pill tone="warn">{hours(expected - a)} short</Pill>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
