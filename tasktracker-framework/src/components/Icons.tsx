// Line icons used in the sidebar and controls (24x24, stroke = currentColor).
import type { ReactNode } from 'react';

const Svg = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const Icon = {
  dashboard: <Svg><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4M5 8.5l3-2.5 2 1.5 2-2" /></Svg>,
  activity: <Svg><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" /></Svg>,
  leave: <Svg><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></Svg>,
  setup: <Svg><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Svg>,
  assignments: <Svg><path d="M14 21H8a1 1 0 0 1-1-1V8l3-3h7a1 1 0 0 1 1 1v3" /><path d="M7 8h3V5M10.5 11h4M10.5 14h3" /><path d="M19.6 11.6a1.4 1.4 0 0 1 2 2L16 19.2l-2.6.6.6-2.6z" /></Svg>,
  reports: <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 18v-2M12 18v-5M16 18v-3" /></Svg>,
  locks: <Svg><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>,
  admin: <Svg><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" /><path d="M17 11l1.5 1.5L21 10" /></Svg>,
  toggle: <Svg><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M16 10l-2 2 2 2" /></Svg>,
  chevron: <Svg size={16}><path d="M6 9l6 6 6-6" /></Svg>,
  left: <Svg size={16}><path d="M15 18l-6-6 6-6" /></Svg>,
  right: <Svg size={16}><path d="M9 18l6-6-6-6" /></Svg>,
  edit: <Svg size={16}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Svg>,
  lock: <Svg size={14}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>,
  bell: <Svg size={18}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Svg>,
  close: <Svg size={18}><path d="M18 6L6 18M6 6l12 12" /></Svg>,
  user: <Svg size={16}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Svg>,
  logout: <Svg size={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>,
  coffee: <Svg size={18}><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 2.5v3M12 2.5v3" /></Svg>,
  stop: <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>,
  globe: <Svg size={16}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Svg>,
  save: <Svg size={16}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></Svg>,
  info: <Svg size={18}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></Svg>,
  check: <Svg size={18}><path d="M20 6L9 17l-5-5" /></Svg>,
  mail: <Svg size={18}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Svg>,
  eye: <Svg size={18}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>,
  eyeOff: <Svg size={18}><path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 4.1-5.1M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" /></Svg>,
  arrow: <Svg size={18}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>,
  calendar: <Svg size={16}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></Svg>,
};

export function AwsLogo() {
  return (
    <svg width="78" height="30" viewBox="0 0 189.9 72.6" role="img" aria-label="AWS">
      <path fill="currentColor" fillRule="evenodd" d="M66.1 0.8 L74.8 72.2 L80.5 72.0 L101.5 32.4 L108.1 71.5 L109.4 72.6 L113.6 72.5 L147.0 1.1 L134.1 1.4 L117.0 38.9 L115.6 40.0 L109.2 1.6 L108.5 0.8 L103.5 1.1 L82.9 40.2 L77.6 1.4Z M189.4 2.1 L179.5 0.0 L168.6 0.1 L159.2 3.8 L153.4 9.2 L150.6 18.5 L152.0 28.0 L157.6 35.4 L172.0 47.2 L173.9 50.4 L174.0 54.5 L171.1 58.6 L164.0 60.9 L156.8 60.5 L147.6 56.8 L144.0 66.4 L144.2 68.6 L155.4 72.4 L166.2 72.5 L176.4 69.5 L184.8 62.1 L186.9 56.6 L187.1 49.2 L185.9 44.6 L181.5 38.6 L166.0 24.5 L163.9 21.0 L163.9 17.5 L166.8 13.5 L172.6 10.6 L177.5 10.9 L186.5 14.6 L189.9 5.1Z M43.8 0.0 L39.0 0.2 L0.0 65.4 L0.0 71.2 L9.5 71.2 L19.2 57.1 L42.5 57.2 L45.4 71.4 L58.2 71.0Z M37.8 22.9 L41.9 47.2 L24.6 47.4 L24.5 45.9Z" />
    </svg>
  );
}
