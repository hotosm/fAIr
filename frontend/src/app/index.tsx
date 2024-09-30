import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/app/providers/auth-provider";
import { AppRouter } from "@/app/router";
import { ErrorBoundary } from "react-error-boundary";
import { MainErrorFallback } from "@/components/errors";
import { ToastProvider } from "@/app/providers/toast-provider";

export const App = () => {


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
