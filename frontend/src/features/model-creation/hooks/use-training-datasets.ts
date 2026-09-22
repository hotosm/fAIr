import { useMutation } from "@tanstack/react-query";
import { MutationConfig } from "@/services";
import {
  createTrainingDataset,
  TCreateTrainingDatasetArgs,
  TUpdateTrainingDatasetArgs,
  updateTrainingDataset,
} from "@/features/model-creation/api/create-trainings";
import { useGetTrainingDataset } from "@/features/datasets/hooks/use-datasets";

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

type useUpdateTrainingDatasetOptions = {
  datasetId: number;
  mutationConfig?: MutationConfig<typeof updateTrainingDataset>;
};

export const useUpdateTrainingDataset = ({
  mutationConfig,
  datasetId,
}: useUpdateTrainingDatasetOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  const { refetch } = useGetTrainingDataset(datasetId);
  return useMutation({
    mutationFn: (args: TUpdateTrainingDatasetArgs) =>
      updateTrainingDataset(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
      refetch();
    },
    ...restConfig,
  });
};
