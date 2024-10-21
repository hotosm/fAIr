import { useCallback, useMemo, useState } from "react";

/**
 * This hook is to be used to handle the dropdown menu element events.
 * @returns Object
 */

export const useDropdownMenu = () => {
  const [isOpened, setIsOpened] = useState(false);
  const onDropdownShow = useCallback(() => {
    setIsOpened(true);
  }, []);

  const onDropdownHide = useCallback(() => {
    setIsOpened(false);
  }, []);
  const dropdownIsOpened = useMemo(() => isOpened, [isOpened]);
  return { onDropdownHide, onDropdownShow, dropdownIsOpened };
};
