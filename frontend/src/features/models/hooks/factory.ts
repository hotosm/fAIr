import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import {
  getModels,
  getModelDetails,
  getModelsMapData,
} from "@/features/models/api/get-models";
import {
  getModelTrainingHistory,
  getTrainingDetails,
  getTrainingFeedbacks,
  getTrainingStatus,
  getTrainingWorkspace,
} from "@/features/models/api/get-trainings";

// Models

type TModelQueryOptions = {
  limit: number;
  offset: number;
  orderBy: string;
  searchQuery: string;
  dateFilters: Record<string, string>;
  status: number;
  id: number;
};

export const getModelsQueryOptions = ({
  status,
  searchQuery,
  limit,
  offset,
  orderBy,
  dateFilters,
  id,
}: TModelQueryOptions) => {
  return queryOptions({
    queryKey: [
      "models",
      { status, searchQuery, offset, orderBy, dateFilters, id },
    ],
    queryFn: () =>
      getModels(limit, offset, orderBy, status, searchQuery, dateFilters, id),
    placeholderData: keepPreviousData,
  });
};

export const getModelDetailsQueryOptions = (id: string) => {
  return queryOptions({
    queryKey: ["model-details", id],
    queryFn: () => getModelDetails(id),
  });
};

export const getModelsMapDataQueryOptions = () => {
  return queryOptions({
    queryKey: ["models-centroid"],
    queryFn: getModelsMapData,
  });
};

// Training

export const getTrainingDetailsQueryOptions = (id: number) => {
  return queryOptions({
    queryKey: ["training-details", id],
    queryFn: () => getTrainingDetails(id),
  });
};

export const getTrainingStatusQueryOptions = (taskId: string) => {
  return queryOptions({
    queryKey: ["training-status", taskId],
    queryFn: () => getTrainingStatus(taskId),
  });
};

export const getTrainingFeedbacksQueryOptions = (id: number) => {
  return queryOptions({
    queryKey: ["training-feedbacks", id],
    queryFn: () => getTrainingFeedbacks(id),
  });
};

export const getTrainingWorkspaceQueryOptions = (
  datasetId: number,
  trainingId: number,
  directory_name: string,
) => {
  return queryOptions({
    queryKey: ["training-workspace", datasetId, trainingId, directory_name],
    queryFn: () => getTrainingWorkspace(datasetId, trainingId, directory_name),
  });
};

export const getTrainingHistoryQueryOptions = (
  modelId: string,
  offset: number,
  limit: number,
) => {
  return queryOptions({
    queryKey: ["training-history", modelId, offset, limit],
    queryFn: () => getModelTrainingHistory(modelId, offset, limit),
    placeholderData: keepPreviousData,
  });
};
