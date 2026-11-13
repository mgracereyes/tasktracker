import { Card, Loading } from 'aws-task-tracker-frontend';

export const InCard = () => (
  <div style={{ width: 480 }}>
    <Card title="Unlock requests">
      <Loading />
    </Card>
  </div>
);

export const Standalone = () => <Loading />;
