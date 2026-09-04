import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/// <reference types="vitest/config" />

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],

  // By default it was localhost:5173, but it was causing some issues with the OAUTH, so it was changed to this.
  server: {
    host: "127.0.0.1",
    port: 3500,
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // keep WebAwesome cached independently of app deploys
          if (id.includes("@awesome.me/webawesome")) return "webawesome";
        },
      },
    },
  },

  test: {
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
  },
});
