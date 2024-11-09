import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createModel,
  TCreateModelArgs,
} from "@/features/model-creation/api/create-models";
import { MutationConfig, queryKeys } from "@/services";
import {
  createTrainingRequest,
  TCreateTrainingRequestArgs,
} from "@/features/model-creation/api/create-trainings";
import { useModelDetails } from "@/features/models/hooks/use-models";
import {
  TUpdateModelArgs,
  updateModel,
} from "@/features/model-creation/api/update-models";

type useCreateModelOptions = {
  mutationConfig?: MutationConfig<typeof createModel>;
};

export const useCreateModel = ({ mutationConfig }: useCreateModelOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TCreateModelArgs) => createModel(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};

type useCreateModelTrainingOptions = {
  mutationConfig?: MutationConfig<typeof createTrainingRequest>;
};

export const useCreateModelTrainingRequest = ({
  mutationConfig,
}: useCreateModelTrainingOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TCreateTrainingRequestArgs) =>
      createTrainingRequest(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};

type useUpdateModelOptions = {
  mutationConfig?: MutationConfig<typeof updateModel>;
  modelId: string;
};

export const useUpdateModel = ({
  mutationConfig,
  modelId,
}: useUpdateModelOptions) => {
  const { refetch: refetchModelDetails } = useModelDetails(modelId);
  const queryClient = useQueryClient(); // Get the query client instance
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TUpdateModelArgs) => updateModel(args),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.MODEL_DETAILS(modelId)],
      });
      refetchModelDetails();
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
