import { useLocalStorage, useSessionStorage } from "@/hooks/use-storage";
import { authService } from "@/services";
import { apiClient } from "@/services/api-client";
import { TUser } from "@/types/api";
import {
  HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY,
  HOT_FAIR_SESSION_REDIRECT_KEY,
} from "@/utils";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

type TAuthContext = {
  token: string | undefined;
  user: TUser | null;
  authenticateUser: (state: string, code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

// @ts-expect-error No need to initialize with empty object, so supressing the warning.
const AuthContext = createContext<TAuthContext>(null);

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { getValue, setValue, removeValue } = useLocalStorage();
  const { getValue: getSessionValue, removeValue: removeSessionValue } =
    useSessionStorage();

  const [token, setToken] = useState<string | undefined>(
    getValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY),
  );
  const [user, setUser] = useState<TUser | null>(null);

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
      console.info(redirectTo, "redirecting...");
      window.location.replace(redirectTo);
    }
  };

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
      console.error("Authentication failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ token, user, authenticateUser, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};
