import { API_ENDPOINTS, apiClient } from "@/services";
import { TOfflinePrediction } from "@/types";

export type TOfflinePredictionUpdateArgs = {
  id: number;
  data: {
    mapswipe_id: string;
  };
};
export const updateOfflinePrediction = async ({
  id,
  data,
}: TOfflinePredictionUpdateArgs): Promise<{
  results: TOfflinePrediction;
}> => {
  const res = await apiClient.patch(
    API_ENDPOINTS.UPDATE_OFFLINE_PREDICTION(id),
    { ...data },
  );
  return {
    ...res.data,
  };
};
