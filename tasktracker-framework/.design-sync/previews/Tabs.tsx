import { useState } from 'react';
import { Tabs } from 'aws-task-tracker-frontend';

export const TwoTabs = () => {
  const [tab, setTab] = useState('overview');
  return <Tabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'team', label: 'Team' }]} value={tab} onChange={setTab} />;
};
