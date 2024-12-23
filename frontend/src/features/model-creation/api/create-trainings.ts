import { API_ENDPOINTS, apiClient } from "@/services";
import {
  TTrainingAreaFeature,
  TTrainingDataset,
  TTrainingDetails,
} from "@/types";
import { AxiosProgressEvent } from "axios";

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
    await apiClient.post(API_ENDPOINTS.CREATE_TRAINING_DATASET, {
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
    await apiClient.post(API_ENDPOINTS.CREATE_TRAINING_AREA, {
      dataset,
      geom,
    })
  ).data;
};

export type TCreateTrainingRequestArgs = {
  batch_size: number;
  epochs: number;
  input_boundary_width: number;
  input_contact_spacing: number;
  model: string;
  zoom_level: number[];
};

export const createTrainingRequest = async ({
  batch_size,
  epochs,
  input_boundary_width,
  input_contact_spacing,
  model,
  zoom_level,
}: TCreateTrainingRequestArgs): Promise<TTrainingDetails> => {
  return await (
    await apiClient.post(API_ENDPOINTS.CREATE_TRAINING_REQUEST, {
      batch_size,
      epochs,
      description: "",
      freeze_layer: false,
      input_contact_spacing,
      input_boundary_width,
      model,
      multimask: false,
      zoom_level,
    })
  ).data;
};

export type TGetTrainingAreaLabelsFromOSMArgs = {
  aoiId: number;
};

export const getTrainingAreaLabelsFromOSM = async ({
  aoiId,
}: TGetTrainingAreaLabelsFromOSMArgs): Promise<String> => {
  return await (
    await apiClient.post(API_ENDPOINTS.GET_TRAINING_AREA_LABELS_FROM_OSM(aoiId))
  ).data;
};

export type TCreateTrainingLabelsForAOIArgs = {
  aoiId: number;
  geom: string;
  onUploadProgress?: (e: AxiosProgressEvent) => void;
};

export const createTrainingLabelsForAOI = async ({
  aoiId,
  geom,
  onUploadProgress,
}: TCreateTrainingLabelsForAOIArgs): Promise<String> => {
  return await (
    await apiClient.post(
      API_ENDPOINTS.CREATE_TRAINING_AREA_LABELS,
      {
        aoi: aoiId,
        geom: geom,
      },
      {
        onUploadProgress,
      },
    )
  ).data;
};
