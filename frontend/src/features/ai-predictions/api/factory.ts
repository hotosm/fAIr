import { queryOptions } from "@tanstack/react-query";
import { getAIPredictions, getAIPredictionsMapData } from "./get-ai-predictions";

export const getAIPredictionsQueryOptions = (
  searchQuery?: string,
  ordering?: string,
  offset?: number,
  id?: number,
) => {
  return queryOptions({
    queryKey: ["ai-predictions", searchQuery, ordering, offset, id],
    queryFn: () => getAIPredictions(searchQuery, ordering, offset, id),
  });
};

export const getAIPredictionsMapDataQueryOptions = () => {
  return queryOptions({
    queryKey: ["ai-predictions-centroid"],
    queryFn: getAIPredictionsMapData,
  });
};
