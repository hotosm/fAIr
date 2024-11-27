import { AppRouter } from "@/app/router";
import { useEffect } from "react";
import { ENVS } from "@/config/env";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HOT_TRACKING_HTML_TAG_NAME, showErrorToast } from "@/utils";



export const App = () => {

  const setupHotTracking = () => {
    const hotTracking = document.createElement(HOT_TRACKING_HTML_TAG_NAME);
    // adding a css class to style the component in the `styles/index.css` file.
    hotTracking.classList.add("hot-matomo");
    // setting the other attributes.
    hotTracking.setAttribute("site-id", ENVS.MATOMO_ID);
    hotTracking.setAttribute("domain", ENVS.MATOMO_APP_DOMAIN);
    hotTracking.setAttribute("force", "true");
    document.body.appendChild(hotTracking);
  };
  useEffect(() => {
    if (document.getElementsByTagName(HOT_TRACKING_HTML_TAG_NAME).length > 0) return;
    setupHotTracking();
    return;
  }, []);

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
