import { useQuery } from "@tanstack/react-query";
import {
  getTrainingDetailsQueryOptions,
  getTrainingFeedbacksQueryOptions,
  getTrainingHistoryQueryOptions,
  getTrainingStatusQueryOptions,
  getTrainingWorkspaceQueryOptions,
} from "../api/factory";

export const useTrainingDetails = (id: number, refetchInterval: boolean | number = false) => {
  return useQuery({
    ...getTrainingDetailsQueryOptions(id),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    //@ts-expect-error bad type definition
    refetchInterval: refetchInterval,
    enabled: id !== null,
  });
};

export const useTrainingStatus = (taskId: string) => {
  return useQuery({
    ...getTrainingStatusQueryOptions(taskId),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    refetchInterval: 10000, // 10 seconds
  });
};

export const useTrainingFeedbacks = (id: number) => {
  return useQuery({
    ...getTrainingFeedbacksQueryOptions(id),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    enabled: id !== null,
  });
};
export const useTrainingWorkspace = (
  datasetId: number,
  trainingId: number,
  directory_name = "",
) => {
  return useQuery({
    ...getTrainingWorkspaceQueryOptions(datasetId, trainingId, directory_name),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    enabled: trainingId !== null,
  });
};

export const useTrainingHistory = (
  modelId: string,
  offset: number,
  limit: number,
  ordering: string,
) => {
  return useQuery({
    ...getTrainingHistoryQueryOptions(modelId, offset, limit, ordering),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    refetchInterval: 10000, // 10 seconds
  });
};
