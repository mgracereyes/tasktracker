// Dashboard by role: Employee (tiled), Team lead (Overview / Team tabs), Manager and Admin (Organization overview).
import { useState } from 'react';
import { useMe } from '../../auth/AuthContext';
import { DateRange } from '../../components/DateRange';
import { PageHead, Tabs } from '../../components/ui';
import { useLoad } from '../../hooks';
import { api } from '../../api/client';
import { fmtRange } from '../../utils/dates';
import { currentWeek } from '../shared';
import { MyOverview } from './MyOverview';
import { OrgOverview } from './OrgOverview';
import { TeamTab } from './TeamTab';

export function Dashboard() {
  const me = useMe();
  const [tab, setTab] = useState<'overview' | 'team'>('overview');
  // One period for the whole page; for a team lead it applies to both tabs.
  const [range, setRange] = useState(currentWeek());
  const users = useLoad(() => (me.role === 'team_lead' ? api.users() : Promise.resolve([])), [me.id, me.role]);
  const picker = <DateRange from={range.from} to={range.to} onApply={(from, to) => setRange({ from, to })} />;
  const showing = `Showing ${fmtRange(range.from, range.to, true)}.`;

  // Managers and Admins: the overview has its own header (period, exports) and loads its own data.
  if (me.role === 'manager' || me.role === 'admin') return <OrgOverview />;
  if (me.role === 'team_lead') {
    const size = (users.data ?? []).filter((u) => u.teamLeadId === me.id && u.active).length + 1;
    return (
      <>
        <PageHead
          title="My team"
          sub={`${users.data ? `${size} ${size === 1 ? 'person' : 'people'}, including you · ` : ''}${showing} Opens on the current week; the period applies to both tabs.`}
          actions={picker}
        />
        <Tabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'team', label: 'Team' }]} value={tab} onChange={setTab} />
        {tab === 'overview' ? <MyOverview range={range} lead /> : <TeamTab range={range} />}
      </>
    );
  }
  return (
    <>
      <PageHead title="My dashboard" sub={`${showing} Opens on the current week; choose any start and end date to change the period.`} actions={picker} />
      <MyOverview range={range} />
    </>
  );
}
