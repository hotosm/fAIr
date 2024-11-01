import { API_ENDPOINTS, apiClient } from "@/services";
import { PaginatedTrainingArea, TTrainingDataset } from "@/types";

export const getTrainingDatasets = async (): Promise<TTrainingDataset[]> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_DATASETS);
  return res.data?.results;
};

export const getTrainingAreas = async (
  datasetId: number,
  offset: number,
  limit: number = 20,
): Promise<PaginatedTrainingArea> => {
  const res = await apiClient.get(
    API_ENDPOINTS.GET_TRAINING_AREAS(datasetId, offset, limit),
  );
  return {
    ...res.data,
    hasNext: res.data.next,
    hasPrev: res.data.previous,
  };
};
