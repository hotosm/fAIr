import { useMutation } from "@tanstack/react-query";
import {
  createMapSwipeProject,
  TMapSwipeProjectCreateArgs,
} from "@/features/mapswipe/api/mapswipe-projects";
import { MutationConfig } from "@/services";

export type useCreateMapSwipeProjectOptions = {
  mutationConfig?: MutationConfig<typeof createMapSwipeProject>;
};

export const useCreateMapSwipeProject = ({
  mutationConfig,
}: useCreateMapSwipeProjectOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TMapSwipeProjectCreateArgs) =>
      createMapSwipeProject(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
