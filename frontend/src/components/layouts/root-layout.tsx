import { NavBar } from "@/components/ui/navbar";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "@/components/ui/footer";
import { useEffect } from "react";
import { Banner } from "@/components/ui/banner";
import { APPLICATION_ROUTES } from "@/utils";

const RootLayout = () => {
  const { pathname } = useLocation();
  // Scroll to top on page switch.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <main className="min-h-screen relative  mx-auto flex flex-col justify-between">
      <Banner />
      <NavBar />
      <div
        // Disable global padding on landing page.
        // All other pages use the small padding except content pages.
        className={`${pathname === APPLICATION_ROUTES.HOMEPAGE ? '' : "small-padding"} w-full`}
      >
        <Outlet />
      </div>
      <Footer />
    </main>
  );
};

export default RootLayout;
