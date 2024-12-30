import { DateFilter } from '@/types';

/**
 * Extracts the date part from an ISO 8601 date-time string.
 *
 * This function takes an ISO date-time string (e.g., "2024-01-01T12:00:00Z")
 * and splits it at the "T" character to isolate the date portion.
 * It returns the date part in the format "YYYY-MM-DD".
 *
 * @param {string} isoString - The ISO date-time string to extract the date from.
 * @returns {string} - The extracted date part in "YYYY-MM-DD" format.
 */
export const extractDatePart = (isoString: string) => {
  if (!isoString) return "N/A"; // Return fallback if undefined
  return isoString.split("T")[0];
};

/**
 * Constructs a query string object for filtering records based on date range.
 *
 * This function takes an optional date filter and two optional date strings
 * (startDate and endDate) and builds a record of query parameters to be used
 * in an API request. The resulting query parameters will use the API value of
 * the selected filter along with `__gte` (greater than or equal) and `__lte`
 * (less than or equal) suffixes for the respective dates.
 *
 * - If `startDate` is provided, it adds a query parameter for the lower bound.
 * - If `endDate` is provided, it adds a query parameter for the upper bound.
 * - If neither date is provided, an empty object is returned.
 *
 * @param {DateFilter} [selectedFilter] - The filter object containing the API value.
 * @param {string} [startDate] - The starting date string in ISO format.
 * @param {string} [endDate] - The ending date string in ISO format.
 * @returns {Record<string, string>} - An object containing the query parameters for filtering.
 *
 * Example usage:
 * const query = buildDateFilterQueryString(selectedFilter, '2024-01-01', '2024-12-31');
 * Output: { "filterField__gte": "2024-01-01", "filterField__lte": "2024-12-31" }
 */
export const buildDateFilterQueryString = (
  selectedFilter?: DateFilter,
  startDate?: string,
  endDate?: string,
): Record<string, string> => {
  const params: Record<string, string> = {};
  if (startDate) {
    params[`${selectedFilter?.apiValue}__gte`] = startDate;
  }
  if (endDate) {
    params[`${selectedFilter?.apiValue}__lte`] = endDate;
  }

  return Object.assign({}, params);
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
};

/**
 * Formats the duration between two Date objects (startDate and endDate) into a human-readable string.
 *
 * The function calculates the absolute difference between the two dates and converts it into hours, minutes, and seconds.
 * It then formats the duration into a string such as "Xhr Y Mins Z Secs" depending on which time units are present.
 * @param {Date} startDate - The starting date and time.
 * @param {Date} endDate - The ending date and time.
 * @returns {string} - The formatted duration string (e.g., "2hr 15 Mins 30 Secs").
 */
export const formatDuration = (
  startDate: Date,
  endDate: Date,
  maxUnits: number = 4,
): string => {
  const diff = Math.abs(endDate.getTime() - startDate.getTime());

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const timeParts: string[] = [];
  if (days > 0) timeParts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) timeParts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
  if (minutes > 0) timeParts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
  if (seconds > 0 || timeParts.length === 0)
    timeParts.push(`${seconds} sec${seconds > 1 ? "s" : ""}`);

  return timeParts.slice(0, maxUnits).join(" ");
};
