import { API_ENDPOINTS, apiClient } from "@/services";

export const countPredictionRun = async (stacId: string): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.COUNT_PREDICTION_RUN, { stac_id: stacId });
};
