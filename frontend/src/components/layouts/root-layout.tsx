import { NavBar } from "@/components/ui/navbar";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "@/components/ui/footer";
import { useEffect } from "react";
import { Banner } from "@/components/ui/banner";
import { APPLICATION_ROUTES } from "@/utils";
import { useScrollToTop } from "@/hooks/use-scroll-to-element";

const RootLayout = () => {
  const { pathname } = useLocation();
  const { scrollToTop } = useScrollToTop();
  // Scroll to top on pages switch.
  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return (
    <main className="min-h-screen relative  mx-auto flex flex-col justify-between">
      <Banner />
      {!pathname.includes(APPLICATION_ROUTES.START_MAPPING_BASE) && <NavBar />}

      <div
        // Disable global padding on landing page.
        className={`${pathname === APPLICATION_ROUTES.HOMEPAGE ? "" : "app-padding"} w-full`}
      >
        <Outlet />
      </div>
      <Footer />
    </main>
  );
};

export default RootLayout;
