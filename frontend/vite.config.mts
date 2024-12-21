import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // By default it was localhost:5173, but it was causing some issues with the OAUTH, so it was changed to this.
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
