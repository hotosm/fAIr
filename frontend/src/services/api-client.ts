import Axios, { InternalAxiosRequestConfig } from "axios";
import { ENVS } from "@/config/env";
import {
  HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY,
  showErrorToast,
} from "@/utils";

export const BASE_API_URL = ENVS.BASE_API_URL;
/**
 * The global axios API client.
 */
export const apiClient = Axios.create({
  baseURL: BASE_API_URL,
});

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = "application/json";
  }
  return config;
}

/**
 * Interceptors
 */
apiClient.interceptors.request.use(authRequestInterceptor);
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // if unauthorized request, simply clear the local storage to log them out.
    if (!error.response) {
      showErrorToast(undefined, "Network error");
    }
    if (error.response?.status === 401) {
      showErrorToast(undefined, "Unauthorized, logging out...");
      localStorage.removeItem(HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);
