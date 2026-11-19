import { App } from "@/app";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { MainErrorFallback } from "@/components/errors";
import { StrictMode } from "react";
import { setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
// Use a stripped copy of @hotosm/ui/dist/style.css that excludes the
// `@layer wa-native` global HTML reset (which conflicts with Tailwind).
// Only CSS variable/token layers needed by hotosm web components are kept.
// See src/styles/hotosm-vars.css header comment for full details.
import "@/styles/hotosm-vars.css";
import "@hotosm/ui/dist/webawesome-all.js";
import "@/styles/hot-font-face.css";
import "@/styles/hot-sl.css";
import "@/styles/index.css";

// Bundlers cannot resolve MapLibre's worker from import.meta.url, so it is set once here.
setWorkerUrl(maplibreWorkerUrl);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
