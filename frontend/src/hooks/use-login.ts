import { useLocation } from "react-router-dom";
import { useSessionStorage } from "@/hooks/use-storage";
import { authService } from "@/services";
import { HOT_FAIR_SESSION_REDIRECT_KEY } from "@/utils";

/**
 * This hook is to be used to handle the login button click event. It encapsulate the actions that's necessary to be performed when the login button is clicked.
 * @returns Promise
 */
export const useLogin = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { setValue } = useSessionStorage();
  const handleLogin = async (): Promise<undefined> => {
    setValue(HOT_FAIR_SESSION_REDIRECT_KEY, currentPath);
    await authService.initializeOAuthFlow();
  };
  return handleLogin;
};
