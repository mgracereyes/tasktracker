import { Progress } from 'aws-task-tracker-frontend';

export const DayOfEightHours = () => (
  <div style={{ width: 360 }} className="col">
    <div className="row between"><b>Wed 21 Oct</b><span>6.5h of 8h</span></div>
    <Progress value={390} max={480} />
  </div>
);

export const TaskVersusMeeting = () => (
  <div style={{ width: 560 }} className="bars">
    <div className="barrow"><span>Build / API</span><Progress value={2520} max={3600} /><b>42h</b></div>
    <div className="barrow"><span>Daily stand-up</span><Progress value={600} max={900} kind="meeting" /><b>10h</b></div>
    <div className="barrow"><span>Testing / Regression</span><Progress value={1260} max={1260} /><b>21h</b></div>
  </div>
);

export const WithLeave = () => (
  <div className="row" style={{ gap: 16, alignItems: 'stretch' }}>
    <div className="day" style={{ width: 200, minHeight: 0 }}>
      <b>Wed 14 Oct</b>
      <span className="dh">8h</span>
      <Progress value={240} leave={240} max={480} />
      <span className="lv">SL · 4h</span>
    </div>
    <div className="day leave" style={{ width: 200, minHeight: 0 }}>
      <b>Fri 9 Oct</b>
      <span className="dh">8h</span>
      <Progress value={0} leave={480} max={480} />
      <span className="lv">VL · 8h</span>
    </div>
  </div>
);

export const EmptyAndFull = () => (
  <div style={{ width: 360 }} className="col">
    <Progress value={0} max={480} />
    <Progress value={480} max={480} />
  </div>
);
