import { queryOptions } from "@tanstack/react-query";
import { getPredictions, getSinglePrediction } from "./get-predictions";

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


export const getSinglePredictionsQuery = (
  predictionId: string,

) => {
  return queryOptions({
    queryKey: ["offline-predictions", predictionId],
    queryFn: () => getSinglePrediction(predictionId),
  });
};
