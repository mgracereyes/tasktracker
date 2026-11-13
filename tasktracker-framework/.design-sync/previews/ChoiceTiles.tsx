import { useState } from 'react';
import { Card, ChoiceTiles, Field } from 'aws-task-tracker-frontend';

export const LeaveType = () => {
  const [v, setV] = useState('VL');
  return (
    <div style={{ width: 400 }}>
      <ChoiceTiles
        legend="Leave type"
        name="type-demo"
        value={v}
        onChange={setV}
        options={[{ value: 'VL', label: 'VL', hint: 'Vacation leave' }, { value: 'SL', label: 'SL', hint: 'Sick leave' }]}
      />
    </div>
  );
};

export const Duration = () => {
  const [v, setV] = useState('half');
  return (
    <div style={{ width: 400 }}>
      <ChoiceTiles
        legend="Duration"
        name="part-demo"
        value={v}
        onChange={setV}
        options={[{ value: 'whole', label: 'Whole day', hint: '8h per weekday' }, { value: 'half', label: 'Half day', hint: '4h, one date' }]}
      />
    </div>
  );
};

export const FileLeaveForm = () => {
  const [type, setType] = useState('VL');
  const [part, setPart] = useState('whole');
  return (
    <div style={{ width: 440 }}>
      <Card title="File leave">
        <div className="col gap">
          <ChoiceTiles legend="Leave type" name="form-type" value={type} onChange={setType} options={[{ value: 'VL', label: 'VL', hint: 'Vacation leave' }, { value: 'SL', label: 'SL', hint: 'Sick leave' }]} />
          <ChoiceTiles legend="Duration" name="form-part" value={part} onChange={setPart} options={[{ value: 'whole', label: 'Whole day', hint: '8h per weekday' }, { value: 'half', label: 'Half day', hint: '4h, one date' }]} />
          <div className="dates">
            <Field label="Start date"><input type="date" defaultValue="2026-10-26" /></Field>
            <Field label="End date"><input type="date" defaultValue="2026-10-28" /></Field>
          </div>
          <div className="lvsum">
            <span>3 weekdays<small> · weekends are skipped</small></span>
            <span><b>24h</b> credited</span>
          </div>
          <button className="btn wide">File leave</button>
        </div>
      </Card>
    </div>
  );
};
