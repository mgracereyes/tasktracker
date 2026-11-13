import { AwsLogo } from 'aws-task-tracker-frontend';

export const Brand = () => (
  <div className="brand">
    <AwsLogo />
    <span>Task Tracker</span>
  </div>
);

export const BrandLarge = () => (
  <div className="brand big">
    <AwsLogo />
    <span>Task Tracker</span>
  </div>
);

export const OnPrimary = () => (
  <div style={{ background: 'var(--primary)', color: '#FFFFFF', padding: '12px 16px', borderRadius: 'var(--radius)', display: 'inline-flex' }}>
    <AwsLogo />
  </div>
);
