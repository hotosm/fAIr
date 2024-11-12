import { useEffect, useState } from "react";

/**
 * Custom hook to detect whether the current device is mobile, tablet based on the window width.
 *
 * This hook tracks the window width and returns `true` if the width is less than 768 pixels,
 * indicating a mobile device, and `false` otherwise. It dynamically updates as the window is resized.
 *
 * @returns {object} {isMobile,isTablet} - An object indicating whether the current device is considered mobile or tablet.
 *
 */
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<{
    isMobile: boolean,
    isTablet: boolean,
    isLaptop: boolean
  }>({
    isMobile: false,
    isTablet: false,
    isLaptop: false
  });

  const handleResize = () => {
    setScreenSize({
      isMobile: window.innerWidth < 640,
      isTablet: window.innerWidth > 640 && window.innerWidth < 768,
      isLaptop: window.innerWidth > 768 && window.innerWidth < 1024
    });
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return screenSize;
};

export default useScreenSize;
