import { useLocalStorage, useSessionStorage } from "@/hooks/use-storage";
import { authService } from "@/services";
import { apiClient } from "@/services/api-client";
import { TUser } from "@/types/api";
import {
  APP_CONTENT,
  HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY,
  HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY,
  HOT_FAIR_SESSION_REDIRECT_KEY,
} from "@/utils";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useToastNotification } from "@/hooks/use-toast-notification";

type TAuthContext = {
  token: string;
  user: TUser;
  authenticateUser: (state: string, code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

// @ts-expect-error bad type definition
const AuthContext = createContext<TAuthContext>(null);

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { getValue, setValue, removeValue } = useLocalStorage();
  const {
    getValue: getSessionValue,
    removeValue: removeSessionValue,
    setValue: setSessionValue,
  } = useSessionStorage();

  const [token, setToken] = useState<string | undefined>(
    getValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY),
  );
  const [user, setUser] = useState<TUser | null>(null);

  const toast = useToastNotification();
  // For use across the application.

  const isAuthenticated = useMemo(() => {
    return user !== null && token !== undefined;
  }, [token, user]);

  //set token globally to eliminate the need to rewrite it
  apiClient.defaults.headers.common["access-token"] = token ? `${token}` : null;

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const handleRedirection = () => {
    const redirectTo = getSessionValue(HOT_FAIR_SESSION_REDIRECT_KEY);
    if (redirectTo) {
      // remove it before redirecting.
      removeSessionValue(HOT_FAIR_SESSION_REDIRECT_KEY);
      // this this is the last stage of the auth, we can assume that the login is successful, then store a reference
      // in the session storage.
      setSessionValue(HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY, "success");
      window.location.replace(redirectTo);
    }
  };

  //To show the login success after completing redirection if any.

  useEffect(() => {
    const loginSuccessful = getSessionValue(
      HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY,
    );
    if (loginSuccessful == "success") {
      toast(APP_CONTENT.toasts.loginSuccess, "success");
      removeSessionValue(HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY);
    }
  }, []);

  // Proceed with the oauth flow when the state and code are in the url params.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state && user === null) {
      authenticateUser(state, code);
    }
  }, [user]);

  /**
   * Retrieve the user profile information from the backend.
   * @param token The access token stored in local storage.
   */
  const fetchUserProfile = async () => {
    try {
      const user = await authService.getUser();
      setUser(user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  /**
   * Clean up and logout.
   */
  const logout = () => {
    setToken(undefined);
    setUser(null);
    removeValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY);
    toast(APP_CONTENT.toasts.logoutSuccess, "success");
  };

  /**
   * Complete the oauth flow by exchanging code, and state tokens for access token from the backend.
   * @param state The state token from OSM.
   * @param code  The code token from OSM.
   */
  const authenticateUser = async (state: string, code: string) => {
    try {
      const data = await authService.authenticate(state, code);
      setValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      fetchUserProfile();
      handleRedirection();
    } catch (error) {
      toast(APP_CONTENT.toasts.authenticationFailed, "danger");
      console.error("Authentication failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      // @ts-expect-error bad type definition
      value={{ token, user, authenticateUser, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};
