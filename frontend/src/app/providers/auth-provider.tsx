import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/services/api-client";
import { authService } from "@/services";
import {
  AUTH_PROVIDER,
  BASE_API_URL,
  HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY,
  HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY,
  HOT_FAIR_SESSION_REDIRECT_KEY,
} from "@/config";
import { showErrorToast, showSuccessToast } from "@/utils";
import { TUser } from "@/types/api";
import { useLocalStorage, useSessionStorage } from "@/hooks/use-storage";
import { APPLICATION_ROUTES, TOAST_NOTIFICATIONS } from "@/constants";

type TAuthContext = {
  token: string;
  user: TUser;
  authenticateUser: (state: string, code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  setUser: (user: TUser) => void;
};

const AuthContext = createContext<TAuthContext>({
  token: "",
  user: {} as TUser,
  authenticateUser: async () => Promise.resolve(),
  logout: () => {},
  isAuthenticated: false,
  setUser: () => {},
});

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
  const { getSessionValue, removeSessionValue, setSessionValue } =
    useSessionStorage();

  // For Hanko auth, we don't use localStorage token (JWT is in httpOnly cookie)
  const [token, setToken] = useState<string | undefined>(
    AUTH_PROVIDER === "hanko"
      ? "hanko-cookie-auth" // Placeholder - actual auth is via cookie
      : getValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY),
  );
  const [user, setUser] = useState<TUser | undefined>(undefined);

  // For Hanko: authenticated if we have a user (cookie-based)
  // For legacy: authenticated if we have both user and token
  const isAuthenticated =
    AUTH_PROVIDER === "hanko"
      ? user !== undefined
      : user !== undefined && token !== undefined;

  /**
   * Set token globally to eliminate the need to rewrite it.
   * For Hanko, we use withCredentials instead of header token.
   */
  if (AUTH_PROVIDER === "hanko") {
    apiClient.defaults.withCredentials = true;
  } else {
    apiClient.defaults.headers.common["access-token"] = token ? `${token}` : null;
  }

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

  /**
   * To show the login success after completing redirection if any.
   */
  useEffect(() => {
    const loginSuccessful = getSessionValue(
      HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY,
    );
    if (loginSuccessful == "success") {
      showSuccessToast(TOAST_NOTIFICATIONS.loginSuccess);
      removeSessionValue(HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY);
    }
  }, []);

  /**
   * Proceed with the oauth flow when the state and code are in the url params.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state && user === undefined) {
      authenticateUser(state, code);
    }
  }, [user]);

  /**
   *  Proceed with the email verification flow when the uid and token are in the url params.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    const token = params.get("token");
    if (uid && token) {
      verifyUserEmail(uid, token);
    }
  }, []);

  /**
   * Retrieve the user profile information from the backend.
   * For Hanko: uses cookie-based auth with credentials: include
   * For legacy: uses access-token header
   */
  const fetchUserProfile = async () => {
    try {
      if (AUTH_PROVIDER === "hanko") {
        // For Hanko, fetch with credentials to send cookie
        const response = await fetch(`${BASE_API_URL}auth/me/`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          handleRedirection();
        } else {
          // Not authenticated or session expired
          setUser(undefined);
        }
      } else {
        const user = await authService.getUser();
        setUser(user);
        handleRedirection();
      }
    } catch (error) {
      if (AUTH_PROVIDER !== "hanko") {
        showErrorToast(error);
      }
      setUser(undefined);
    }
  };

  useEffect(() => {
    if (AUTH_PROVIDER === "hanko") {
      // For Hanko, always try to fetch user on mount (cookie might be set)
      fetchUserProfile();
    } else if (token) {
      // For legacy, only fetch if we have a token
      fetchUserProfile();
    }
  }, [token]);

  /**
   * Clean up and logout.
   * For Hanko: web component handles logout via Portal
   * For legacy: clear localStorage token
   */
  const logout = () => {
    setUser(undefined);
    if (AUTH_PROVIDER !== "hanko") {
      setToken(undefined);
      removeValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY);
    }
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
      // Delay for 5 seconds, incase it's the network speed.
      // Otherwise, redirect the user back to the home page.
      setTimeout(() => {
        window.location.href = APPLICATION_ROUTES.HOMEPAGE;
      }, 5000);
    }
  };

  /**
   * Complete the email verification flow by sending the uid and token to the backend.
   * @param uid The uid from the email.
   * @param token  The token from the email.
   */
  const verifyUserEmail = async (uid: string, token: string) => {
    try {
      const data = await authService.verifyEmail(uid, token);
      if (data) {
        showSuccessToast(data.message);
        showSuccessToast("Redirecting you to your profile page...");
      }
      /**
       * Redirect the user to the profile page after 3 seconds.
       */
      setTimeout(() => {
        window.location.href = APPLICATION_ROUTES.PROFILE_SETTINGS;
      }, 3000);
    } catch (error) {
      showErrorToast(error);
      // Delay for 3 seconds, incase it's the network speed.
      // Otherwise, redirect the user back to the home page.
      setTimeout(() => {
        window.location.href = APPLICATION_ROUTES.HOMEPAGE;
      }, 3000);
    }
  };

  /**
   * Listen for "hanko-login" and "logout" events from the hotosm-auth web component
   * to immediately update user state instead of waiting for the next poll.
   */
  useEffect(() => {
    if (AUTH_PROVIDER !== "hanko") return;

    const handleLogin = () => {
      fetchUserProfile();
    };

    const handleLogout = () => {
      setUser(undefined);
    };

    document.addEventListener("hanko-login", handleLogin);
    document.addEventListener("logout", handleLogout);
    return () => {
      document.removeEventListener("hanko-login", handleLogin);
      document.removeEventListener("logout", handleLogout);
    };
  }, []);

  /**
   * Poll the backend for the user profile information every 15 seconds.
   * This is majorly to keep the user profile information up to date, especially when the user is logged in.
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (AUTH_PROVIDER === "hanko") {
        // For Hanko, poll with credentials
        fetch(`${BASE_API_URL}auth/me/`, { credentials: "include" })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then(setUser)
          .catch(() => setUser(undefined));
      } else if (token) {
        authService.getUser().then(setUser).catch(showErrorToast);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token: token || "",
        user: user as TUser,
        authenticateUser,
        logout,
        isAuthenticated,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
