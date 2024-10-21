import { useCallback, useState } from "react";

export const useDialog = () => {
  const [isOpened, setIsOpened] = useState(false);

  const toggle = useCallback(() => {
    setIsOpened((prev) => !prev);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpened(false);
  }, []);
  const openDialog = useCallback(() => {
    setIsOpened(true);
  }, []);

  return { isOpened, toggle, closeDialog, openDialog };
};
