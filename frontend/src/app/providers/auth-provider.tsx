import React, {
  createContext,
  useContext,
  useEffect,
  useState
  } from 'react';
import { apiClient } from '@/services/api-client';
import { authService } from '@/services';
import { showErrorToast, showSuccessToast } from '@/utils';
import { TUser } from '@/types/api';
import { useLocalStorage, useSessionStorage } from '@/hooks/use-storage';
import {
  TOAST_NOTIFICATIONS,
  HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY,
  HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY,
  HOT_FAIR_SESSION_REDIRECT_KEY,
} from "@/constants";

type TAuthContext = {
  token: string;
  user: TUser;
  authenticateUser: (state: string, code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

// @ts-expect-error bad type definition
const AuthContext = createContext<TAuthContext>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { getValue, setValue, removeValue } = useLocalStorage();
  const {
    getSessionValue,
    removeSessionValue,
    setSessionValue,
  } = useSessionStorage();

  const [token, setToken] = useState<string | undefined>(
    getValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY),
  );
  const [user, setUser] = useState<TUser | null>(null);

  // For use across the application.
  const isAuthenticated = user !== null && token !== undefined;

  // Set token globally to eliminate the need to rewrite it
  apiClient.defaults.headers.common["access-token"] = token ? `${token}` : null;


  const handleRedirection = () => {
    const redirectTo = getSessionValue(HOT_FAIR_SESSION_REDIRECT_KEY);
    if (redirectTo) {
      // remove it before redirecting.
      removeSessionValue(HOT_FAIR_SESSION_REDIRECT_KEY);
      // This is the last stage of the auth, we can assume that the login is successful, then store a reference
      // in the session storage.
      setSessionValue(HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY, "success");
      window.location.replace(redirectTo);
    }
  };

  // To show the login success after completing redirection if any.

  useEffect(() => {
    const loginSuccessful = getSessionValue(
      HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY,
    );
    if (loginSuccessful == "success") {
      showSuccessToast(TOAST_NOTIFICATIONS.loginSuccess);
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
      handleRedirection();
    } catch (error) {
      showErrorToast(error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);


  /**
   * Clean up and logout.
   */
  const logout = () => {
    setToken(undefined);
    setUser(null);
    removeValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY);
    showSuccessToast(TOAST_NOTIFICATIONS.logoutSuccess);
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
    } catch (error) {
      showErrorToast(error, TOAST_NOTIFICATIONS.authenticationFailed);
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
