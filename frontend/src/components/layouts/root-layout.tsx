import { CookieConsentBanner } from "@/components/ui/cookie-consent";
import { NavBar } from "@/components/ui/header"
import { Outlet } from 'react-router-dom';

const RootLayout = () => {
    return (
        <main className="min-h-screen relative">
            <NavBar />
            <Outlet />
            <CookieConsentBanner />
        </main>
    )
}

export default RootLayout