import { queryOptions } from "@tanstack/react-query";
import { getMapSwipeProjectStatus } from "../api/mapswipe-projects";

export const getMapSwipeProjectStatusQueryOptions = (projectId: string) => {
  return queryOptions({
    queryKey: ["mapswipe-project-status", projectId],
    queryFn: () => getMapSwipeProjectStatus(projectId),
  });
};
