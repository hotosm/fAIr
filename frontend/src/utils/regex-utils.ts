/**
 * Regular expression pattern to match TMS (Tile Map Service) URLs.
 *
 * This pattern ensures that the URL starts with "https://", followed by any characters,
 * and contains placeholders for zoom level (`{z}`), x-coordinate (`{x}`), and y-coordinate (`{y}`).
 *
 * Example of a matching URL: `https://example.com/{z}/{x}/{y}.png`
 */
export const TMS_URL_REGEX_PATTERN = /^https:\/\/.*\/\{z\}\/\{x\}\/\{y\}.*$/;
