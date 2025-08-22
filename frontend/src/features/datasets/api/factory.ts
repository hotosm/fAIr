import { queryOptions } from "@tanstack/react-query";
import {
  getDatasetsMapData,
  getTrainingDataset,
  getTrainingDatasetsV2,
} from "./get-datasets";

export const getTrainingDatasetQueryOptions = (id: number) => {
  return queryOptions({
    queryKey: ["training-dataset", id],
    queryFn: () => getTrainingDataset(id),
  });
};

export const getTrainingDatasetsQueryOptionsV2 = (
  searchQuery?: string,
  ordering?: string,
  userId?: number,
  offset?: number,
  id?: number,
) => {
  return queryOptions({
    queryKey: [
      "training-datasets-v2",
      searchQuery,
      ordering,
      userId,
      offset,
      id,
    ],
    queryFn: () =>
      getTrainingDatasetsV2(searchQuery, ordering, userId, offset, id),
  });
};

export const getDatasetsMapDataQueryOptions = () => {
  return queryOptions({
    queryKey: ["datasets-centroid"],
    queryFn: getDatasetsMapData,
  });
};
