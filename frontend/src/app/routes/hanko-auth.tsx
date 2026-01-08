import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { APPLICATION_ROUTES } from "@/constants";
import { BASE_API_URL, HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY, LOGIN_URL } from "@/config";
import { showErrorToast, showSuccessToast } from "@/utils";
import { TOAST_NOTIFICATIONS } from "@/constants";
import { Spinner } from "@/components/ui/spinner";

/**
 * HankoAuth - Callback component after Hanko SSO login
 *
 * Flow:
 * 1. User clicks login -> redirects to Login (login.hotosm.org)
 * 2. Login handles Hanko authentication and sets JWT cookie
 * 3. Login redirects back to this component (/hanko-auth)
 * 4. This component first verifies Hanko session exists
 * 5. Then calls /auth/me/:
 *    - If OK -> user has mapping, navigate home
 *    - If 401/403 -> needs onboarding, redirect to Login with ?onboarding=fair
 * 6. Login asks "Did you have an account?" and redirects to /auth/onboarding/
 */
const HankoAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const completeAuth = async () => {
      // Clear any stale data
      localStorage.removeItem(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY);
      queryClient.clear();

      try {
        // Quick check: if no hanko cookie, just go home (no network request needed)
        // The web component already verified the session before redirecting here
        const hasHankoCookie = document.cookie.includes("hanko=");
        if (!hasHankoCookie) {
          console.log("No hanko cookie found, returning to home");
          navigate(APPLICATION_ROUTES.HOMEPAGE);
          return;
        }

        // Check app mapping - this is the main purpose of this callback
        const response = await fetch(`${BASE_API_URL}auth/me/`, {
          credentials: "include",
        });

        if (response.ok) {
          // User has mapping - success!
          showSuccessToast(TOAST_NOTIFICATIONS.loginSuccess);
          navigate(APPLICATION_ROUTES.HOMEPAGE);
          return;
        }

        if (response.status === 401 || response.status === 403) {
          // Has Hanko session but no app mapping - redirect to Login for onboarding
          const returnTo = encodeURIComponent(window.location.origin);
          window.location.href = `${LOGIN_URL}/app?onboarding=fair&return_to=${returnTo}`;
          return;
        }

        // Unexpected error - go home
        console.log("Unexpected response from /auth/me/:", response.status);
        navigate(APPLICATION_ROUTES.HOMEPAGE);
      } catch (error) {
        console.error("Hanko auth error:", error);
        showErrorToast(
          error instanceof Error ? error.message : "Authentication failed",
        );
        setTimeout(() => {
          navigate(APPLICATION_ROUTES.HOMEPAGE);
        }, 3000);
      }
    };

    completeAuth();
  }, [navigate, queryClient]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-body-2">Completing authentication...</p>
      </div>
    </div>
  );
};

export default HankoAuth;
