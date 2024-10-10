import { NavBar } from "@/components/ui/header";
import { Outlet } from "react-router-dom";
import { Footer } from "@/components/ui/footer";


const RootLayout = () => {

  return (
    <main className="min-h-screen relative max-w-[1800px] mx-auto" >
      <NavBar />
      <div className="px-[1.25rem] lg:px-[5rem]" >
        <Outlet />
      </div>
      <Footer />
    </main>
  );
};

export default RootLayout;
