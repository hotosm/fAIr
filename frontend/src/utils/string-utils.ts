/**
 * Truncates a string to a specified maximum length, appending ellipsis if truncated.
 *
 * This function takes a string and a maximum length, and if the string exceeds
 * the specified length, it truncates the string and appends "..." to indicate that
 * it has been shortened. The default maximum length is set to 30 characters.
 *
 * @param {string} [string] - The string to be truncated (optional).
 * @param {number} [maxLength=30] - The maximum length for the string (default is 30).
 * @returns {string | undefined} - The truncated string with ellipsis, or the original string if within limit.
 */
export const truncateString = (string?: string, maxLength: number = 30) => {
  if (string && string.length > maxLength) {
    return `${string.slice(0, maxLength - 3)}...`;
  }
  return string;
};
