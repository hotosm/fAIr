
import { NavBar } from "@/components/ui/header";
import { Outlet } from 'react-router-dom';
import { ENVS } from "@/config/env";


import '@hotosm/ui/dist/style.css';
import '@hotosm/ui/dist/hotosm-ui.js';

const RootLayout = () => {
    return (
        <main className="min-h-screen relative">
            <NavBar />
            <Outlet />
            <div className="fixed bottom-0 z-[10000]">
                {/* @ts-ignore  */}
                <hot-tracking site-id={ENVS.MATOMO_ID} domain={ENVS.MATOMO_APP_DOMAIN} force></hot-tracking>
            </div>
        </main>
    )
}

export default RootLayout;
