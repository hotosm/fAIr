import { NavBar } from "@/components/ui/header";
import { Outlet } from "react-router-dom";
import { ENVS } from "@/config/env";
import Alert from "@/components/ui/alert/alert";
import { useAlert } from "@/app/providers/alert-provider";

const RootLayout = () => {
  const { alert } = useAlert()
  return (
    <main className="min-h-screen relative">
      {
        alert && <Alert message={alert} />
      }
      <NavBar />
      <Outlet />
      <div className="fixed bottom-0 z-[10000]">
        {/* @ts-expect-error 
         The hot-tracking component from the @hotosm/ui */}
        <hot-tracking
          site-id={ENVS.MATOMO_ID}
          domain={ENVS.MATOMO_APP_DOMAIN}
          force
        ></hot-tracking>
      </div>
    </main>
  );
};

export default RootLayout;
