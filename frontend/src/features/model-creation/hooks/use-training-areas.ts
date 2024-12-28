import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getTrainingAreaLabelsQueryOptions,
  getTrainingAreaQueryOptions,
  getTrainingAreasQueryOptions,
  getTrainingDatasetLabelsQueryOptions,
} from "@/features/model-creation/api/factory";
import { API_ENDPOINTS, MutationConfig } from "@/services";
import {
  createTrainingArea,
  createTrainingLabelsForAOI,
  getTrainingAreaLabelsFromOSM,
  TCreateTrainingAreaArgs,
  TCreateTrainingLabelsForAOIArgs,
  TGetTrainingAreaLabelsFromOSMArgs,
} from "@/features/model-creation/api/create-trainings";
import { deleteTrainingArea } from "@/features/model-creation/api/delete-trainings";
import { MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS } from "@/constants";
import axios from "axios";

export const useGetTrainingAreas = (datasetId: number, offset: number) => {
  return useQuery({
    ...getTrainingAreasQueryOptions(datasetId, offset),
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

type useCreateTrainingLabelsForAOIOptions = {
  mutationConfig?: MutationConfig<typeof createTrainingLabelsForAOI>;
};

export const useCreateTrainingLabelsForAOI = ({
  mutationConfig,
}: useCreateTrainingLabelsForAOIOptions) => {
  // fetch training labels for the aoi
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TCreateTrainingLabelsForAOIArgs) =>
      createTrainingLabelsForAOI(args),
    onSuccess: (...args) => {
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

type useGetTrainingAreaLabelsFromOSMOptions = {
  aoiId: number;
  mutationConfig?: MutationConfig<typeof getTrainingAreaLabelsFromOSM>;
  datasetId: number;
  offset: number;
};

export const useGetTrainingAreaLabelsFromOSM = ({
  mutationConfig,
  datasetId,
  offset,
}: useGetTrainingAreaLabelsFromOSMOptions) => {
  const { refetch: refetchTrainingAreas } = useGetTrainingAreas(
    datasetId,
    offset,
  );
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TGetTrainingAreaLabelsFromOSMArgs) =>
      getTrainingAreaLabelsFromOSM(args),
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
    // Don't fetch when the bbox is empty
    enabled:
      bbox !== "" && currentZoom >= MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,
  });
};

export const useGetTrainingAreaLabels = (aoiId: number, enabled: boolean) => {
  return useQuery({
    ...getTrainingAreaLabelsQueryOptions(aoiId),
    enabled: enabled,
  });
};

export const useGetTrainingArea = (
  aoiId: number,
  enabled: boolean,
  refetchInterval: number,
) => {
  return useQuery({
    ...getTrainingAreaQueryOptions(aoiId),
    enabled: enabled,
    refetchInterval: refetchInterval,
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
