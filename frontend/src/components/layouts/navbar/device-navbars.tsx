import { NavigateFunction } from "react-router-dom";
import styles from "@/components/layouts/navbar/navbar.module.css";
import { HankoAuthComponent } from "@/components/layouts/navbar/hanko-auth";
import { LoginButton } from "@/components/layouts/navbar/login-button";
import { UserProfile } from "@/components/layouts/navbar/user-profile";
import { AUTH_PROVIDER, IS_DEV } from "@/config";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { StartMappingNavlinks } from "@/features/try-fair/components/try-fair-nav-links";
import { UserNotifications } from "@/features/user-profile/components/notifications/user-notifications";
import { DownloadResultButton } from "@/features/user-profile/components/map-requests/download-result-button";
import { APPLICATION_ROUTES } from "@/constants";
import { SolidButton } from "@/components/shared/solid-button";
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

export const MobileAuthSection = ({
  isAuthenticated,
  isTryFairPage,
  returnTo,
  navigate,
  setOpen,
}: AuthSectionProps & { setOpen: (open: boolean) => void }) => {
  const showHankoBar = IS_HANKO_AUTH && !IS_DEV && !isTryFairPage;

  if (showHankoBar) {
    return (
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

        <span
          className={isAuthenticated ? "border-t-2 w-full mt-2" : "pb-4 pl-4"}
        >
          <HankoAuthComponent displayBar redirectAfterLogin={returnTo} />
        </span>
      </>
    );
  }

  if (isAuthenticated) {
    return (
      <UserProfile
        isHanko={IS_HANKO_AUTH}
        hideFullName={IS_HANKO_AUTH}
        variant="list"
        onNavigate={() => setOpen(false)}
        setOpen={setOpen}
      />
    );
  }

  return (
    <div className="relative pb-4 pl-4">
      <LoginButton
        isTryFairPage={isTryFairPage}
        onClick={() =>
          navigate(location, { state: { backgroundLocation: location } })
        }
      />
    </div>
  );
};

export const DesktopAuthSection = ({
  isAuthenticated,
  isTryFairPage,
  returnTo,
  navigate,
}: AuthSectionProps) => {
  const { pathname } = useLocation();
  const {
    isMapRequests: isMapRequestsPage,
    showDownloadResult,
    showDashboardLink,
  } = useNavbarState();
  const dashboardButton =
    isAuthenticated && pathname === APPLICATION_ROUTES.HOMEPAGE ? (
      <SolidButton
        onClick={() => navigate(APPLICATION_ROUTES.PROFILE_BASE)}
        variant="dark"
      >
        Dashboard
      </SolidButton>
    ) : null;
  const showHankoBar = IS_HANKO_AUTH && !IS_DEV && !isTryFairPage;

  if (showHankoBar) {
    return (
      <>
        {isAuthenticated && <UserNotifications />}
        {dashboardButton}
        {showDownloadResult && <DownloadResultButton />}
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
        {!isTryFairPage && !isMapRequestsPage && <UserNotifications />}
        {dashboardButton}
        {showDownloadResult && <DownloadResultButton />}

        {showDashboardLink && <DashboardLink />}
        <div
          className={`${styles.headerHankoAuth} ${isAuthenticated && isTryFairPage ? "border-l border-gray-border pl-3 ml-1 !w-auto" : ""}`}
        >
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
