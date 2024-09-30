import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/app/providers/auth-provider";
import { AppRouter } from "@/app/router";
import { ErrorBoundary } from "react-error-boundary";
import { MainErrorFallback } from "@/components/errors";
import { AlertProvider } from "@/app/providers/alert-provider";

export const App = () => {
  

  return (
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <HelmetProvider>
        <AuthProvider>
          <AlertProvider>
          <AppRouter />
          </AlertProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};
