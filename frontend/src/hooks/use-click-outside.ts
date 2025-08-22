import { useEffect, useRef } from "react";

/**
 * Custom hook that triggers a handler function when a click or touch event occurs outside the referenced element.
 *
 * @param handler - The function to call when a click or touch event occurs outside the referenced element.
 * @returns A ref object to be attached to the element you want to detect clicks outside of.
 */
export const useClickOutside = <T extends HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event);
      }
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]);

  return ref;
};
