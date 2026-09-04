import { DateFilter } from "@/types";

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

/**
 * Formats a date string into a human-readable format.
 *
 * Handles:
 * - DD-MM-YYYY (e.g., "01-02-2025")
 * - YYYY-MM-DD (e.g., "2025-02-01")
 * - Full ISO timestamps (YYYY-MM-DDTHH:MM:SS)
 *
 * Optionally returns a short format (e.g., "Jan 30, 2026") for dates with or without time.
 *
 * @param dateString - The date string to format.
 * @param short - If true, returns a short format (e.g., "Jan 30, 2026").
 * @returns A formatted date string.
 *
 * @example
 * formatDate("01-02-2025");
 * // "Feb 1, 2025" if short=true, otherwise "01/02/2025"
 *
 * @example
 * formatDate("2026-01-30");
 * // "Jan 30, 2026" if short=true, otherwise "30/01/2026"
 *
 * @example
 * formatDate("2026-01-30T06:45:12", true);
 * // "Jan 30, 2026"
 */
export const formatDate = (dateString: string, short?: boolean): string => {
  // Detect if it's ISO timestamp with time
  const hasTime = dateString.includes("T");

  let date: Date;

  if (hasTime) {
    // ISO timestamp with time
    date = new Date(dateString);
  } else if (dateString.includes("-")) {
    const parts = dateString.split("-").map(Number);

    if (parts[0] > 31) {
      // Assume YYYY-MM-DD
      const [year, month, day] = parts;
      date = new Date(year, month - 1, day);
    } else {
      // Assume DD-MM-YYYY
      const [day, month, year] = parts;
      date = new Date(year, month - 1, day);
    }
  } else {
    throw new Error("Unsupported date format");
  }

  if (short) {
    // Short format: "Jan 30, 2026"
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (hasTime) {
    // Full format with time: "DD/MM/YYYY, HH:MM:SS"
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  }

  // Default plain date format: "DD/MM/YYYY"
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
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
export const formatDuration = (startDate: Date, endDate: Date, maxUnits: number = 4): string => {
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
