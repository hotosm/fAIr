import { useQuery } from "@tanstack/react-query";
import {
  getDatasetsMapDataQueryOptions,
  getTrainingDatasetQueryOptions,
  getTrainingDatasetsQueryOptionsV2,
} from "@/features/datasets/api/factory";

export const useGetTrainingDataset = (id: number, enabled: boolean = !!id) => {
  return useQuery({
    ...getTrainingDatasetQueryOptions(id),
    enabled: enabled,
  });
};

export const useGetTrainingDatasetsV2 = (
  searchQuery?: string,
  ordering?: string,
  userId?: number,
  offset?: number,
  id?: number,
) => {
  return useQuery({
    ...getTrainingDatasetsQueryOptionsV2(
      searchQuery,
      ordering,
      userId,
      offset,
      id,
    ),
  });
};

export const useDatasetsMapData = () => {
  return useQuery({
    ...getDatasetsMapDataQueryOptions(),
  });
};
