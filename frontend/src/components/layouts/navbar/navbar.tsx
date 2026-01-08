import styles from "@/components/layouts/navbar/navbar.module.css";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements } from "@/enums";
import { HamburgerIcon } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { navLinks } from "@/constants/general";
import { NavLogo } from "@/components/layouts";
import { SHARED_CONTENT } from "@/constants";
import { useAuth } from "@/app/providers/auth-provider";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile } from "@/components/layouts";
import { useState } from "react";
import { UserNotifications } from "@/features/user-profile/components/notifications/user-notifications";
import {
  AUTH_PROVIDER,
  BASE_API_URL,
  FRONTEND_URL,
  HANKO_API_URL,
  LOGIN_URL,
} from "@/config";

// Import Hanko web component when using SSO
if (AUTH_PROVIDER === "hanko") {
  import("@AuthLibs/web-component/dist/hanko-auth.esm.js");
}

// Hanko auth component - defined outside NavBar to avoid re-creation on every render
// mapping-check-url silently verifies if user has app mapping
// If not, redirects to Login for onboarding
console.log("🔧 HankoAuthComponent config:", { FRONTEND_URL, BASE_API_URL, HANKO_API_URL });
const HankoAuthComponent = () => (
  <hotosm-auth
    hanko-url={HANKO_API_URL}
    base-path={LOGIN_URL}
    redirect-after-login={FRONTEND_URL}
    redirect-after-logout={FRONTEND_URL}
    mapping-check-url={`${BASE_API_URL}auth/status/`}
    app-id="fair"
  />
);

export const NavBar = () => {
  const [open, setOpen] = useState(false);

  const { isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

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
              <>
                {isAuthenticated && <UserProfile />}
                <HankoAuthComponent />
              </>
            ) : isAuthenticated ? (
              <UserProfile />
            ) : (
              <Button
                onClick={() => {
                  navigate(location, {
                    state: { backgroundLocation: location },
                  });
                }}
              >
                {SHARED_CONTENT.navbar.loginButton}
              </Button>
            )}
          </div>
        </div>
      </Drawer>

      <nav
        className={`${styles.nav} app-padding z-20 py-1 border-b border-gray-border`}
      >
        <NavLogo />
        <div>
          <NavBarLinks className={styles.webNavLinks} />
        </div>
        <div className="hidden mdx:block">
          {AUTH_PROVIDER === "hanko" ? (
            <div className={`${styles.profileContainer} `}>
              {isAuthenticated && <UserNotifications />}
              {isAuthenticated && <UserProfile />}
              <HankoAuthComponent />
            </div>
          ) : isAuthenticated ? (
            <div className={`${styles.profileContainer} `}>
              {/* Notification on the web */}
              {isAuthenticated && <UserNotifications />}
              <UserProfile />
            </div>
          ) : (
            <Button
              className={styles.loginButton}
              onClick={() => {
                navigate(location, {
                  state: { backgroundLocation: location },
                });
              }}
            >
              {SHARED_CONTENT.navbar.loginButton}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-x-2 mdx:hidden">
          {/* Notification bell on the small screens */}
          {isAuthenticated && <UserNotifications />}
          <button
            className={styles.hamburgerMenu}
            onClick={() => setOpen(true)}
          >
            <Image
              src={HamburgerIcon}
              alt={SHARED_CONTENT.navbar.hamburgerMenuAlt}
              title={SHARED_CONTENT.navbar.hamburgerMenuTitle}
              width="20px"
              height="20px"
            />
          </button>
        </div>
      </nav>
    </>
  );
};

type NavBarLinksProps = {
  className: string;
  setOpen?: (arg: boolean) => void;
};

const NavBarLinks: React.FC<NavBarLinksProps> = ({ className, setOpen }) => {
  const location = useLocation();

  return (
    <ul className={className}>
      {navLinks
        .filter((link) => link.active)
        .map((link, id) => (
          <li
            key={`navbar-item-${id}`}
            onClick={() => {
              //close the drawer after navigating to a new page on mobile
              setOpen && setOpen(false);
            }}
            className={`${styles.navLinkItem} ${location.pathname === link.href && styles.activeLink}`}
          >
            <Link href={link.href} title={link.title} nativeAnchor={false}>
              {link.title}
            </Link>
          </li>
        ))}
    </ul>
  );
};
