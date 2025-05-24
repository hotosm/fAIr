import { AppRouter } from "@/app/router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { showErrorToast } from "@/utils";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { TourProvider } from "@reactour/tour";
import { APP_TOUR_STEPS } from "@/constants/site-tour";
import { AuthProvider } from "./providers/auth-provider";
import { HelmetProvider } from "react-helmet-async";

export const App = () => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // only show error toasts if we already have data in the cache
        // which indicates a failed background update
        if (query.state.data !== undefined) {
          showErrorToast(error);
        }
      },
    }),
  });

  const radius = 8;
  return (
    <HelmetProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <TourProvider
            // @ts-expect-error bad type definition
            steps={APP_TOUR_STEPS}
            scrollSmooth
            padding={{
              popover: [5, 10],
            }}
            styles={{
              popover: (base) => ({
                ...base,
                "--reactour-accent": "#d63f40",
                borderRadius: radius,
              }),
              maskArea: (base) => ({ ...base, rx: radius }),
              badge: (base) => ({ ...base, left: "auto", right: "-0.8125em" }),
              controls: (base) => ({ ...base, marginTop: 100 }),
              close: (base) => ({ ...base, right: "auto", left: 10, top: 10 }),
            }}
          >
            <AppRouter />
          </TourProvider>
        </QueryClientProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};
