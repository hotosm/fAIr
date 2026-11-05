import { useAuth } from "@/app/providers/auth-provider";
import { useGetPredictions } from "@/features/user-profile/hooks/use-predictions";
import { TOfflinePrediction } from "@/types";

/** Number of most-recent map requests shown on the Overview page. */
export const RECENT_MAP_REQUESTS_LIMIT = 3;

/**
 * Loads the current user's most recent prediction (map) requests for the
 * Overview page, newest first. This is the same data source as the full
 * Prediction Requests page, just trimmed to the latest few.
 */
export const useRecentMapRequests = (limit = RECENT_MAP_REQUESTS_LIMIT) => {
  const { user } = useAuth();

  const { data, isPending, isError } = useGetPredictions(
    undefined,
    "-id",
    user?.osm_id,
    0,
  );

  const requests: TOfflinePrediction[] = (data?.results ?? []).slice(0, limit);

  return {
    requests,
    isPending,
    isError,
    isEmpty: !isPending && !isError && requests.length === 0,
  };
};
