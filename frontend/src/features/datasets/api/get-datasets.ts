import { PAGE_LIMIT } from "@/components/shared";
import { API_ENDPOINTS, apiClient } from "@/services";
import { FeatureCollection, TTrainingDataset } from "@/types";

export const getTrainingDataset = async (
  id: number
): Promise<TTrainingDataset> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_DATASET(id));
  return res.data;
};

export const getTrainingDatasetsV2 = async (
  searchQuery?: string,
  // todo - add date ordering
  ordering: string = "-id",
  // page: number,
  userId?: number,
  offset?: number,
  id?: number
): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: TTrainingDataset[];
  hasNext: boolean;
  hasPrev: boolean;
}> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_DATASETS_V2, {
    params: {
      search: searchQuery,
      ordering,
      user: userId,
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

export const getDatasetsMapData = async (): Promise<FeatureCollection> => {
  const res = await apiClient.get(
    API_ENDPOINTS.GET_TRAINING_DATASETS_CENTROIDS
  );
  return res.data;
};
