import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getTrainingAreas, getTrainingDatasets } from "./get-trainings";
import { createTrainingDataset } from "./create-trainings";
import { TTrainingDataset } from "@/types";
import { getTMSTileJSON } from "./get-tms-tilejson";

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
