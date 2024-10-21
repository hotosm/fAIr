import { useMemo } from "react";

/**
 * Custom hook to detect if the current browser is Google Chrome.
 *
 * @returns { isChrome: boolean } - An object containing a boolean value indicating if the browser is Chrome.
 *
 */
const useBrowserType = (): { isChrome: boolean } => {
  const isChrome = useMemo<boolean>(() => {
    return (
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
    );
  }, []);

  return { isChrome };
};

export default useBrowserType;
