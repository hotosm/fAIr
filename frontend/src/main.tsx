import { App } from "@/app";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { MainErrorFallback } from "./components/errors";
import { StrictMode } from "react";
import "@/styles/hot-font-face.css";
import "@/styles/hot-sl.css";
import "@/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
