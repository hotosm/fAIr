import { PAGE_LIMIT } from "@/components/shared";
import { API_ENDPOINTS, apiClient } from "@/services";
import { TOfflinePrediction } from "@/types";

export const getPredictions = async (
  searchQuery?: string,
  ordering: string = "-id",
  userId?: number,
  offset?: number,
): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: TOfflinePrediction[];
  hasNext: boolean;
  hasPrev: boolean;
}> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_OFFLINE_PREDICTIONS, {
    params: {
      search: searchQuery,
      ordering,
      user: userId,
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
