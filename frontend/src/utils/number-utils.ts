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
  return Number(num.toFixed(round));
};
