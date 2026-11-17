import { queryOptions } from "@tanstack/react-query";
import { PredictionRequestStatus } from "@/enums";
import { TOfflinePrediction } from "@/types";
import { getPredictions, getSinglePrediction } from "./get-predictions";

const FINISHED_STATUSES: string[] = [
  PredictionRequestStatus.COMPLETED,
  PredictionRequestStatus.FAILED,
  PredictionRequestStatus.CANCELLED,
];

/** The run is over and, if it completed, its result is ready. */
export const isSettled = ({ status, results_ready }: TOfflinePrediction) =>
  FINISHED_STATUSES.includes(status) &&
  (status !== PredictionRequestStatus.COMPLETED || results_ready);

export const getPredictionsQueryOptions = (
  searchQuery?: string,
  ordering?: string,
  userId?: number,
  offset?: number,
) => {
  return queryOptions({
    queryKey: ["offline-predictions", searchQuery, ordering, userId, offset],
    queryFn: () => getPredictions(searchQuery, ordering, userId, offset),
    refetchInterval: (query) =>
      query.state.data?.results.every(isSettled) ? false : 10000,
  });
};

export const getSinglePredictionsQuery = (predictionId: string) => {
  return queryOptions({
    queryKey: ["offline-predictions", predictionId],
    queryFn: () => getSinglePrediction(predictionId),
  });
};
