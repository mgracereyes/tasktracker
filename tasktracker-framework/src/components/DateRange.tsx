// Start date / End date with Apply (FR-021). Apply is disabled for an invalid range.
import { useState } from 'react';

const MAX_DAYS = 92;

export function DateRange({ from, to, onApply, applyLabel = 'Apply' }: { from: string; to: string; onApply: (from: string, to: string) => void; applyLabel?: string }) {
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const days = (Date.parse(t) - Date.parse(f)) / 86400000 + 1;
  const error = !f || !t ? 'Pick both dates' : t < f ? 'End date is before start date' : days > MAX_DAYS ? `Pick ${MAX_DAYS} days or fewer` : null;
  return (
    <div className="drange">
      <label className="fld">
        <span>Start date</span>
        <input type="date" value={f} onChange={(e) => setF(e.target.value)} />
      </label>
      <label className="fld">
        <span>End date</span>
        <input type="date" value={t} onChange={(e) => setT(e.target.value)} />
      </label>
      <button className="btn" disabled={!!error} title={error ?? undefined} onClick={() => onApply(f, t)}>
        {applyLabel}
      </button>
      {error && <span className="err small">{error}</span>}
    </div>
  );
}
