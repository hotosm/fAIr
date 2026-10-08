import styles from "@/components/layouts/navbar/navbar.module.css";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements } from "@/enums";
import { HamburgerIcon } from "@/assets/svgs";
import { Image } from "@/components/ui/image";
import { DashboardLink } from "./dashboard-link";
import { NavLogo } from "@/components/layouts";
import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { useAuth } from "@/app/providers/auth-provider";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
// import { UserNotifications } from "@/features/user-profile/components/notifications/user-notifications";
import { AUTH_PROVIDER, FRONTEND_URL } from "@/config";
import "@hotosm/ui/dist/components/tool-menu/tool-menu.js";
import { Divider } from "@/components/ui/divider";
import MappingMode from "@/features/try-fair/components/mapping-mode";
import { ShareProjectModal } from "@/features/try-fair/components/modals/share-project-modal";
import { NavBarLinks } from "@/components/layouts/navbar/navbar-links";
import {
  MobileAuthSection,
  DesktopAuthSection,
} from "@/components/layouts/navbar/device-navbars";
import { BackButton } from "@/components/ui/button";
import { DownloadResultButton } from "@/features/user-profile/components/map-requests/download-result-button";
import { useNavbarState } from "@/components/layouts/navbar/hooks/use-navbar-state";

const IS_HANKO_AUTH = AUTH_PROVIDER === "hanko";

if (IS_HANKO_AUTH) {
  import("@hotosm/hanko-auth");
}

export const NavBar = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    showBackButton,
    showDownloadResult,
    showMappingMode,
    showDashboardLink,
  } = useNavbarState();

  const isTryFairPage = location.pathname.includes(APPLICATION_ROUTES.TRY_FAIR);
  const isProfilePage = location.pathname.includes(
    APPLICATION_ROUTES.PROFILE_BASE,
  );
  const returnTo = `${FRONTEND_URL}${location.pathname}${location.search}${location.hash}`;

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

          {showMappingMode && <MappingMode tourTarget={false} />}

          <div className={styles.loginButtonContainer}>
            <MobileAuthSection
              isAuthenticated={isAuthenticated}
              isTryFairPage={isTryFairPage}
              returnTo={returnTo}
              navigate={navigate}
              setOpen={setOpen}
            />
          </div>
        </div>
      </Drawer>

      <nav
        className={`${styles.nav} app-padding z-20 py-1 border-b border-gray-border`}
      >
        <div className="flex-1 flex gap-4 items-center justify-start">
          {showBackButton ? <BackButton /> : <NavLogo />}
        </div>

        <div className="flex-1 hidden sm:flex items-center justify-center">
          {!isTryFairPage && !isProfilePage && (
            <NavBarLinks className={styles.webNavLinks} />
          )}
        </div>

        <div className="flex-1 hidden sm:flex items-center justify-end gap-x-3">
          {showMappingMode && <MappingMode />}
          <DesktopAuthSection
            isAuthenticated={isAuthenticated}
            isTryFairPage={isTryFairPage}
            returnTo={returnTo}
            navigate={navigate}
          />
          {IS_HANKO_AUTH && <hotosm-tool-menu></hotosm-tool-menu>}
        </div>

        <div className="flex items-center gap-x-2 sm:hidden">
          {showDashboardLink && <DashboardLink />}
          {/* {isAuthenticated && <UserNotifications />} */}
          {showDownloadResult && <DownloadResultButton />}

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
