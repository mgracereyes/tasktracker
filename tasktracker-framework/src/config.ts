// App-wide settings from .env (Vite exposes VITE_* variables).
const env = (import.meta.env ?? {}) as Record<string, string | undefined>;

const real = new Date();
const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date. Pinned to the sample period in mock mode (VITE_TODAY). */
export const TODAY: string = env.VITE_TODAY || `${real.getFullYear()}-${pad(real.getMonth() + 1)}-${pad(real.getDate())}`;
/** Current time of day (HH:MM). */
export const NOW: string = env.VITE_TODAY ? '17:30' : `${pad(real.getHours())}:${pad(real.getMinutes())}`;

declare const __APP_VERSION__: string; // set in vite.config.ts from package.json
/** Release number, e.g. 'v.1.0.0'. Build numbers are tracked in the release documents. */
export const APP_VERSION = `v.${typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0'}`;
