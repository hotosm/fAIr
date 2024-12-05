import { showErrorToast } from "@/utils";

/**
 * Custom hook to interact with the browser's localStorage.
 *
 * This hook provides utility functions to get, set, and remove items from the localStorage.
 * It wraps the localStorage methods with error handling to avoid potential exceptions.
 *
 * @returns {Object}
 * - `getValue: (key: string) => string | undefined`: Retrieves the stored value for the provided key.
 * - `setValue: (key: string, value: string) => void`: Saves a value for the provided key in localStorage.
 * - `removeValue: (key: string) => void`: Removes the value associated with the provided key from localStorage
 */
export const useLocalStorage = () => {
  const getValue = (key: string): string | undefined => {
    try {
      const item = localStorage.getItem(key);
      return item ? item : undefined;
    } catch (error) {
      showErrorToast(error);
    }
  };

  const setValue = (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const removeValue = (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      showErrorToast(error);
    }
  };

  return { getValue, setValue, removeValue };
};

/**
 * Custom hook to interact with the browser's sessionStorage.
 *
 * This hook provides utility functions to get, set, and remove items from the sessionStorage.
 * It wraps the sessionStorage methods with error handling to avoid potential exceptions.
 *
 * @returns {Object}
 * - `getValue: (key: string) => string | undefined`: Retrieves the stored value for the provided key.
 * - `setValue: (key: string, value: string) => void`: Saves a value for the provided key in sessionStorage.
 * - `removeValue: (key: string) => void`: Removes the value associated with the provided key from sessionStorage
 */
export const useSessionStorage = () => {
  const getValue = (key: string): string | undefined => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? item : undefined;
    } catch (error) {
      showErrorToast(error);
    }
  };

  const setValue = (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const removeValue = (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      showErrorToast(error);
    }
  };

  return { getValue, setValue, removeValue };
};
