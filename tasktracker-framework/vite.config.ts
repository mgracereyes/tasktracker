import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

export default defineConfig({
  plugins: [react()],
  // Release number shown in the app, taken from package.json "version".
  define: { __APP_VERSION__: JSON.stringify(version) },
  server: { port: 5173 },
  test: { environment: 'node' },
});
