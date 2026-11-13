// Small shared building blocks: cards, buttons, states, tabs, modal, progress bar, fields.
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icons';

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="phead">
      <div>
        <h1>{title}</h1>
        {sub && <p className="mut">{sub}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="chead">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export const Loading = () => <p className="mut" role="status">Loading…</p>;
export const ErrorBox = ({ msg }: { msg: string | null }) => (msg ? <p className="err" role="alert">{msg}</p> : null);
export const Empty = ({ children }: { children: ReactNode }) => <p className="empty">{children}</p>;

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={t.id === value} className={t.id === value ? 'tab on' : 'tab'} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="ovl" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`mdl ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="mhead">
          <h2>{title}</h2>
          <button className="iconbtn" aria-label="Close" onClick={onClose}>{Icon.close}</button>
        </div>
        <div className="mbody">{children}</div>
        {footer && <div className="mfoot">{footer}</div>}
      </div>
    </div>
  );
}

/** Progress bar: blue for task work, orange for meetings (FR-034).
 *  `leave` adds a gray segment after the work segment (VL / SL hours, same unit as value). */
export function Progress({ value, max, kind = 'task', leave = 0 }: { value: number; max: number; kind?: 'task' | 'meeting'; leave?: number }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const lp = max > 0 ? Math.min(100 - p, (leave / max) * 100) : 0;
  return (
    <div className="pb" role="progressbar" aria-valuenow={Math.round(p + lp)} aria-valuemin={0} aria-valuemax={100}>
      {p > 0 && <div className={`pf ${kind}`} style={{ width: `${p}%` }} />}
      {lp > 0 && <div className="pf leave" style={{ width: `${lp}%` }} />}
    </div>
  );
}

/** A labelled group of selectable tiles that behaves as a radio group (e.g. leave type, duration). */
export function ChoiceTiles<V extends string>({ legend, name, value, options, onChange }: { legend: string; name: string; value: V; options: { value: V; label: string; hint?: string }[]; onChange: (v: V) => void }) {
  return (
    <fieldset className="choice">
      <legend>{legend}</legend>
      <div className="seg">
        {options.map((o) => (
          <label key={o.value} className={`segopt ${value === o.value ? 'on' : ''}`}>
            <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
            <b>{o.label}</b>
            {o.hint && <small>{o.hint}</small>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="fld">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Pill({ tone = 'grey', children }: { tone?: 'grey' | 'ok' | 'warn' | 'bad' | 'blue'; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
