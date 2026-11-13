import { PageHead } from 'aws-task-tracker-frontend';

export const WithSubtitle = () => (
  <div style={{ width: 760 }}>
    <PageHead title="Activity" sub="Pick a task, start the timer, take breaks and end the task. Days need 8 hours." />
  </div>
);

export const WithActions = () => (
  <div style={{ width: 760 }}>
    <PageHead
      title="Reports"
      sub="Time logged across the organization."
      actions={<><button className="btn ghost">Export CSV</button><button className="btn ghost">Export XLSX</button></>}
    />
  </div>
);

export const TitleOnly = () => (
  <div style={{ width: 760 }}>
    <PageHead title="Setup" actions={<button className="btn">New project</button>} />
  </div>
);
