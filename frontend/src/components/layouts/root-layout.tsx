import { APPLICATION_ROUTES, MODELS_ROUTES } from "@/constants";
import { Banner } from "@/components/ui/banner";
import { Footer } from "@/components/layouts";
import { HotTracking } from "@/components/shared";
import { NavBar } from "@/components/layouts";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useScrollToTop } from "@/hooks/use-scroll-to-element";
import { useAuth } from "@/app/providers/auth-provider";
import { AuthenticationModal } from "@/components/auth";
import {
  BANNER_TIMEOUT_DURATION,
} from "@/config";

export const RootLayout = () => {
  const { pathname, state } = useLocation();
  const { scrollToTop } = useScrollToTop();

  /**
   * Scroll to top on pages switch.
   */
  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  const { isAuthenticated } = useAuth();

  const [showBanner, setShowBanner] = useState<boolean>(false);

  /**
   * Show the banner after 3 seconds.
   */
  useEffect(() => {
    const bannerTimer = setTimeout(() => {
      setShowBanner(true);
    }, BANNER_TIMEOUT_DURATION);

    return () => clearTimeout(bannerTimer);
  }, []);

  /**
   * Get the model id from the URL. If it exists,
   * we can safely assume the user is in edit mode.
   * Therefore, we can disable the footer.
   */
  const { modelId } = useParams();



  return (
    <>
      <HotTracking />

      {/* Show the auth modal when a `backgroundLocation` is set and when the user is not authenticated. */}
      <AuthenticationModal
        isOpen={state?.backgroundLocation && !isAuthenticated}
      />
      <main className="min-h-screen relative flex flex-col">
        {!pathname.includes(APPLICATION_ROUTES.AUTH_CALLBACK) &&
          !pathname.includes(APPLICATION_ROUTES.EMAIL_VERIFICATION_CALLBACK) &&
          !pathname.includes(APPLICATION_ROUTES.START_MAPPING_BASE) &&
          !pathname.includes(MODELS_ROUTES.CREATE_MODEL_BASE) &&
          !modelId && <>{showBanner && <Banner />}</>}

        {!pathname.includes(APPLICATION_ROUTES.AUTH_CALLBACK) &&
          !pathname.includes(APPLICATION_ROUTES.EMAIL_VERIFICATION_CALLBACK) &&
          !pathname.includes(APPLICATION_ROUTES.START_MAPPING_BASE) && (
            <>
              <NavBar />
            </>
          )}

        <div
          // Disable global padding on landing page.
          className={`flex-1 mx-auto w-full ${pathname === APPLICATION_ROUTES.HOMEPAGE ? "" : "app-padding"} ${pathname.includes(MODELS_ROUTES.CREATE_MODEL_BASE) || modelId ? "bg-frosted-blue" : ""}`}
        >
          <Outlet />
        </div>
        {!pathname.includes(APPLICATION_ROUTES.START_MAPPING_BASE) &&
          !pathname.includes(MODELS_ROUTES.CREATE_MODEL_BASE) &&
          !modelId &&
          !pathname.includes(APPLICATION_ROUTES.AUTH_CALLBACK) &&
          !pathname.includes(
            APPLICATION_ROUTES.EMAIL_VERIFICATION_CALLBACK,
          ) && <Footer />}
      </main>
    </>
  );
};
