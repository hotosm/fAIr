
/// <reference types="vitest/config" />


import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // By default it was localhost:5173, but it was causing some issues with the OAUTH, so it was changed to this.
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  test: {
    environment: 'jsdom',
  }
});
