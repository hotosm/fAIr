import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { APPLICATION_ROUTES } from "@/constants";
import { BASE_API_URL, HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY, LOGIN_URL, HANKO_API_URL } from "@/config";
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
        // First, verify we have a valid Hanko session
        // This prevents redirect loops when user is not logged in at all
        const sessionResponse = await fetch(`${HANKO_API_URL}/sessions/validate`, {
          credentials: "include",
        });

        if (!sessionResponse.ok) {
          // No valid Hanko session - just go home, don't redirect to Login
          console.log("No valid Hanko session (HTTP error), returning to home");
          navigate(APPLICATION_ROUTES.HOMEPAGE);
          return;
        }

        const sessionData = await sessionResponse.json();
        if (sessionData.is_valid === false) {
          // Endpoint returns 200 with is_valid:false when no session
          console.log("No valid Hanko session (is_valid:false), returning to home");
          navigate(APPLICATION_ROUTES.HOMEPAGE);
          return;
        }

        // We have a valid Hanko session, now check app mapping
        const response = await fetch(`${BASE_API_URL}auth/me/`, {
          credentials: "include",
        });

        if (response.ok) {
          // User has mapping - success!
          showSuccessToast(TOAST_NOTIFICATIONS.loginSuccess);
          navigate(APPLICATION_ROUTES.HOMEPAGE);
          return;
        }

        // Has Hanko session but no app mapping - redirect to Login for onboarding
        const returnTo = encodeURIComponent(window.location.origin);
        window.location.href = `${LOGIN_URL}/app?onboarding=fair&return_to=${returnTo}`;
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
