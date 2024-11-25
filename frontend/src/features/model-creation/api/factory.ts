import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  getTrainingAreaLabels,
  getTrainingAreas,
  getTrainingDatasetLabels,
  getTrainingDatasets,
} from "@/features/model-creation/api/get-trainings";
import { createTrainingDataset } from "@/features/model-creation/api/create-trainings";
import { TTrainingDataset } from "@/types";
import { getTMSTileJSON } from "@/features/model-creation/api/get-tms-tilejson";

export const getTrainingDatasetsQueryOptions = (searchQuery: string) => {
  return queryOptions({
    queryKey: ["training-datasets", searchQuery],
    queryFn: () => getTrainingDatasets(searchQuery),
  });
};

export const getTrainingAreasQueryOptions = (
  datasetId: number,
  offset: number,
) => {
  return queryOptions({
    queryKey: ["training-areas", datasetId, offset],
    queryFn: () => getTrainingAreas(datasetId, offset),
    placeholderData: keepPreviousData,
  });
};

export const getTMSTileJSONQueryOptions = (url: string) => {
  return queryOptions({
    queryKey: ["tms-tile-json", url],
    queryFn: () => getTMSTileJSON(url),
  });
};

export const createTrainingDatasetsQueryOptions = ({
  name,
  source_imagery,
}: TTrainingDataset) => {
  return queryOptions({
    queryKey: ["create-training-datasets", source_imagery, name],
    queryFn: () => createTrainingDataset({ name, source_imagery }),
  });
};

export const getTrainingDatasetLabelsQueryOptions = (
  aoiDatasetId: number,
  bbox: string,
) => {
  return queryOptions({
    queryKey: ["training-dataset-labels", aoiDatasetId, bbox],
    queryFn: () => getTrainingDatasetLabels(aoiDatasetId, bbox),
  });
};

export const getTrainingAreaLabelsQueryOptions = (aoiId: number) => {
  return queryOptions({
    queryKey: ["training-area-labels", aoiId],
    queryFn: () => getTrainingAreaLabels(aoiId),
  });
};
