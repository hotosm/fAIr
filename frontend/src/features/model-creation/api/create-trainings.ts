import { API_ENDPOINTS, apiClient } from "@/services";
import { TTrainingAreaFeature, TTrainingDataset } from "@/types";

export type TCreateTrainingDatasetArgs = {
  name: string;
  source_imagery: string;
  status?: number;
};

export const createTrainingDataset = async ({
  name,
  source_imagery,
  status = 0,
}: TCreateTrainingDatasetArgs): Promise<TTrainingDataset> => {
  return await (
    await apiClient.post(`${API_ENDPOINTS.CREATE_TRAINING_DATASETS}`, {
      name,
      source_imagery,
      status,
    })
  ).data;
};

export type TCreateTrainingAreaArgs = {
  dataset: string;
  geom: string;
};

export const createTrainingArea = async ({
  dataset,
  geom,
}: TCreateTrainingAreaArgs): Promise<TTrainingAreaFeature> => {
  return await (
    await apiClient.post(`${API_ENDPOINTS.CREATE_TRAINING_AREA}`, {
      dataset,
      geom,
    })
  ).data;
};
