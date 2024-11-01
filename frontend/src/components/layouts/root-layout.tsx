import { NavBar } from "@/components/ui/header";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "@/components/ui/footer";
import { useEffect } from "react";

const RootLayout = () => {
  const { pathname } = useLocation();
  // Scroll to top on page switch.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <main className="min-h-screen relative max-w-[1800px] mx-auto flex flex-col justify-between">
      <NavBar />
      <div className="px-[1.25rem] lg:px-[5rem] w-full">
        <Outlet />
      </div>
      <Footer />
    </main>
  );
};

export default RootLayout;
