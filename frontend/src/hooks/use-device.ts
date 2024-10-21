import { useEffect, useState } from "react";

/**
 * Custom hook to detect whether the current device is mobile based on the window width.
 *
 * This hook tracks the window width and returns `true` if the width is less than 768 pixels,
 * indicating a mobile device, and `false` otherwise. It dynamically updates as the window is resized.
 *
 * @returns {boolean} isMobile - A boolean indicating whether the current device is considered mobile.
 *
 */
const useDevice = () => {
  const [isMobile, setIsMobile] = useState(false);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
};

export default useDevice;
