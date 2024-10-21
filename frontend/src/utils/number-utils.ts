export const roundNumber = (num: number, round: number = 2) => {
  return num.toFixed(round) ?? 0;
};
