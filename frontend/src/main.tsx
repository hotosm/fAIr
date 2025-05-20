import ContextProviders from "./app/providers";
import { App } from "@/app";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { MainErrorFallback } from "@/components/errors";
import { StrictMode } from "react";
import "@/styles/hot-font-face.css";
import '@hotosm/ui/dist/style.css';
import "@/styles/index.css";
import '@hotosm/ui/dist/components';
import { MATOMO_APP_DOMAIN, MATOMO_ID } from "@/config";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <ContextProviders>
        <App />
        <hot-tracking site-id={MATOMO_ID} domain={MATOMO_APP_DOMAIN}></hot-tracking>
      </ContextProviders>
    </ErrorBoundary>
  </StrictMode>,
);
