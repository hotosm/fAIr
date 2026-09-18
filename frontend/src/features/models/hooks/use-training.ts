import { useQuery } from "@tanstack/react-query";
import {
  getTrainingDetailsQueryOptions,
  getTrainingFeedbacksQueryOptions,
  getTrainingHistoryQueryOptions,
  getTrainingStatusQueryOptions,
  getTrainingWorkspaceQueryOptions,
} from "../api/factory";

export const useTrainingDetails = (
  id: number,
  refetchInterval: boolean | number = false,
) => {
  return useQuery({
    ...getTrainingDetailsQueryOptions(id),
    //@ts-expect-error bad type definition
    refetchInterval: refetchInterval,
    enabled: id !== null,
  });
};

export const useTrainingStatus = (taskId: string) => {
  return useQuery({
    ...getTrainingStatusQueryOptions(taskId),
    refetchInterval: 10000, // 10 seconds
  });
};

export const useTrainingFeedbacks = (id: number) => {
  return useQuery({
    ...getTrainingFeedbacksQueryOptions(id),
    enabled: id !== null,
  });
};
export const useTrainingWorkspace = (
  trainingId: number,
  directory_name = "",
) => {
  return useQuery({
    ...getTrainingWorkspaceQueryOptions(trainingId, directory_name),
    enabled: trainingId !== null,
  });
};

export const useTrainingHistory = (
  offset: number,
  limit: number,
  ordering: string,
  modelId?: string,
  userId?: number,
  enabled?: boolean,
  refetchInterval?: number,
) => {
  return useQuery({
    ...getTrainingHistoryQueryOptions(offset, limit, ordering, modelId, userId),
    refetchInterval: refetchInterval,
    enabled: enabled,
  });
};
