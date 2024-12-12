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
        // Disable the application padding on the landing page only.
        // This is because the padding in the landing page is different across sections.
        className={`${pathname !== APPLICATION_ROUTES.HOMEPAGE && "app-padding"} w-full`}
      >
        <Outlet />
      </div>
      <Footer />
    </main>
  );
};

export default RootLayout;
