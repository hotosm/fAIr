import { useCallback, useState } from "react";

/**
 * Custom hook to manage the state of a dialog (open/close).
 *
 * @returns {Object}
 * - `isOpened: boolean`: A boolean indicating if the dialog is currently open.
 * - `toggle: () => void`: A function to toggle the dialog's state (open/close).
 * - `closeDialog: () => void`: A function to explicitly close the dialog.
 * - `openDialog: () => void`: A function to explicitly open the dialog.
 */
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
