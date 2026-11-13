import { Card, Empty } from 'aws-task-tracker-frontend';

export const InCard = () => (
  <div style={{ width: 480 }}>
    <Card title="Timeline">
      <Empty>No entries on this day.</Empty>
    </Card>
  </div>
);

export const Standalone = () => (
  <div style={{ width: 480 }}>
    <Empty>No time matches these filters.</Empty>
  </div>
);
