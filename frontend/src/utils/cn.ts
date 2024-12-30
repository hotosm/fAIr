import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "clsx";

/**
 * Tailwind utility function for managing classnames.
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
