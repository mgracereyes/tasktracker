import { ErrorBox, Field } from 'aws-task-tracker-frontend';

export const LockedDay = () => (
  <div style={{ width: 480 }}>
    <ErrorBox msg="This day is locked. Request an unlock first." />
  </div>
);

export const UnderAForm = () => (
  <div className="col" style={{ width: 360 }}>
    <Field label="Company email"><input type="email" defaultValue="someone@gmail.com" /></Field>
    <button className="btn wide">Sign in</button>
    <ErrorBox msg="Only @awsys-i.com accounts can sign in." />
  </div>
);
