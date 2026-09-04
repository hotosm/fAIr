/**
 * Rounds a number to a specified number of decimal places.
 *
 * This function takes a number and rounds it to a defined number of decimal places,
 * returning it as a string. By default, it rounds to two decimal places, but this can
 * be adjusted by providing a different value for the `round` parameter.
 *
 * @param {number} num - The number to be rounded.
 * @param {number} [round=2] - The number of decimal places to round to (default is 2).
 * @returns {string} - The rounded number as a string.
 */
export const roundNumber = (num: number, round: number = 2): number => {
  // Input validation: Handle non-numbers, NaN, Infinity, -Infinity.
  if (typeof num !== "number" || !Number.isFinite(num)) {
    return 0;
  }

  // Handle zero specifically:
  if (num === 0) {
    return 0;
  }

  const factor = Math.pow(10, round);
  const sign = Math.sign(num); // Will be 1, -1, or 0 (but we handled 0 already)

  const absoluteRounded = Math.round(Math.abs(num) * factor + Number.EPSILON) / factor;

  const result = sign * absoluteRounded;

  // Final check for negative zero
  if (Object.is(result, -0)) {
    return 0;
  }

  return result;
};

/**
 * Formats a number for display, using abbreviations (K, M, B) for large numbers
 * and locale-specific thousands separators for smaller numbers.
 *
 * @param count The number to format.
 * @returns A formatted string representation of the number.
 */
export const formatNumber = (count: number): string => {
  const sign = Math.sign(count);
  const absoluteCount = Math.abs(count);

  if (absoluteCount >= 1_000_000_000) {
    return (sign * (absoluteCount / 1_000_000_000)).toFixed(1) + "B"; // Billions
  }
  if (absoluteCount >= 1_000_000) {
    return (sign * (absoluteCount / 1_000_000)).toFixed(1) + "M"; // Millions
  }
  if (absoluteCount >= 1_000) {
    return (sign * (absoluteCount / 1_000)).toFixed(1) + "K"; // Thousands
  }

  return count.toLocaleString("en-US");
};
