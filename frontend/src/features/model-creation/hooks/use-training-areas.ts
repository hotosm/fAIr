import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getTrainingAreaLabelsQueryOptions,
  getTrainingAreasQueryOptions,
  getTrainingDatasetLabelsQueryOptions,
} from "@/features/model-creation/api/factory";
import { API_ENDPOINTS, MutationConfig } from "@/services";
import {
  createTrainingArea,
  createTrainingAreaLabels,
  TCreateTrainingAreaArgs,
  TCreateTrainingAreaLabelsArgs,
} from "@/features/model-creation/api/create-trainings";
import { deleteTrainingArea } from "@/features/model-creation/api/delete-trainings";
import { TRAINING_LABELS_MIN_ZOOM_LEVEL } from "@/utils";
import axios from "axios";

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
  offset: number;
};

export const useCreateTrainingArea = ({
  mutationConfig,
  datasetId,
  offset,
}: useCreateTrainingAreaOptions) => {
  const { refetch: refetchTrainingAreas } = useGetTrainingAreas(
    datasetId,
    offset,
  );

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
  offset: number;
};

export const useDeleteTrainingArea = ({
  mutationConfig,
  datasetId,
  offset,
}: useDeleteTrainingAreaOptions) => {
  const { refetch: refetchTrainingAreas } = useGetTrainingAreas(
    datasetId,
    offset,
  );

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

type useCreateTrainingAreaLabelOptions = {
  aoiId: number;
  mutationConfig?: MutationConfig<typeof createTrainingAreaLabels>;
  datasetId: number;
  offset: number;
};

export const useCreateTrainingAreaLabels = ({
  mutationConfig,
  datasetId,
  offset,
}: useCreateTrainingAreaLabelOptions) => {
  const { refetch: refetchTrainingAreas } = useGetTrainingAreas(
    datasetId,
    offset,
  );
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TCreateTrainingAreaLabelsArgs) =>
      createTrainingAreaLabels(args),
    onSuccess: (...args) => {
      refetchTrainingAreas();
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};

export const useGetTrainingDatasetLabels = (
  datasetId: number,
  bbox: string,
  currentZoom: number,
) => {
  return useQuery({
    ...getTrainingDatasetLabelsQueryOptions(datasetId, bbox),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    // Don't fetch when the bbox is empty
    enabled: bbox !== "" && currentZoom >= TRAINING_LABELS_MIN_ZOOM_LEVEL,
  });
};

export const useGetTrainingAreaLabels = (aoiId: number, enabled: boolean) => {
  return useQuery({
    ...getTrainingAreaLabelsQueryOptions(aoiId),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error?.response?.status >= 500,
    enabled: enabled,
  });
};

type TOSMDatabaseResponse = {
  lastUpdated: string;
};

export const fetchOSMDatabaseLastUpdated =
  async (): Promise<TOSMDatabaseResponse> => {
    const { data } = await axios.get(
      API_ENDPOINTS.GET_OSM_DATABASE_LAST_UPDATED,
    );
    return data;
  };
