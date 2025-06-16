import { API_ENDPOINTS, apiClient } from "@/services";
import { TOfflinePredictionsConfig } from "@/types";

export const submitOfflinePredictionRequest = async ({
  geom,
  description,
  config,
}: TOfflinePredictionsConfig): Promise<string> => {
  return await (
    await apiClient.post(API_ENDPOINTS.CREATE_OFFLINE_PREDICTION, {
      geom,
      config,
      description,
    })
  ).data;
};
