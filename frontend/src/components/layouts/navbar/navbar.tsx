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
import { DropDown } from "@/components/ui/dropdown";
import {
  AUTH_PROVIDER,
  BASE_API_URL,
  FRONTEND_URL,
  HANKO_URL,
  IS_DEV,
} from "@/config";
import "@hotosm/tool-menu";
import { Divider } from "@/components/ui/divider";

if (AUTH_PROVIDER === "hanko") {
  import("@hotosm/hanko-auth");
}

const HankoAuthComponent = ({ displayBar }: { displayBar?: boolean }) => (
  <hotosm-auth
    hanko-url={HANKO_URL}
    base-path={HANKO_URL}
    redirect-after-login={FRONTEND_URL}
    redirect-after-logout={FRONTEND_URL}
    mapping-check-url={`${BASE_API_URL}auth/status/`}
    app-id="fair"
    button-variant="filled"
    button-color="danger"
    display={displayBar ? "bar" : "default"}
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

          <div className={styles.loginButtonContainer}>
            {AUTH_PROVIDER === "hanko" && !IS_DEV ? (
              <>
                {isAuthenticated && (
                  <UserProfile
                    isHanko
                    hideFullName
                    variant="list"
                    onNavigate={() => setOpen(false)}
                    setOpen={setOpen}
                  />
                )}
                <>
                  <span
                    className={
                      isAuthenticated ? "border-t-2 w-full mt-2" : "pb-4 pl-4"
                    }
                  >
                    <HankoAuthComponent displayBar />
                  </span>
                </>
              </>
            ) : isAuthenticated ? (
              <UserProfile
                variant="list"
                onNavigate={() => setOpen(false)}
                setOpen={setOpen}
              />
            ) : (
              <Button
              rounded
                onClick={() => {
                  /*
                   * Set the `backgroundLocation` in location state so that when we open the authentication modal we still see the current page in the background.
                   */
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
        {/* <div className="hidden sm:flex">
          <NavBarLinks className={styles.webNavLinks} />
        </div> */}
        <div className="hidden sm:flex items-center gap-x-3">
          {AUTH_PROVIDER === "hanko" && !IS_DEV ? (
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
              rounded
              onClick={() => {
                /*
                 * Set the `backgroundLocation` in location state so that when we open the authentication modal we still see the current page in the background.
                 */
                navigate(location, {
                  state: { backgroundLocation: location },
                });
              }}
            >
              {SHARED_CONTENT.navbar.loginButton}
            </Button>
          )}
          {AUTH_PROVIDER === "hanko" && <hotosm-tool-menu></hotosm-tool-menu>}
        </div>
        <div className="flex items-center gap-x-2 sm:hidden">
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
  isMobile?: boolean;
};

const NavBarLinks: React.FC<NavBarLinksProps> = ({ className, setOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ul className={className}>
      {navLinks
        .filter((link) => link.href !== "")
        .filter((link) => link.active)
        .map((link, id) => {
          const isActive =
            location.pathname.includes(link.href) ||
            (link.children?.some((child) =>
              location.pathname.includes(child.href),
            ) ??
              false);

          return (
            <li
              key={`navbar-item-${id}`}
              onClick={() => {
                //close the drawer after navigating to a new page on mobile
                if (!link.children) {
                  setOpen && setOpen(false);
                }
              }}
              className={`${styles.navLinkItem} ${isActive && styles.activeLink} ${link.children ? "flex items-center" : ""}`}
            >
              {link.children ? (
                <DropDown
                  disableCheveronIcon={false}
                  distance={20}
                  triggerComponent={
                    <span className="cursor-pointer capitalize bg-transparent border-none p-0 font-inherit text-inherit  text-[length:var(--hot-fair-font-size-body-text-2base)] xl:text-[length:var(--hot-fair-font-size-body-text-2)]">
                      {link.title}
                    </span>
                  }
                  menuItems={link.children?.map((child) => ({
                    value: child.title,
                    name: child.title,
                    className: "!uppercase hover:bg-gray-50 !capitalize",
                    onClick: (e: any) => {
                      e?.stopPropagation();
                      navigate(child.href);
                      setOpen?.(false);
                    },
                  }))}
                />
              ) : (
                <Link
                  href={link.href}
                  title={link.title}
                  nativeAnchor={false}
                  className="capitalize"
                >
                  {link.title}
                </Link>
              )}
            </li>
          );
        })}
    </ul>
  );
};
