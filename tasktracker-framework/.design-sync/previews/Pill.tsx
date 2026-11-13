import { Pill } from 'aws-task-tracker-frontend';

export const Tones = () => (
  <div className="row wrap">
    <Pill>Archived</Pill>
    <Pill tone="ok">Filed</Pill>
    <Pill tone="warn">Pending</Pill>
    <Pill tone="bad">Locked</Pill>
    <Pill tone="blue">Public</Pill>
  </div>
);

export const InStatusRow = () => (
  <div className="tbl" style={{ maxWidth: 520 }}>
    <div className="tr c3"><b>Aisha Rahman</b><span className="mut">Thu 24 Sep · Add time</span><Pill tone="warn">Pending</Pill></div>
    <div className="tr c3"><b>Ben Ortiz</b><span className="mut">Tue 29 Sep · Edit time</span><Pill tone="ok">Allowed</Pill></div>
    <div className="tr c3"><b>Raf Cruz</b><span className="mut">Tue 22 Sep · Delete time</span><Pill>Expired</Pill></div>
  </div>
);
