import * as React from 'react';
import { Field, Modal } from 'aws-task-tracker-frontend';

// .ovl is position: fixed; the transform makes this frame its containing block so the
// backdrop and dialog stay inside the card instead of escaping to the page viewport.
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', height: 500, width: 720, transform: 'translateZ(0)', overflow: 'hidden' }}>{children}</div>
);

export const UnlockRequest = () => (
  <Frame>
  <Modal
    title="Request to unlock a day"
    onClose={() => {}}
    footer={
      <>
        <button className="btn ghost">Cancel</button>
        <button className="btn">Send request</button>
      </>
    }
  >
    <p><b>Thu 24 Sep</b> is locked. If allowed, this day opens for you for 72 hours.</p>
    <div className="row">
      <label className="radio"><input type="radio" name="act" defaultChecked />Add time</label>
      <label className="radio"><input type="radio" name="act" />Edit time</label>
      <label className="radio"><input type="radio" name="act" />Delete time</label>
    </div>
    <Field label="Reason (required)">
      <textarea rows={3} defaultValue="Forgot to log the afternoon API work" />
    </Field>
    <Field label="Details">
      <textarea rows={2} placeholder="e.g. 2 hours on Alpha / Build / API" />
    </Field>
  </Modal>
  </Frame>
);

export const WideWithTable = () => (
  <Frame>
    <Modal
      title="Alpha · 150h / 180h"
      wide
      onClose={() => {}}
      footer={<><button className="btn ghost">Open in Reports</button><button className="btn">Close</button></>}
    >
      <div className="tbl">
        <div className="tr th c3"><span>Member</span><span>Task / item</span><span>Hours</span></div>
        <div className="tr c3"><b>Aisha Rahman</b><span>Build / API</span><span>42h</span></div>
        <div className="tr c3"><b>Ben Ortiz</b><span>Build / UI</span><span>37.5h</span></div>
        <div className="tr c3"><b>Jo Tan</b><span>Testing / Regression</span><span>21h</span></div>
      </div>
    </Modal>
  </Frame>
);
