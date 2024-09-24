import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind utility function for managing classnames.
 */

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}