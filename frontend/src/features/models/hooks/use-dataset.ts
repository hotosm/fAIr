import { useQuery } from "@tanstack/react-query";
import { getTrainingDatasetQueryOptions } from "../api/factory";

export const useGetTrainingDataset = (id: number, enabled: boolean = !!id) => {
  return useQuery({
    ...getTrainingDatasetQueryOptions(id),
    enabled: enabled,
  });
};
