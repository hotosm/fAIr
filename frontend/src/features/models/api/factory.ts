import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/services";
import {
  getModels,
  getModelDetails,
  getModelsMapData,
} from "@/features/models/api/get-models";
import {
  getTrainingDetails,
  getTrainingFeedbacks,
  getTrainingHistory,
  getTrainingStatus,
  getTrainingWorkspace,
} from "@/features/models/api/get-trainings";

// Models

type TModelQueryOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  searchQuery?: string;
  dateFilters?: Record<string, string>;
  status?: number;
  id?: number;
  userId?: number;
  dataset?: number;
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
  dataset,
}: TModelQueryOptions) => {
  return queryOptions({
    queryKey: [
      "models",
      {
        status,
        searchQuery,
        offset,
        orderBy,
        dateFilters,
        id,
        userId,
        dataset,
      },
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
        dataset,
      ),
    placeholderData: keepPreviousData,
  });
};

export const getModelDetailsQueryOptions = (
  id: string,
  refetchInterval: boolean | number,
  enabled: boolean,
) => {
  return queryOptions({
    queryKey: [QUERY_KEYS.MODEL_DETAILS(id)],
    queryFn: () => getModelDetails(id),
    //@ts-expect-error bad type definition
    refetchInterval: refetchInterval,
    enabled: enabled,
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
  offset: number,
  limit: number,
  ordering: string,
  modelId?: string,
  userId?: number,
) => {
  return queryOptions({
    queryKey: ["training-history", modelId, offset, limit, ordering, userId],
    queryFn: () => getTrainingHistory(offset, limit, ordering, modelId, userId),
    placeholderData: keepPreviousData,
  });
};
