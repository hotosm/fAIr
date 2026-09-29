import { useLocation } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-provider";
import { APPLICATION_ROUTES } from "@/constants";

const isUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

export function useNavbarState() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const isTryFair = isUnder(pathname, APPLICATION_ROUTES.TRY_FAIR);
  const isProfile = isUnder(pathname, APPLICATION_ROUTES.PROFILE_BASE);
  const isMapRequests = isUnder(pathname, APPLICATION_ROUTES.MAP_REQUEST_BASE);

  return {
    isAuthenticated,
    isTryFair,
    isProfile,
    isMapRequests,

    // use this approach to specify what shows where, if a new condition is to be added, you can add it here
    showBackButton: isMapRequests,
    showDashboardLink: isAuthenticated && isTryFair,
    showDesktopLinks: !isTryFair && !isProfile,
    showMobileLinks: !isTryFair,
    showMappingMode: isAuthenticated && isTryFair && !isMapRequests,
    showNotifications: isAuthenticated,
    showDownloadResult: isMapRequests,
  };
}