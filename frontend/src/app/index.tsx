
import { AppRouter } from "@/app/router";
import { useToast } from "@/app/providers/toast-provider";
import { useEffect } from "react";
import { ENVS } from "@/config/env";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";


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

  const { notify } = useToast();

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // only show error toasts if we already have data in the cache
        // which indicates a failed background update
        if (query.state.data !== undefined) {
          notify(`Something went wrong: ${error.message}`, 'danger')
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




