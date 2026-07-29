import styles from "@/components/layouts/navbar/navbar.module.css";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ButtonVariant, DrawerPlacements } from "@/enums";
import { HamburgerIcon } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { navLinks } from "@/constants/general";
import { NavLogo } from "@/components/layouts";
import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { APP_TOUR_IDS } from "@/constants/site-tour";
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
import { ToolTip } from "@/components/ui/tooltip";
import ExportMapResults from "@/features/try-fair/components/start-mapping/export-map-results";
import MappingMode from "@/features/try-fair/components/mapping-mode";
import { ShareProjectModal } from "@/features/try-fair/components/modals/share-project-modal";
import { StartMappingNavlinks } from "@/features/try-fair/components/try-fair-nav-links";

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
  const isTryFairPage = location.pathname.includes(APPLICATION_ROUTES.TRY_FAIR);
  const isHankoAuth = AUTH_PROVIDER === "hanko";
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
          {!isTryFairPage && (
            <div className={styles.navLinksContainer}>
              <NavBarLinks
                className={styles.mobileNavLinks}
                setOpen={setOpen}
              />
            </div>
          )}
          {isAuthenticated && <Divider />}

          <div className={styles.loginButtonContainer}>
            {isHankoAuth && !IS_DEV && !isTryFairPage ? (
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
                isHanko={isHankoAuth}
                hideFullName={isHankoAuth}
                variant="list"
                onNavigate={() => setOpen(false)}
                setOpen={setOpen}
              />
            ) : (
              <div className="relative pb-4 pl-4">
                <ToolTip
                  content={
                    isTryFairPage
                      ? "Sign in to access full mapping tools and features"
                      : undefined
                  }
                >
                  <Button
                    rounded={isTryFairPage}
                    size={isTryFairPage ? "medium" : "large"}
                    variant={
                      isTryFairPage
                        ? ButtonVariant.TERTIARY
                        : ButtonVariant.PRIMARY
                    }
                    onClick={() => {
                      /*
                       * Set the `backgroundLocation` in location state so that when we open the authentication modal we still see the current page in the background.
                       */
                      navigate(location, {
                        state: { backgroundLocation: location },
                      });
                    }}
                  >
                    {isTryFairPage
                      ? `${SHARED_CONTENT.homepage.ctaSecondaryButton}`
                      : SHARED_CONTENT.navbar.loginButton}
                  </Button>
                </ToolTip>
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <nav
        className={`${styles.nav} app-padding z-20 py-1 border-b border-gray-border`}
      >
        <div className="flex-1 flex items-center justify-start">
          <NavLogo />
        </div>

        <div className="flex-1 hidden sm:flex items-center justify-center">
          {!isTryFairPage && <NavBarLinks className={styles.webNavLinks} />}
          {isTryFairPage && isAuthenticated && <MappingMode />}
        </div>

        <div className="flex-1 hidden sm:flex items-center justify-end gap-x-3">
          {isHankoAuth && !IS_DEV && !isTryFairPage ? (
            <>
              {isAuthenticated && <UserNotifications />}
              {isAuthenticated && <UserProfile isHanko hideFullName />}
              <HankoAuthComponent />
            </>
          ) : isAuthenticated ? (
            <>
              {isTryFairPage && <StartMappingNavlinks />}

              {!isTryFairPage && <UserNotifications />}

              {isTryFairPage && <ExportMapResults />}

              <UserProfile />
            </>
          ) : (
            <div
              className="relative"
              id={
                isTryFairPage
                  ? APP_TOUR_IDS.TRY_FAIR_START_MAPPING_BUTTON
                  : undefined
              }
            >
              <ToolTip
                content={
                  isTryFairPage
                    ? "Sign in to access full mapping tools and features"
                    : undefined
                }
              >
                <Button
                  className={styles.loginButton}
                  variant={
                    isTryFairPage
                      ? ButtonVariant.TERTIARY
                      : ButtonVariant.PRIMARY
                  }
                  size={isTryFairPage ? "medium" : "large"}
                  rounded={isTryFairPage}
                  onClick={() => {
                    /*
                     * Set the `backgroundLocation` in location state so that when we open the authentication modal we still see the current page in the background.
                     */
                    navigate(location, {
                      state: { backgroundLocation: location },
                    });
                  }}
                >
                  {isTryFairPage
                    ? `${SHARED_CONTENT.homepage.ctaSecondaryButton}`
                    : SHARED_CONTENT.navbar.loginButton}
                </Button>
              </ToolTip>
            </div>
          )}
          {isHankoAuth && <hotosm-tool-menu></hotosm-tool-menu>}
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
      <ShareProjectModal />
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
