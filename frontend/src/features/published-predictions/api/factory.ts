import { queryOptions } from "@tanstack/react-query";
import { getPublishedPredictions } from "@/features/published-predictions/api/get-published-predictions";

export const getPublishedPredictionsQueryOptions = (
  searchQuery?: string,
  ordering?: string,
  offset?: number,
) => {
  return queryOptions({
    queryKey: ["published-predictions", searchQuery, ordering, offset],
    queryFn: () => getPublishedPredictions(searchQuery, ordering, offset),
  });
};
