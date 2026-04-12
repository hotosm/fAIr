import { PAGE_LIMIT } from "@/components/shared";
import { API_ENDPOINTS, apiClient } from "@/services";
import { FeatureCollection, TOfflinePrediction } from "@/types";

export type AIPredictionsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TOfflinePrediction[];
  hasNext: boolean;
  hasPrev: boolean;
};

export const getAIPredictions = async (
  searchQuery?: string,
  ordering: string = "-id",
  offset?: number,
  id?: number,
): Promise<AIPredictionsResponse> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_AI_PREDICTIONS, {
    params: {
      published: true,
      search: searchQuery,
      ordering,
      offset,
      limit: PAGE_LIMIT,
      id,
    },
  });
  return {
    ...res.data,
    hasNext: res.data.next !== null,
    hasPrev: res.data.previous !== null,
  };
};

export const getAIPredictionsMapData =
  async (): Promise<FeatureCollection> => {
    const res = await apiClient.get(
      API_ENDPOINTS.GET_AI_PREDICTIONS_CENTROIDS,
    );

    return res.data;
  };
