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

  const [token, setToken] = useState<string | undefined>(
    AUTH_PROVIDER === "hanko"
      ? "hanko-cookie-auth"
      : getValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY),
  );
  const [user, setUser] = useState<TUser | undefined>(undefined);

  const isAuthenticated =
    AUTH_PROVIDER === "hanko"
      ? user !== undefined
      : user !== undefined && token !== undefined;

  if (AUTH_PROVIDER === "hanko") {
    apiClient.defaults.withCredentials = true;
  } else {
    apiClient.defaults.headers.common["access-token"] = token
      ? `${token}`
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

  useEffect(() => {
    const loginSuccessful = getSessionValue(
      HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY,
    );
    if (loginSuccessful == "success") {
      showSuccessToast(TOAST_NOTIFICATIONS.loginSuccess);
      removeSessionValue(HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state && user === undefined) {
      authenticateUser(state, code);
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    const token = params.get("token");
    if (uid && token) {
      verifyUserEmail(uid, token);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      if (AUTH_PROVIDER === "hanko") {
        const response = await fetch(`${BASE_API_URL}auth/me/`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          handleRedirection();
        } else {
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
      fetchUserProfile();
    } else if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const logout = () => {
    setUser(undefined);
    if (AUTH_PROVIDER !== "hanko") {
      setToken(undefined);
      removeValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY);
    }
    showSuccessToast(TOAST_NOTIFICATIONS.logoutSuccess);
  };

  const authenticateUser = async (state: string, code: string) => {
    try {
      const data = await authService.authenticate(state, code);
      setValue(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY, data.access_token);
      setToken(data.access_token);
    } catch (error) {
      showErrorToast(error, TOAST_NOTIFICATIONS.authenticationFailed);
      setTimeout(() => {
        window.location.href = APPLICATION_ROUTES.HOMEPAGE;
      }, 5000);
    }
  };

  const verifyUserEmail = async (uid: string, token: string) => {
    try {
      const data = await authService.verifyEmail(uid, token);
      if (data) {
        showSuccessToast(data.message);
        showSuccessToast("Redirecting you to your profile page...");
      }
      setTimeout(() => {
        window.location.href = APPLICATION_ROUTES.PROFILE_SETTINGS;
      }, 3000);
    } catch (error) {
      showErrorToast(error);
      setTimeout(() => {
        window.location.href = APPLICATION_ROUTES.HOMEPAGE;
      }, 3000);
    }
  };

  useEffect(() => {
    if (AUTH_PROVIDER !== "hanko") return;

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

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (AUTH_PROVIDER === "hanko") {
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
