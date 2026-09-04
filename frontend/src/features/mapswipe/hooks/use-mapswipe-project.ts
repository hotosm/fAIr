import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createMapSwipeProject,
  TMapSwipeProjectCreateArgs,
} from "@/features/mapswipe/api/mapswipe-projects";
import { MutationConfig } from "@/services";
import { getMapSwipeProjectStatusQueryOptions } from "./factory";

export type useCreateMapSwipeProjectOptions = {
  mutationConfig?: MutationConfig<typeof createMapSwipeProject>;
};

export const useCreateMapSwipeProject = ({ mutationConfig }: useCreateMapSwipeProjectOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TMapSwipeProjectCreateArgs) => createMapSwipeProject(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};

export const useMapSwipeProjectStatus = (projectId: string, fetch: boolean) => {
  return useQuery({
    ...getMapSwipeProjectStatusQueryOptions(projectId),
    enabled: fetch,
    refetchInterval: 15000, // 15 seconds
  });
};
