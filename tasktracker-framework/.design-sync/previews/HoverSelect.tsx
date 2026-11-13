import { useState } from 'react';
import { HoverSelect } from 'aws-task-tracker-frontend';

const PROJECTS = [
  { value: 1, label: 'Alpha', hint: 'Client portal' },
  { value: 2, label: 'Beta', hint: 'Support desk' },
  { value: 3, label: 'Gamma', hint: 'Design system' },
  { value: 4, label: 'Delta', hint: 'Integrations' },
];

export const Placeholder = () => {
  const [v, setV] = useState<string | number>(0);
  return (
    <div style={{ width: 240 }}>
      <HoverSelect label="Project" value={v} placeholder="Pick a project" options={PROJECTS} onChange={setV} />
    </div>
  );
};

export const Selected = () => {
  const [v, setV] = useState<string | number>(1);
  return (
    <div style={{ width: 240 }}>
      <HoverSelect label="Project" value={v} options={PROJECTS} onChange={setV} />
    </div>
  );
};

export const ActiveFilter = () => {
  const [v, setV] = useState<string | number>(3);
  return (
    <div style={{ width: 240 }}>
      <HoverSelect label="Project" value={v} active options={[{ value: 0, label: 'All' }, ...PROJECTS]} onChange={setV} />
    </div>
  );
};

export const OpenWithGroups = () => {
  const [v, setV] = useState<string | number>('Developer');
  return (
    <div style={{ width: 260, height: 330 }}>
      <div className="fdd-open-demo">
        <HoverSelect
          label="Role on project"
          value={v}
          onChange={setV}
          options={[
            { group: 'Delivery', value: 'Developer', label: 'Developer', hint: 'Build, API, UI' },
            { group: 'Delivery', value: 'Designer', label: 'Designer', hint: 'Wireframes, review' },
            { group: 'Delivery', value: 'QA / Tester', label: 'QA / Tester', hint: 'Testing' },
            { group: 'Operations', value: 'Support', label: 'Support', hint: 'Tickets, escalations' },
            { group: 'Operations', value: 'Business analyst', label: 'Business analyst', hint: 'Requirements', disabled: true },
          ]}
        />
      </div>
      <style>{'.fdd-open-demo .flist { display: block; }'}</style>
    </div>
  );
};
