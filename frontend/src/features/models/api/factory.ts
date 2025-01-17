import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/services";
import {
  getModels,
  getModelDetails,
  getModelsMapData,
} from "@/features/models/api/get-models";
import {
  getModelTrainingHistory,
  getTrainingDataset,
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
  userId?: number;
};

export const getModelsQueryOptions = ({
  status,
  searchQuery,
  limit,
  offset,
  orderBy,
  dateFilters,
  id,
  userId,
}: TModelQueryOptions) => {
  return queryOptions({
    queryKey: [
      "models",
      { status, searchQuery, offset, orderBy, dateFilters, id, userId },
    ],
    queryFn: () =>
      getModels(
        limit,
        offset,
        orderBy,
        status,
        searchQuery,
        dateFilters,
        id,
        userId,
      ),
    placeholderData: keepPreviousData,
  });
};

export const getModelDetailsQueryOptions = (
  id: string,
  refetchInterval: boolean | number,
) => {
  return queryOptions({
    queryKey: [queryKeys.MODEL_DETAILS(id)],
    queryFn: () => getModelDetails(id),
    //@ts-expect-error bad type definition
    refetchInterval: refetchInterval,
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
    refetchInterval: 10000,
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
  trainingId: number,
  directory_name: string,
) => {
  return queryOptions({
    queryKey: ["training-workspace", trainingId, directory_name],
    queryFn: () => getTrainingWorkspace(trainingId, directory_name),
    enabled: trainingId !== null,
  });
};

export const getTrainingHistoryQueryOptions = (
  modelId: string,
  offset: number,
  limit: number,
  ordering: string,
) => {
  return queryOptions({
    queryKey: ["training-history", modelId, offset, limit, ordering],
    queryFn: () => getModelTrainingHistory(modelId, offset, limit, ordering),
    placeholderData: keepPreviousData,
    refetchInterval: 10000,
  });
};

export const getTrainingDatasetQueryOptions = (id: number) => {
  return queryOptions({
    queryKey: ["training-dataset", id],
    queryFn: () => getTrainingDataset(id),
  });
};
