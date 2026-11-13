import { Card, Pill, Progress } from 'aws-task-tracker-frontend';

export const WithTitleAndActions = () => (
  <div style={{ maxWidth: 520 }}>
    <Card title="Locked ranges" actions={<button className="link">Export history</button>}>
      <div className="tr c3">
        <b>Tue 1 Sep – Wed 30 Sep</b>
        <span className="mut">Eli Park · September closed</span>
        <button className="link">Unlock</button>
      </div>
      <div className="tr c3">
        <b>Thu 1 Oct – Fri 9 Oct</b>
        <span className="mut">Eli Park · Payroll cut-off</span>
        <button className="link">Unlock</button>
      </div>
    </Card>
  </div>
);

export const DayProgress = () => (
  <div style={{ maxWidth: 520 }}>
    <Card title={<span className="row">Wed 21 Oct <Pill tone="warn">1.5h short</Pill></span>}>
      <div className="dayhours">
        <div className="row between"><b>Logged</b><span>6.5h of 8h</span></div>
        <Progress value={390} max={480} />
      </div>
    </Card>
  </div>
);

export const UpcomingLeave = () => (
  <div style={{ width: "100%", maxWidth: 900 }}>
    <Card title="Upcoming leave">
      <div className="tbl">
        <div className="tr th lvt"><span>Date</span><span>Leave</span><span>Duration</span><span className="num">Credited</span><span>Remarks</span><span /></div>
        <div className="tr lvt"><span>2026-10-29 Thu – 10-30 Fri</span><span><b>VL</b>&nbsp; Vacation Leave</span><span>2 whole days</span><span className="num">16h</span><span className="ell">Family trip</span><span className="lvact"><button className="link">Cancel leave</button></span></div>
        <div className="tr lvt"><span>2026-11-02 Mon</span><span><b>VL</b>&nbsp; Vacation Leave</span><span>Half day (morning)</span><span className="num">4h</span><span className="ell">—</span><span className="lvact"><button className="link">Cancel leave</button></span></div>
      </div>
    </Card>
  </div>
);

export const PastLeaveList = () => (
  <div style={{ width: "100%", maxWidth: 900 }}>
    <Card title={<span>Past leave <span className="hsub">(last 90 days)</span></span>}>
      <div className="tbl">
        <div className="tr th lvt"><span>Date</span><span>Leave</span><span>Duration</span><span className="num">Credited</span><span>Remarks</span><span /></div>
        <div className="tr lvt"><span>2026-10-14 Wed</span><span><b>SL</b>&nbsp; Sick Leave</span><span>Half day (afternoon)</span><span className="num">4h</span><span className="ell">Clinic visit</span><span className="lvact"><button className="link">Cancel leave</button></span></div>
        <div className="tr lvt"><span>2026-09-15 Tue</span><span><b>SL</b>&nbsp; Sick Leave</span><span>Half day (afternoon)</span><span className="num">4h</span><span className="ell">Clinic visit</span><span className="lvact"><span className="mut">Locked</span></span></div>
        <div className="tr lvt"><span>2026-09-04 Fri</span><span><b>SL</b>&nbsp; Sick Leave</span><span>Whole day</span><span className="num">8h</span><span className="ell">—</span><span className="lvact"><span className="mut">Locked</span></span></div>
        <div className="tr lvt"><span>2026-08-21 Fri</span><span><b>EL</b>&nbsp; Emergency Leave</span><span>Whole day</span><span className="num">8h</span><span className="ell">—</span><span className="lvact"><button className="link">Cancel leave</button></span></div>
      </div>
      <p className="small mut">Leave on a locked day can't be cancelled here. Ask your manager to unlock the day first.</p>
    </Card>
  </div>
);

export const BodyOnly = () => (
  <div style={{ maxWidth: 520 }}>
    <Card>
      <p className="mut">Pick a task, start the timer, take breaks and end the task. Days need 8 hours.</p>
    </Card>
  </div>
);
