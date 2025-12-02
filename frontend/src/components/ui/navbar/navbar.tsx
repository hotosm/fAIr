import styles from "@/components/layouts/navbar/navbar.module.css";
import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements } from "@/enums";
import { HamburgerIcon } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { NavLogo } from "@/components/layouts";
import { useAuth } from "@/app/providers/auth-provider";
import { useLocation } from "react-router-dom";
import { useLogin } from "@/hooks/use-login";
import { UserProfile } from "@/components/layouts";
import { useState } from "react";
import {
  AUTH_PROVIDER,
  HANKO_API_URL,
  LOGIN_URL,
  FRONTEND_URL,
} from "@/config";

// Import Hanko web component when using SSO
if (AUTH_PROVIDER === "hanko") {
  import("../../../../auth-libs/web-component/dist/hanko-auth.esm.js");
}

export const NavBar = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { handleLogin, loading } = useLogin();

  // Build return URL for Hanko SSO callback
  const hankoReturnUrl = `${FRONTEND_URL}${APPLICATION_ROUTES.HANKO_AUTH_CALLBACK}`;

  // Legacy login button component
  const LegacyLoginButton = ({ className }: { className?: string }) => (
    <Button className={className} onClick={handleLogin} spinner={loading}>
      {loading
        ? SHARED_CONTENT.loginButtonLoading
        : SHARED_CONTENT.navbar.loginButton}
    </Button>
  );

  // Hanko auth component with session verification
  // verify-session ensures users coming from other apps are redirected to /hanko-auth
  // to verify their mapping, triggering onboarding if needed
  const HankoAuthComponent = () => (
    <hotosm-auth
      hanko-url={HANKO_API_URL}
      base-path={LOGIN_URL}
      redirect-after-login={hankoReturnUrl}
      redirect-after-logout="/"
      verify-session
    />
  );

  return (
    <>
      <Drawer open={open} setOpen={setOpen} placement={DrawerPlacements.END}>
        <div className={styles.drawerContentContainer}>
          <div className={styles.drawerHeaderContainer}>
            <NavLogo />
            <button
              onClick={() => setOpen(false)}
              className={styles.closeButton}
            >
              &#x2715;
            </button>
          </div>
          <div className={styles.navLinksContainer}>
            <NavBarLinks className={styles.mobileNavLinks} setOpen={setOpen} />
          </div>
          <div className={styles.loginButtonContainer}>
            {AUTH_PROVIDER === "hanko" ? (
              <HankoAuthComponent />
            ) : isAuthenticated ? (
              <UserProfile />
            ) : (
              <LegacyLoginButton />
            )}
          </div>
        </div>
      </Drawer>
      <nav className={`${styles.nav} app-padding`}>
        <NavLogo />
        <div>
          <NavBarLinks className={styles.webNavLinks} />
        </div>
        <div>
          {AUTH_PROVIDER === "hanko" ? (
            <HankoAuthComponent />
          ) : isAuthenticated ? (
            <div className={styles.profileContainer}>
              <UserProfile />
            </div>
          ) : (
            <LegacyLoginButton className={styles.loginButton} />
          )}
        </div>
        <button className={styles.hamburgerMenu} onClick={() => setOpen(true)}>
          <Image
            src={HamburgerIcon}
            alt={SHARED_CONTENT.navbar.hamburgerMenuAlt}
            title={SHARED_CONTENT.navbar.hamburgerMenuTitle}
            width="20px"
            height="20px"
          />
        </button>
      </nav>
    </>
  );
};

type TNavBarLinks = {
  title: string;
  href: string;
}[];

const navLinks: TNavBarLinks = [
  {
    title: SHARED_CONTENT.navbar.routes.exploreModels,
    href: APPLICATION_ROUTES.MODELS,
  },
  {
    title: SHARED_CONTENT.navbar.routes.learn,
    href: APPLICATION_ROUTES.LEARN,
  },
  {
    title: SHARED_CONTENT.navbar.routes.about,
    href: APPLICATION_ROUTES.ABOUT,
  },
  {
    title: SHARED_CONTENT.navbar.routes.resources,
    href: APPLICATION_ROUTES.RESOURCES,
  },
];

type NavBarLinksProps = {
  className: string;
  setOpen?: (arg: boolean) => void;
};

const NavBarLinks: React.FC<NavBarLinksProps> = ({ className, setOpen }) => {
  const location = useLocation();

  return (
    <ul className={className}>
      {navLinks.map((link, id) => (
        <li
          key={`navbar-item-${id}`}
          onClick={() => {
            //close the drawer after navigating to a new page on mobile
            setOpen && setOpen(false);
          }}
          className={`${styles.navLinkItem} ${location.pathname.includes(link.href) && styles.activeLink}`}
        >
          <Link href={link.href} title={link.title} nativeAnchor={false}>
            {link.title}
          </Link>
        </li>
      ))}
    </ul>
  );
};
