import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/services/api-client";
import { authService } from "@/services";
import {
  AUTH_PROVIDER,
  BASE_API_URL,
  DISABLE_AUTH_ON_TRY_FAIR,
  HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY,
  HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY,
  HOT_FAIR_SESSION_REDIRECT_KEY,
  IS_DEV,
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

  const isTryFairPage = location.pathname.includes(APPLICATION_ROUTES.TRY_FAIR);

  const [token, setToken] = useState<string | undefined>(
    AUTH_PROVIDER === "hanko" && !IS_DEV
      ? "hanko-cookie-auth"
      : getValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY),
  );

  
  const [user, setUser] = useState<TUser | undefined>(undefined);

  const isAuthenticated =
    AUTH_PROVIDER === "hanko"
      ? user !== undefined
      : user !== undefined && token !== undefined;

  /**
   * Set token globally to eliminate the need to rewrite it.
   * For Hanko, we use withCredentials instead of header token.
   */

  if (AUTH_PROVIDER === "hanko" && !IS_DEV) {
    apiClient.defaults.withCredentials = true;
  } else {
    apiClient.defaults.headers.common["Authorization"] = token
      ? `Bearer ${token}`
      : null;
  }

  const handleRedirection = () => {
    const redirectTo = getSessionValue(HOT_FAIR_SESSION_REDIRECT_KEY);
    if (redirectTo) {
      removeSessionValue(HOT_FAIR_SESSION_REDIRECT_KEY);
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
   * Proceed with the email verification flow when the uid and token are in the url params.
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
   * For Hanko auth, fetches from auth/me/ endpoint with credentials.
   * For legacy auth, uses authService.getUser().
   */
  const fetchUserProfile = async () => {
    try {
      if (AUTH_PROVIDER === "hanko" && !IS_DEV) {
        const response = await fetch(`${BASE_API_URL}auth/me/`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          if (!userData.img_url) {
            const hankoUser = JSON.parse(
              localStorage.getItem("hotosm-auth-user") || "{}",
            );
            if (hankoUser.avatarUrl) {
              userData.img_url = hankoUser.avatarUrl;
            }
          }
          setUser(userData);
          handleRedirection();
        } else {
          setUser(undefined);
        }
      } else {
        // Actually, only fetch this when token exists
        if (!token) {
          setUser(undefined);
          return;
        }
        
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
    if (DISABLE_AUTH_ON_TRY_FAIR && isTryFairPage) return;
    if (AUTH_PROVIDER === "hanko") {
      fetchUserProfile();
    } else if (token) {
      fetchUserProfile();
    }
  }, [token]);

  /**
   * Clean up and logout.
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
   * Complete the oauth flow by exchanging code and state tokens for access token from the backend.
   * @param state The state token from OSM.
   * @param code The code token from OSM.
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
   * @param token The token from the email.
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

  useEffect(() => {
    if (AUTH_PROVIDER !== "hanko") return;
    if (DISABLE_AUTH_ON_TRY_FAIR) return;

    const handleLogin = (e: Event) => {
      const user = (e as CustomEvent).detail?.user;
      if (user) {
        localStorage.setItem("hotosm-auth-user", JSON.stringify(user));
      }
      fetchUserProfile();
    };

    const handleLogout = () => {
      localStorage.removeItem("hotosm-auth-user");
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
    if (DISABLE_AUTH_ON_TRY_FAIR) return;
    const intervalId = setInterval(() => {
      if (AUTH_PROVIDER === "hanko" && !IS_DEV) {
        fetch(`${BASE_API_URL}auth/me/`, { credentials: "include" })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((userData) => {
            if (!userData.img_url) {
              const hankoUser = JSON.parse(
                localStorage.getItem("hotosm-auth-user") || "{}",
              );
              if (hankoUser.avatarUrl) {
                userData.img_url = hankoUser.avatarUrl;
              }
            }
            setUser(userData);
          })
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
