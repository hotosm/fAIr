import { API_ENDPOINTS, apiClient } from "@/services";
import {
  PaginatedTrainings,
  TrainingWorkspace,
  TTrainingDataset,
  TTrainingDetails,
  TTrainingFeedbacks,
  TTrainingStatus,
} from "@/types";

export const getTrainingDetails = async (
  id: number,
): Promise<TTrainingDetails> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_DETAILS(id));
  return res.data;
};

export const getTrainingStatus = async (
  taskId: string,
): Promise<TTrainingStatus> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_STATUS(taskId));
  return res.data;
};

export const getModelTrainingHistory = async (
  id: string,
  offset: number,
  limit: number,
  ordering: string,
): Promise<PaginatedTrainings> => {
  const res = await apiClient.get(
    API_ENDPOINTS.GET_MODEL_TRAINING_HISTORY(id),
    {
      params: {
        limit,
        offset,
        ordering,
      },
    },
  );
  return {
    ...res.data,
    hasNext: res.data.next !== null,
    hasPrev: res.data.previous !== null,
  };
};

export const getTrainingFeedbacks = async (
  id: number,
): Promise<TTrainingFeedbacks> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_FEEDBACKS(id));
  return res.data;
};

export const getTrainingWorkspace = async (
  datasetId: number,
  trainingId: number,
  directory_name: string,
): Promise<TrainingWorkspace> => {
  const res = await apiClient.get(
    API_ENDPOINTS.GET_TRAINING_WORKSPACE(datasetId, trainingId, directory_name),
  );
  return res.data;
};

export const getTrainingDataset = async (
  id: number,
): Promise<TTrainingDataset> => {
  const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_DATASET(id));
  return res.data;
};
