import { API_ENDPOINTS, apiClient, MutationConfig } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const terminateOfflinePrediction = (predictionId: number) => {
  return apiClient.post(
    `${API_ENDPOINTS.TERMINATE_OFFLINE_PREDICTION(predictionId)}`
  );
};

type TUseTerminatePredictionOptions = {
  mutationConfig?: MutationConfig<typeof terminateOfflinePrediction>;
  predictionId: number;
};

export const useTerminateOfflinePrediction = ({
  mutationConfig,
}: TUseTerminatePredictionOptions) => {
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
