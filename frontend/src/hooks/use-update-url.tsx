import { useCallback } from "react";

export const useUpdateUrl = () => {
  const updateUrl = useCallback((url: string) => {
    window.history.replaceState(null, "", url);
  }, []);

  return updateUrl;
};
