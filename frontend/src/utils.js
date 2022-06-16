export const timeSince = (when, then) => {
  // this ignores months
  const seconds = (then.getTime() - when.getTime()) / 1000;

  if (seconds > 604800)
    return " +" + (seconds / 604800).toFixed() + " week(s) ago";
  if (seconds > 86400) return " +" + (seconds / 86400).toFixed() + " day(s) ago";

  if (seconds > 3600) return " +" + (seconds / 3600).toFixed() + " hr(s) ago";

  if (seconds > 60) return " +" + (seconds / 60).toFixed() + " minute(s) ago";

  return " +" + seconds.toFixed() + " s ago";
};
export const aoiStatusText = (status) => {
  // this ignores months

  switch (status) {
    case -1:
      return "New";
    case 0:
      return "Running";
    case 1:
      return "Fetched";

    default:
      break;
  }
};
