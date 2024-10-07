import { useLocation } from "react-router-dom";
import { useSessionStorage } from "@/hooks/use-storage";
import { authService } from "@/services";
import { APP_CONTENT, HOT_FAIR_SESSION_REDIRECT_KEY } from "@/utils";
import { useState } from "react";
import { useToast } from "@/app/providers/toast-provider";

/**
 * This hook is to be used to handle the login button click event. It encapsulate the actions that's necessary to be performed when the login button is clicked.
 * @returns Promise
 */
export const useLogin = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { setValue } = useSessionStorage();
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setValue(HOT_FAIR_SESSION_REDIRECT_KEY, currentPath);
    try {
      await authService.initializeOAuthFlow();
    } catch (error) {
      notify(APP_CONTENT.toasts.authenticationFailed, 'danger');
      console.error('An error occured while authenticating', error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleLogin };
};
