import { Field } from 'aws-task-tracker-frontend';

export const TextAndDate = () => (
  <div className="row wrap">
    <Field label="Project name"><input defaultValue="Client portal v2" /></Field>
    <Field label="Start date"><input type="date" defaultValue="2026-10-21" /></Field>
  </div>
);

export const SelectAndTextarea = () => (
  <div className="col" style={{ width: 360 }}>
    <Field label="Role">
      <select defaultValue="team_lead">
        <option value="employee">Employee</option>
        <option value="team_lead">Team lead</option>
        <option value="manager">Manager</option>
      </select>
    </Field>
    <Field label="Reason (required)"><textarea rows={3} defaultValue="Wrong item selected" /></Field>
  </div>
);
