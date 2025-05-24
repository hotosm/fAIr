import { SlDropdownType } from "@/types";
import { useCallback, useMemo, useRef } from "react";

/**
 * Custom hook to manage the visibility state of a dropdown menu.
 *
 * This hook provides a simple way to control the opening and closing of a dropdown
 * menu, offering functions to show and hide the dropdown, and a memoized value
 * to track its current visibility state.
 *
 * @returns {Object}
 * - `onDropdownShow: () => void`: Function to show/open the dropdown menu.
 * - `onDropdownHide: () => void`: Function to hide/close the dropdown menu.
 * - `dropdownIsOpened: boolean`: A memoized boolean that represents whether the dropdown is currently opened.
 */
export const useDropdownMenu = () => {
  const dropdownRef = useRef<SlDropdownType | null>(null);
  const onDropdownShow = useCallback(() => {
    dropdownRef.current?.show();
  }, []);

  const onDropdownHide = useCallback(() => {
    dropdownRef.current?.hide();
  }, []);

  return useMemo(
    () => ({
      onDropdownShow,
      onDropdownHide,
      dropdownRef,
    }),
    [onDropdownShow, onDropdownHide, dropdownRef],
  );
};
