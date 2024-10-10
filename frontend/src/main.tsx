import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/hot-sl.css";
import "@/styles/index.css";
import { App } from "@/app";
import { ErrorBoundary } from "react-error-boundary";
import { MainErrorFallback } from "./components/errors";
import ContextProviders from "./app/providers";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <ContextProviders>
        <App />
      </ContextProviders>
    </ErrorBoundary>
  </StrictMode>,
);
