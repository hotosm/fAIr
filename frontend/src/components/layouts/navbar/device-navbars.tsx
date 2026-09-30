import styles from "@/components/layouts/navbar/navbar.module.css";
import { HankoAuthComponent } from "@/components/layouts/navbar/hanko-auth";
import { LoginButton } from "@/components/layouts/navbar/login-button";
import { UserProfile } from "@/components/layouts/navbar/user-profile";
import { AUTH_PROVIDER, IS_DEV } from "@/config";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import MappingMode from "@/features/try-fair/components/mapping-mode";
import { StartMappingNavlinks } from "@/features/try-fair/components/try-fair-nav-links";
import { UserNotifications } from "@/features/user-profile/components/notifications/user-notifications";
import { NavigateFunction } from "react-router-dom";
import { SolidButton } from "@/components/shared/solid-button";
import { DownloadResultButton } from "@/features/user-profile/components/map-requests/download-result-button";
import { APPLICATION_ROUTES } from "@/constants";
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
  isProfilePage,
  returnTo,
  navigate,
}: AuthSectionProps & { isProfilePage: boolean }) => {
  const showHankoBar = IS_HANKO_AUTH && !IS_DEV && !isTryFairPage;
  const isMapRequestsPage = location.pathname.includes(
    APPLICATION_ROUTES.MAP_REQUEST_BASE,
  );

  if (showHankoBar) {
    return (
      <>
        {isAuthenticated && <UserNotifications />}
        {isAuthenticated && (
          <SolidButton
            onClick={() => navigate(APPLICATION_ROUTES.PROFILE_BASE)}
            variant="dark"
          />
        )}
        <div className={styles.headerHankoAuth}>
          <HankoAuthComponent redirectAfterLogin={returnTo} />
        </div>
      </>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-x-2">
        {isTryFairPage && <StartMappingNavlinks />}
        {isProfilePage && <MappingMode />}
        {!isTryFairPage && !isMapRequestsPage && <UserNotifications />}
        {!isTryFairPage && !isProfilePage && !isMapRequestsPage && (
          <SolidButton
            onClick={() => navigate(APPLICATION_ROUTES.PROFILE_BASE)}
            variant="dark"
          >
            Dashboard{" "}
          </SolidButton>
        )}
        {isMapRequestsPage && <DownloadResultButton />}

        <div className={styles.headerHankoAuth}>
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
        <div className={styles.headerHankoAuth}>
          <HankoAuthComponent redirectAfterLogin={returnTo} />
        </div>
      )}
    </div>
  );
};
