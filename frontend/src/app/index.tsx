import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/app/providers/auth-provider";
import { AppRouter } from "@/app/router";
import { ErrorBoundary } from "react-error-boundary";
import { MainErrorFallback } from "@/components/errors";
import { ToastProvider } from "@/app/providers/toast-provider";
import { useEffect } from "react";
import { ENVS } from "@/config/env";

export const App = () => {

  const hotTrackingTagName = 'hot-tracking';

  const setupHotTracking = () => {
    const hotTracking = document.createElement(hotTrackingTagName);
    //adding a class for easy configuration in the css
    hotTracking.classList.add('hot-matomo');
    // setting the other attributes
    hotTracking.setAttribute("site-id", ENVS.MATOMO_ID);
    hotTracking.setAttribute("domain", ENVS.MATOMO_APP_DOMAIN);
    hotTracking.setAttribute("force", 'true');
    document.body.appendChild(hotTracking);
  }
  useEffect(() => {
    if (document.getElementsByTagName(hotTrackingTagName).length > 0) return
    setupHotTracking();
    return
  }, []);

  return (
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <HelmetProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ToastProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};
