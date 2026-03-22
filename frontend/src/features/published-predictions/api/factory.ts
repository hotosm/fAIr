import { queryOptions } from "@tanstack/react-query";
import {
  getPublishedPredictions,
  getPublishedPredictionsMapData,
} from "@/features/published-predictions/api/get-published-predictions";

export const getPublishedPredictionsQueryOptions = (
  searchQuery?: string,
  ordering?: string,
  offset?: number,
  id?: number,
) => {
  return queryOptions({
    queryKey: ["published-predictions", searchQuery, ordering, offset, id],
    queryFn: () => getPublishedPredictions(searchQuery, ordering, offset, id),
  });
};

export const getPublishedPredictionsMapDataQueryOptions = () => {
  return queryOptions({
    queryKey: ["published-predictions-centroid"],
    queryFn: getPublishedPredictionsMapData,
  });
};
