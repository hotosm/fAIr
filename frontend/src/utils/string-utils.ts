/**
 * Truncates a string to a specified maximum length, appending ellipsis if truncated.
 * The elipsis is also included in the maximum character count, as well as the spaces.
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

/**
 * Extracts the base URL from an OpenAerialMap TMS URL.
 *
 * This function takes an OpenAerialMap TMS URL and removes the tile-specific
 * path (/{z}/{x}/{y}) to return the base URL.
 *
 * @param {string} openAerialMapTMSURL - The OpenAerialMap TMS URL to be processed.
 * @returns {string} - The base URL extracted from the provided TMS URL.
 */
export const extractTileJSONURL = (openAerialMapTMSURL: string) => {
  return openAerialMapTMSURL.split("/{z}/{x}/{y}")[0];
};
