import { NavigateFunction } from "react-router-dom";
import styles from "@/components/layouts/navbar/navbar.module.css";
import { HankoAuthComponent } from "@/components/layouts/navbar/hanko-auth";
import { AUTH_PROVIDER, HANKO_URL, IS_DEV } from "@/config";
import { MobileAccountMenu } from "@/components/layouts/navbar/mobile-account-menu";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { StartMappingNavlinks } from "@/features/try-fair/components/try-fair-nav-links";
// import { UserNotifications } from "@/features/user-profile/components/notifications/user-notifications";
import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { Button } from "@/components/ui/button";
import { ButtonVariant } from "@/enums";
import { useLocation } from "react-router-dom";
import { useNavbarState } from "./hooks/use-navbar-state";
import { DashboardLink } from "./dashboard-link";
const IS_HANKO_AUTH = AUTH_PROVIDER === "hanko";

if (IS_HANKO_AUTH) {
  import("@hotosm/hanko-auth");
}

type AuthSectionProps = {
  isAuthenticated: boolean;
  isTryFairPage: boolean;
  returnTo: string;
  navigate: NavigateFunction;
};

/**
 * Account part of the mobile menu: the user's account (avatar, email, My HOT
 * Account, Log Out) when signed in, otherwise a Login button.
 */
export const MobileAuthSection = ({
  isAuthenticated,
  returnTo,
  navigate,
  setOpen,
}: AuthSectionProps & { setOpen: (open: boolean) => void }) => {
  if (isAuthenticated) {
    return (
      <MobileAccountMenu
        returnTo={returnTo}
        onNavigate={() => setOpen(false)}
      />
    );
  }

  const login = () => {
    if (IS_HANKO_AUTH) {
      window.location.href = `${HANKO_URL}/app?return_to=${encodeURIComponent(returnTo)}`;
      return;
    }
    navigate(location, { state: { backgroundLocation: location } });
  };

  return (
    <Button
      variant={ButtonVariant.PRIMARY}
      size="large"
      rounded
      className="!w-60"
      onClick={login}
    >
      {SHARED_CONTENT.navbar.mobileLoginButton}
    </Button>
  );
};

export const DesktopAuthSection = ({
  isAuthenticated,
  isTryFairPage,
  returnTo,
}: AuthSectionProps) => {
  const { pathname } = useLocation();
  const { showDashboardLink } = useNavbarState();
  const dashboardButton =
    isAuthenticated &&
    (pathname === APPLICATION_ROUTES.HOMEPAGE ||
      pathname === APPLICATION_ROUTES.ABOUT ||
      pathname === `${APPLICATION_ROUTES.ABOUT}/` ||
      pathname === APPLICATION_ROUTES.LEARN_BASE ||
      pathname.startsWith(`${APPLICATION_ROUTES.LEARN_BASE}/`)) ? (
      <DashboardLink />
    ) : null;
  const showHankoBar = IS_HANKO_AUTH && !IS_DEV && !isTryFairPage;

  if (showHankoBar) {
    return (
      <>
        {/* {isAuthenticated && <UserNotifications />} */}
        {dashboardButton}
        <div
          className={`${styles.headerHankoAuth} ${isAuthenticated && isTryFairPage ? "border-l border-gray-border pl-3 ml-1 !w-auto" : ""}`}
        >
          <HankoAuthComponent redirectAfterLogin={returnTo} />
        </div>
      </>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-x-2">
        {isTryFairPage && <StartMappingNavlinks />}
        {/* {!isTryFairPage && !isMapRequestsPage && <UserNotifications />} */}
        {dashboardButton}

        <div
          className={`${styles.headerHankoAuth} flex items-center gap-x-2 ${isAuthenticated && isTryFairPage ? "border-l border-gray-border pl-3 ml-1 !w-auto" : ""}`}
        >
          {showDashboardLink && <DashboardLink />}

          <HankoAuthComponent redirectAfterLogin={returnTo} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center gap-x-2"
      id={
        isTryFairPage ? APP_TOUR_IDS.TRY_FAIR_START_MAPPING_BUTTON : undefined
      }
    >
      {isTryFairPage && <StartMappingNavlinks />}
      {!isTryFairPage && (
        <div
          className={`${styles.headerHankoAuth} ${isAuthenticated && isTryFairPage ? "border-l border-gray-border pl-3 ml-1 !w-auto" : ""}`}
        >
          <HankoAuthComponent redirectAfterLogin={returnTo} />
        </div>
      )}
    </div>
  );
};
