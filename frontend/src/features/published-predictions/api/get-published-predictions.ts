import { PAGE_LIMIT } from "@/components/shared";
import { API_ENDPOINTS, apiClient } from "@/services";
import { TOfflinePrediction } from "@/types";

export type PublishedPredictionsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TOfflinePrediction[];
  hasNext: boolean;
  hasPrev: boolean;
};

export const getPublishedPredictions = async (
  searchQuery?: string,
  ordering: string = "-id",
  offset?: number,
): Promise<PublishedPredictionsResponse> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_PUBLISHED_PREDICTIONS, {
    params: {
      published: true,
      search: searchQuery,
      ordering,
      offset,
      limit: PAGE_LIMIT,
    },
  });
  return {
    ...res.data,
    hasNext: res.data.next !== null,
    hasPrev: res.data.previous !== null,
  };
};
