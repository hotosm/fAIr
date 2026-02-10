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
import { AUTH_PROVIDER, BASE_API_URL, FRONTEND_URL, HANKO_URL } from "@/config";
import "@hotosm/tool-menu";
import { Divider } from "@/components/ui/divider";

// Import Hanko web component when using SSO
if (AUTH_PROVIDER === "hanko") {
  import("@hotosm/hanko-auth");
}

// Hanko auth component - defined outside NavBar to avoid re-creation on every render
// mapping-check-url silently verifies if user has app mapping
// If not, redirects to Login for onboarding
const HankoAuthComponent = () => (
  <hotosm-auth
    hanko-url={HANKO_URL}
    base-path={HANKO_URL}
    redirect-after-login={FRONTEND_URL}
    redirect-after-logout={FRONTEND_URL}
    mapping-check-url={`${BASE_API_URL}auth/status/`}
    app-id="fair"
    button-variant="filled"
    button-color="danger"
  />
);

export const NavBar = () => {
  const [open, setOpen] = useState(false);

  const { isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  return (
    <>
      <Drawer
        open={open}
        setOpen={setOpen}
        placement={DrawerPlacements.TOP}
        className={styles.navDrawer}
      >
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
          {isAuthenticated && <Divider />}

          {AUTH_PROVIDER === "hanko" ? (
            <>
              {isAuthenticated && (
                <UserProfile
                  isHanko
                  hideFullName
                  variant="list"
                  onNavigate={() => setOpen(false)}
                />
              )}
              <>
                {isAuthenticated && <Divider />}
                <HankoAuthComponent />
              </>
            </>
          ) : isAuthenticated ? (
            <UserProfile variant="list" onNavigate={() => setOpen(false)} />
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
      </Drawer>

      <nav
        className={`${styles.nav} app-padding z-20 py-1 border-b border-gray-border`}
      >
        <NavLogo />
        <div>
          <NavBarLinks className={styles.webNavLinks} />
        </div>
        <div className="hidden mdx:flex items-center gap-x-3">
          {AUTH_PROVIDER === "hanko" ? (
            <>
              {isAuthenticated && <UserNotifications />}
              {isAuthenticated && <UserProfile isHanko hideFullName />}
              <HankoAuthComponent />
            </>
          ) : isAuthenticated ? (
            <>
              {isAuthenticated && <UserNotifications />}
              <UserProfile />
            </>
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
          <hotosm-tool-menu></hotosm-tool-menu>
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
