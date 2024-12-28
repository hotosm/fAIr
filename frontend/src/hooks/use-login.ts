import { useLocation } from "react-router-dom";
import { useSessionStorage } from "@/hooks/use-storage";
import { authService } from "@/services";
import { showErrorToast } from "@/utils";
import { useState } from "react";
import {
  TOAST_NOTIFICATIONS,
  HOT_FAIR_SESSION_REDIRECT_KEY,
} from "@/constants";
/**
 * Custom hook to handle the login button click event.
 *
 * This hook encapsulates the actions that need to be performed when the login button is clicked,
 * such as starting the OAuth login flow, handling the loading state, and showing error notifications.
 * It also stores the current page's path in session storage so that the user can be redirected back
 * after successful authentication.
 *
 * @returns {Object}
 * - `loading: boolean`: Indicates whether the login process is in progress.
 * - `handleLogin: () => Promise<void>`: Function to handle the login button click event, initiating the OAuth flow.
 *
 */
export const useLogin = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { setValue } = useSessionStorage();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setValue(HOT_FAIR_SESSION_REDIRECT_KEY, currentPath);
    try {
      await authService.initializeOAuthFlow();
    } catch (error) {
      showErrorToast(undefined, TOAST_NOTIFICATIONS.authenticationFailed);
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleLogin };
};
