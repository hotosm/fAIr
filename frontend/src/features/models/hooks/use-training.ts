import { useQuery } from "@tanstack/react-query";
import {
  getTrainingDetailsQueryOptions,
  getTrainingFeedbacksQueryOptions,
  getTrainingHistoryQueryOptions,
  getTrainingStatusQueryOptions,
  getTrainingWorkspaceQueryOptions,
} from "./factory";

export const useTrainingDetails = (id: number) => {
  return useQuery({
    ...getTrainingDetailsQueryOptions(id),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: true,
  });
};

export const useTrainingStatus = (taskId: string) => {
  return useQuery({
    ...getTrainingStatusQueryOptions(taskId),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: true,
  });
};

export const useTrainingFeedbacks = (id: number) => {
  return useQuery({
    ...getTrainingFeedbacksQueryOptions(id),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
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
  });
};

export const useTrainingHistory = (
  modelId: string,
  offset: number,
  limit: number,
) => {
  return useQuery({
    ...getTrainingHistoryQueryOptions(modelId, offset, limit),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: true,
  });
};
