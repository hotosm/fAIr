/**
 *  Formats the project topic by trimming whitespace and converting it to lowercase.
 * Ref-  https://github.com/mapswipe/manager-dashboard/blob/aed2bde653b26da6804efd86676bcb958fed79ff/app/utils/common.tsx#L319
 * @param projectTopic - the project topic to be formatted
 * @returns
 */
export const formatProjectTopic = (projectTopic: string) => {
  // Note: this will remove start and end space
  const projectWithoutStartAndEndSpace = projectTopic.trim();

  // Note: this will change multi space to single space
  const removeMultiSpaceToSingle = projectWithoutStartAndEndSpace.replace(
    /\s+/g,
    " ",
  );
  const newProjectTopic = removeMultiSpaceToSingle.toLowerCase();

  return newProjectTopic;
};

/**
 * Converts a project status code such as READY_TO_PUBLISH into a
 * readable label. The function lowercases the value, splits it by
 * underscores, capitalizes each piece, then joins them with spaces.
 *
 * Example:
 * READY_TO_PROCESS becomes Ready To Process
 */
export const formatMapSwipeProjectStatus = (value: string) => {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};
