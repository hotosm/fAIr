import { APPLICATION_ROUTES } from "@/constants";
import { Banner } from "@/components/ui/banner";
import { Footer } from "@/components/layout";
import { HotTracking } from "@/components/shared";
import { NavBar } from "@/components/layout";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useScrollToTop } from "@/hooks/use-scroll-to-element";
import { useAuth } from "@/app/providers/auth-provider";
import { AuthenticationModal } from "@/components/auth";

export const RootLayout = () => {
  const { pathname, state } = useLocation();
  const { scrollToTop } = useScrollToTop();
  const [showTracker, setShowTracker] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  /**
   * Delay for like 5 seconds before showing the tracking component.
   */
  useEffect(() => {
    /**
     * Tracking component can show only on these public pages.
     * It can only show up on these pages, and when it shows up, it won't close until the user choose an action, even if they navigate to other routes.
     * However, if the user navigates to a route not listed here, it won't show up.
     */
    const canShowTracker = [
      APPLICATION_ROUTES.LEARN,
      APPLICATION_ROUTES.MODELS,
      APPLICATION_ROUTES.RESOURCES,
      APPLICATION_ROUTES.HOMEPAGE,
    ];

    const timer = setTimeout(() => {
      if (canShowTracker.some((route) => pathname === route)) {
        setShowTracker(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [pathname]);

  /**
   * Scroll to top on pages switch.
   */
  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return (
    <>
      {showTracker && <HotTracking />}
      {/* Show the auth modal when a `backgroundLocation` is set and when the user is not authenticated. */}
      <AuthenticationModal
        isOpen={state?.backgroundLocation && !isAuthenticated}
      />
      <main className="min-h-screen relative mx-auto flex flex-col justify-between">
        {!pathname.includes(APPLICATION_ROUTES.AUTH_CALLBACK) &&
          !pathname.includes(APPLICATION_ROUTES.START_MAPPING_BASE) && (
            <>
              <Banner />
              <NavBar />
            </>
          )}
        <div
          // Disable global padding on landing page.
          className={`${pathname === APPLICATION_ROUTES.HOMEPAGE ? "" : "app-padding"} w-full`}
        >
          <Outlet />
        </div>
        {!pathname.includes(APPLICATION_ROUTES.START_MAPPING_BASE) &&
          !pathname.includes(APPLICATION_ROUTES.AUTH_CALLBACK) && <Footer />}
      </main>
    </>
  );
};
