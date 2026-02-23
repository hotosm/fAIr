import { App } from "@/app";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { MainErrorFallback } from "@/components/errors";
import { StrictMode } from "react";
import "@/styles/hot-font-face.css";
import "@/styles/hot-sl.css";
import "@/styles/index.css";

import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
