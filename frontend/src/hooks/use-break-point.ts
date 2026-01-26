import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "sm" | "md" | "lg" | "xl" | "2xl";

interface BreakpointConfig {
  mobile: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
}

// Tailwind-style breakpoints
const breakpoints: BreakpointConfig = {
  mobile: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};


export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>("lg");

  useEffect(() => {
    const mediaQueries: { breakpoint: Breakpoint; query: MediaQueryList }[] = [
      {
        breakpoint: "2xl",
        query: window.matchMedia(`(min-width: ${breakpoints["2xl"]}px)`),
      },
      {
        breakpoint: "xl",
        query: window.matchMedia(`(min-width: ${breakpoints.xl}px)`),
      },
      {
        breakpoint: "lg",
        query: window.matchMedia(`(min-width: ${breakpoints.lg}px)`),
      },
      {
        breakpoint: "md",
        query: window.matchMedia(`(min-width: ${breakpoints.md}px)`),
      },
      {
        breakpoint: "sm",
        query: window.matchMedia(`(min-width: ${breakpoints.sm}px)`),
      },
    ];

    const updateBreakpoint = () => {
      // Find the largest matching breakpoint
      for (const { breakpoint, query } of mediaQueries) {
        if (query.matches) {
          setCurrentBreakpoint(breakpoint);
          return;
        }
      }
      // Default to mobile if no breakpoints match
      setCurrentBreakpoint("mobile");
    };

    // Initial check
    updateBreakpoint();

    // Add listeners
    const listeners = mediaQueries.map(({ query }) => {
      const listener = () => updateBreakpoint();
      query.addEventListener("change", listener);
      return { query, listener };
    });

    // Cleanup
    return () => {
      listeners.forEach(({ query, listener }) => {
        query.removeEventListener("change", listener);
      });
    };
  }, []);

  // Helper functions
  const breakpointOrder: Breakpoint[] = [
    "mobile",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
  ];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

  const isAbove = (breakpoint: Breakpoint): boolean => {
    return currentIndex >= breakpointOrder.indexOf(breakpoint);
  };

  const isBelow = (breakpoint: Breakpoint): boolean => {
    return currentIndex < breakpointOrder.indexOf(breakpoint);
  };

  return {
    breakpoint: currentBreakpoint,
    isMobile: currentBreakpoint === "mobile",
    isTablet: currentBreakpoint === "sm" || currentBreakpoint === "md",
    isDesktop: isAbove("lg"),
    isAbove,
    isBelow,
  };
};

/**
 * Get the number of slides to show based on breakpoint
 * @param breakpoint - Current breakpoint
 * @returns Number of slides to display
 */
export const getSlidesPerPage = (breakpoint: Breakpoint): number => {
  switch (breakpoint) {
    case "mobile":
      return 1;
    case "sm":
      return 2;
    case "md":
      return 2;
    case "lg":
    case "xl":
    case "2xl":
    default:
      return 4;
  }
};
