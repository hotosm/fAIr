import { queryOptions } from "@tanstack/react-query";
import { getPredictions } from "@/features/offline-predictions/api/get-predictions";

export const getPredictionsQueryOptions = (
  searchQuery?: string,
  ordering?: string,
  userId?: number,
  offset?: number,
) => {
  return queryOptions({
    queryKey: ["offline-predictions", searchQuery, ordering, userId, offset],
    queryFn: () => getPredictions(searchQuery, ordering, userId, offset),
    refetchInterval: 10000, // 10 seconds
  });
};
