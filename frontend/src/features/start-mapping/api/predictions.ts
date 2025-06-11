import { API_ENDPOINTS, apiClient } from "@/services";
import { TOfflinePredictionsConfig } from "@/types";

export const submitOfflinePredictionRequest = async ({
  geom,
  name,
  config,
}: TOfflinePredictionsConfig): Promise<string> => {
  return await (
    await apiClient.post(API_ENDPOINTS.CREATE_OFFLINE_PREDICTION, {
      geom,
      config,
      name,
    })
  ).data;
};
