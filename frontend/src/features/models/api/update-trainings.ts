import { API_ENDPOINTS, apiClient, MutationConfig } from "@/services";
import { PAGE_LIMIT } from "@/components/shared";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { useMutation } from "@tanstack/react-query";
import { useTrainingHistory } from "@/features/models/hooks/use-training";

export const updateTraining = (trainingId: number) => {
  return apiClient.post(`${API_ENDPOINTS.UPDATE_TRAINING(trainingId)}`);
};

export const terminateTraining = (trainingId: number) => {
  return apiClient.post(`${API_ENDPOINTS.TERMINATE_TRAINING(trainingId)}`);
};

type UseUpdateTrainingOptions = {
  mutationConfig?: MutationConfig<typeof updateTraining>;
  modelId: number;
};

export const useUpdateTraining = ({
  mutationConfig,
  modelId,
}: UseUpdateTrainingOptions) => {
  const { refetch: refetchModelDetails } = useModelDetails(
    String(modelId),
    !!modelId,
  );
  const { refetch: refetchTrainingHistory } = useTrainingHistory(
    0,
    PAGE_LIMIT,
    "-id",
    String(modelId),
    undefined,
    !!modelId,
  );

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: async (...args) => {
      refetchModelDetails();
      refetchTrainingHistory();
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateTraining,
  });
};

export const useTerminateTraining = ({
  mutationConfig,
  modelId,
}: UseUpdateTrainingOptions) => {
  const { refetch: refetchTrainingHistory } = useTrainingHistory(
    0,
    PAGE_LIMIT,
    "-id",
    String(modelId),
    undefined,
    !!modelId,
  );

  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    onSuccess: async (...args) => {
      refetchTrainingHistory();
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: terminateTraining,
  });
};
