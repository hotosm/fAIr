import { AppRouter } from "@/app/router";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { showErrorToast } from "@/utils";

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
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <AppRouter />
    </QueryClientProvider>
  );
};
