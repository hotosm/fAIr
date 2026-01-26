import { API_ENDPOINTS, apiClient, MutationConfig } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const terminateOfflinePrediction = (predictionId: number) => {
  return apiClient.post(
    `${API_ENDPOINTS.TERMINATE_OFFLINE_PREDICTION(predictionId)}`,
  );
};

export const retryOfflinePrediction = (predictionId: number) => {
  return apiClient.post(
    `${API_ENDPOINTS.RETRY_OFFLINE_PREDICTION(predictionId)}`,
  );
};

type TUseTerminateOrRetryPredictionOptions = {
  mutationConfig?:
    | MutationConfig<typeof terminateOfflinePrediction>
    | MutationConfig<typeof retryOfflinePrediction>;
  predictionId: number;
};

export const useTerminateOfflinePrediction = ({
  mutationConfig,
}: TUseTerminateOrRetryPredictionOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    onSuccess: async (...args) => {
      onSuccess?.(...args);
      // clear the cache to update the table
      queryClient.invalidateQueries({
        queryKey: ["offline-predictions"],
      });
    },
    ...restConfig,
    mutationFn: terminateOfflinePrediction,
  });
};

export const useRetryOfflinePrediction = ({
  mutationConfig,
}: TUseTerminateOrRetryPredictionOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    onSuccess: async (...args) => {
      onSuccess?.(...args);
      // clear the cache to update the table
      queryClient.invalidateQueries({
        queryKey: ["offline-predictions"],
      });
    },
    ...restConfig,
    mutationFn: retryOfflinePrediction,
  });
};
