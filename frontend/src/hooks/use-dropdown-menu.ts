import { useCallback, useState } from "react";

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
  const [isOpened, setIsOpened] = useState(false);
  const onDropdownShow = useCallback(() => {
    setIsOpened(true);
  }, []);

  const onDropdownHide = useCallback(() => {
    setIsOpened(false);
  }, []);

  const toggleDropDown = useCallback(() => {
    if (isOpened) {
      setIsOpened(false);
    } else {
      setIsOpened(true);
    }
  }, [isOpened]);

  const dropdownIsOpened = isOpened
  return { onDropdownHide, onDropdownShow, dropdownIsOpened, toggleDropDown };
};
