import { API_ENDPOINTS, apiClient } from "@/services";
import {
  FeatureCollection,
  PaginatedTrainingArea,
  TTrainingAreaFeature,
  TTrainingDataset,
} from "@/types";

export const getTrainingDatasets = async (
  searchQuery: string,
  ordering: string = "-id",
): Promise<TTrainingDataset[]> => {
  const res = await apiClient.get(
    API_ENDPOINTS.GET_TRAINING_DATASETS(searchQuery, ordering),
  );
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

export const getTrainingDatasetLabels = async (
  aoiDatasetId: number,
  bbox: string,
): Promise<FeatureCollection> => {
  const res = await apiClient.get(
    API_ENDPOINTS.GET_TRAINING_DATASET_LABELS(aoiDatasetId, bbox),
  );
  return res.data;
};

export const getTrainingAreaLabels = async (
  aoiId: number,
): Promise<FeatureCollection> => {
  const res = await apiClient.get(
    API_ENDPOINTS.GET_TRAINING_AREA_LABELS(aoiId),
  );
  return res.data;
};

export const getTrainingArea = async (
  aoiId: number,
): Promise<TTrainingAreaFeature> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_AREA(aoiId));
  return res.data;
};
