import { useQuery } from "@tanstack/react-query";
import { getTrainingDatasetQueryOptions } from "../api/factory";

export const useGetTrainingDataset = (id: number) => {
  return useQuery({
    ...getTrainingDatasetQueryOptions(id),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    enabled: id !== undefined,
  });
};
