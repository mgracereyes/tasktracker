// The hover dropdown used across the mockups: opens on hover or keyboard focus.
import { Icon } from './Icons';

export interface Option<V> {
  value: V;
  label: string;
  hint?: string;
  group?: string;
  disabled?: boolean;
}

interface Props<V> {
  label: string;
  value: V;
  options: Option<V>[];
  onChange: (v: V) => void;
  placeholder?: string;
  active?: boolean;
}

export function HoverSelect<V extends string | number>({ label, value, options, onChange, placeholder = 'All', active }: Props<V>) {
  const sel = options.find((o) => o.value === value);
  let lastGroup: string | undefined;
  return (
    <div className="fld">
      <span>{label}</span>
      <div className="fdd">
        <button type="button" className={`fbtn ${active ? 'on' : ''}`} aria-haspopup="listbox" aria-label={`${label}: ${sel?.label ?? placeholder}`}>
          <span className="ell">{sel?.label ?? placeholder}</span>
          {Icon.chevron}
        </button>
        <div className="flist">
          <div className="fpanel" role="listbox" aria-label={label}>
            {options.map((o) => {
              const head = o.group && o.group !== lastGroup ? <div className="fg">{o.group}</div> : null;
              lastGroup = o.group;
              const isSel = o.value === value;
              return (
                <div key={String(o.value)}>
                  {head}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    disabled={o.disabled}
                    className={`fo ${isSel ? 'sel' : ''}`}
                    onClick={(e) => {
                      onChange(o.value);
                      (e.currentTarget as HTMLButtonElement).blur();
                    }}
                  >
                    <span>{isSel ? '✓ ' : ''}{o.label}</span>
                    {o.hint && <span className="fh">{o.hint}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
