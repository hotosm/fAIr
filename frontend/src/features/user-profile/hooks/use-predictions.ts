import useDebounce from "@/hooks/use-debounce";
import { TQueryParams } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ORDERING_FIELDS } from "@/components/shared/filters/ordering-filter";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPredictionsQueryOptions } from "@/features/user-profile/api/factory";
import { getSinglePrediction } from "@/features/user-profile/api/get-predictions";
import { TOfflinePrediction } from "@/types";
import { LayoutView } from "@/enums";
import {
  TOfflinePredictionUpdateArgs,
  updateOfflinePrediction,
} from "../api/offline-predictions";
import { MutationConfig } from "@/services";

export const useGetPredictions = (
  searchQuery?: string,
  ordering?: string,
  userId?: number,
  offset?: number,
) => {
  return useQuery({
    ...getPredictionsQueryOptions(searchQuery, ordering, userId, offset),
  });
};

/**
 * Fetches a single prediction request by id. `initialData` (e.g. the row the
 * user clicked) lets the results page render instantly and stay refresh-safe.
 *
 * staleTime and refetchOnWindowFocus are disabled because this is used on the
 * result page: we don't want the geojsonUrl to change under the map every time
 * the user switches browser tabs, which would bust the GeoJSON query cache and
 * flash a loading state.
 */
export const useGetSinglePrediction = (
  predictionId?: string | number,
  initialData?: TOfflinePrediction,
) => {
  const id = predictionId !== undefined ? String(predictionId) : undefined;
  return useQuery({
    queryKey: ["prediction", id],
    queryFn: () => getSinglePrediction(id as string),
    enabled: id !== undefined,
    initialData,
    // Keep the prediction data stable so derived values (geojsonUrl, bounds)
    // don't change on tab-switch, which would bust downstream query caches.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

export const useOfflinePredictionsQueryParams = (userId?: number) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultQueries = {
    [SEARCH_PARAMS.offset]: 0,
    [SEARCH_PARAMS.searchQuery]:
      searchParams.get(SEARCH_PARAMS.searchQuery) || "",
    [SEARCH_PARAMS.ordering]:
      searchParams.get(SEARCH_PARAMS.ordering) ||
      (ORDERING_FIELDS[1].apiValue as string),
    [SEARCH_PARAMS.layout]:
      searchParams.get(SEARCH_PARAMS.layout) || LayoutView.LIST,
  };

  const [query, setQuery] = useState<TQueryParams>(defaultQueries);

  const debouncedSearchText = useDebounce(
    query[SEARCH_PARAMS.searchQuery] as string,
    300,
  );

  const { isPending, isError, data, refetch, isPlaceholderData } =
    useGetPredictions(
      debouncedSearchText.length > 0 ? debouncedSearchText : undefined,
      query[SEARCH_PARAMS.ordering] as string,
      userId !== undefined ? userId : undefined,
      query[SEARCH_PARAMS.offset] !== undefined
        ? (query[SEARCH_PARAMS.offset] as number)
        : undefined,
    );

  const updateQuery = useCallback(
    (newParams: TQueryParams) => {
      setQuery((prevQuery) => ({
        ...prevQuery,
        ...newParams,
      }));
      const updatedParams = new URLSearchParams(searchParams);

      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          updatedParams.set(key, String(value));
        } else {
          updatedParams.delete(key);
        }
      });

      setSearchParams(updatedParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  //reset offset back to 0 when searching.
  useEffect(() => {
    if (
      query[SEARCH_PARAMS.searchQuery] !== "" &&
      (query[SEARCH_PARAMS.offset] as number) > 0
    ) {
      updateQuery({ [SEARCH_PARAMS.offset]: 0 });
    }
  }, [[query[SEARCH_PARAMS.searchQuery], query[SEARCH_PARAMS.offset]]]);

  useEffect(() => {
    const newQuery = {
      [SEARCH_PARAMS.offset]: defaultQueries[SEARCH_PARAMS.offset],
      [SEARCH_PARAMS.ordering]: defaultQueries[SEARCH_PARAMS.ordering],
      [SEARCH_PARAMS.searchQuery]: defaultQueries[SEARCH_PARAMS.searchQuery],
      [SEARCH_PARAMS.layout]: defaultQueries[SEARCH_PARAMS.layout],
    };
    setQuery(newQuery);
  }, []);

  const clearAllFilters = useCallback(() => {
    const resetParams = new URLSearchParams();
    setSearchParams(resetParams);
    setQuery((prev) => ({
      // Preserve existing query params
      ...prev,
      // Clear only the filter fields
      [SEARCH_PARAMS.searchQuery]: "",
    }));
  }, []);

  return {
    query,
    data,
    isPending,
    isPlaceholderData,
    isError,
    updateQuery,
    refetch,
    clearAllFilters,
  };
};

type useUpdateOfflinePredictionOptions = {
  mutationConfig?: MutationConfig<typeof updateOfflinePrediction>;
};

export const useUpdateOfflinePrediction = ({
  mutationConfig,
}: useUpdateOfflinePredictionOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: TOfflinePredictionUpdateArgs) =>
      updateOfflinePrediction(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
      // Refectch the prediction requests to sync the table.
      queryClient.invalidateQueries({ queryKey: ["prediction-requests"] });
    },
    ...restConfig,
  });
};
