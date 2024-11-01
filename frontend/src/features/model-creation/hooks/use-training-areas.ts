import { useMutation, useQuery } from "@tanstack/react-query";
import { getTrainingAreasQueryOptions } from "../api/factory";
import { MutationConfig } from "@/services";
import {
  createTrainingArea,
  TCreateTrainingAreaArgs,
} from "../api/create-trainings";
import { deleteTrainingArea } from "../api/delete-trainings";

export const useGetTrainingAreas = (datasetId: number, offset: number) => {
  return useQuery({
    ...getTrainingAreasQueryOptions(datasetId, offset),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
  });
};

type useCreateTrainingAreaOptions = {
  mutationConfig?: MutationConfig<typeof createTrainingArea>;
  datasetId: number;
};

export const useCreateTrainingArea = ({
  mutationConfig,
  datasetId,
}: useCreateTrainingAreaOptions) => {
  const { refetch: refetchTrainingAreas } = useGetTrainingAreas(datasetId, 0);

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TCreateTrainingAreaArgs) => createTrainingArea(args),
    onSuccess: (...args) => {
      refetchTrainingAreas();

      onSuccess?.(...args);
    },
    ...restConfig,
  });
};

type useDeleteTrainingAreaOptions = {
  mutationConfig?: MutationConfig<typeof deleteTrainingArea>;
  datasetId: number;
};

export const useDeleteTrainingArea = ({
  mutationConfig,
  datasetId,
}: useDeleteTrainingAreaOptions) => {
  const { refetch: refetchTrainingAreas } = useGetTrainingAreas(datasetId, 0);

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (trainingAreaId) => deleteTrainingArea(trainingAreaId),
    onSuccess: (...args) => {
      refetchTrainingAreas();
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
