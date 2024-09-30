import { useLocation } from "react-router-dom";
import { useSessionStorage } from "@/hooks/use-storage";
import { authService } from "@/services";
import { HOT_FAIR_SESSION_REDIRECT_KEY } from "@/utils";
import { useState } from "react";
import { useAlert } from "@/app/providers/alert-provider";

/**
 * This hook is to be used to handle the login button click event. It encapsulate the actions that's necessary to be performed when the login button is clicked.
 * @returns Promise
 */
export const useLogin = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { setValue } = useSessionStorage();
  const [loading, setLoading] = useState(false);
  const { setAlert } = useAlert();

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setValue(HOT_FAIR_SESSION_REDIRECT_KEY, currentPath);
    try {
      await authService.initializeOAuthFlow();
    } catch (error) {
      setAlert("Login failed")
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleLogin };
};
