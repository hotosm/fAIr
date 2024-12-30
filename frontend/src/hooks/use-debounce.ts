import { useEffect, useState } from "react";

/**
 * Custom hook that debounces a value. This hook delays updating the value
 * until after a specified delay period has passed without changes.
 *
 * @param value - The value that will be debounced.
 * @param delay - The debounce delay in milliseconds.
 *
 * @returns {string} debouncedValue - The debounced value, updated after the delay.
 *
 */

const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState<string>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
