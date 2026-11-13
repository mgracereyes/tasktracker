import { DateRange } from 'aws-task-tracker-frontend';

export const CurrentWeek = () => <DateRange from="2026-10-19" to="2026-10-23" onApply={() => {}} />;

export const InvalidRange = () => <DateRange from="2026-10-23" to="2026-10-19" onApply={() => {}} />;

export const TooLong = () => <DateRange from="2026-01-01" to="2026-10-21" onApply={() => {}} applyLabel="Show" />;
