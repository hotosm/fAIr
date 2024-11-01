import { useMutation, useQuery } from "@tanstack/react-query";
import { getTrainingDatasetsQueryOptions } from "../api/factory";
import { MutationConfig } from "@/services";
import {
  createTrainingDataset,
  TCreateTrainingDatasetArgs,
} from "../api/create-trainings";

export const useGetTrainingDatasets = () => {
  return useQuery({
    ...getTrainingDatasetsQueryOptions(),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
  });
};

type useCreateTrainingDatasetOptions = {
  mutationConfig?: MutationConfig<typeof createTrainingDataset>;
};

export const useCreateTrainingDataset = ({
  mutationConfig,
}: useCreateTrainingDatasetOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TCreateTrainingDatasetArgs) =>
      createTrainingDataset(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
