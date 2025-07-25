import useDebounce from "@/hooks/use-debounce";
import { TOfflinePrediction, TQueryParams } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ORDERING_FIELDS } from "@/components/shared/filters/ordering-filter";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getPredictionsQueryOptions } from "@/features/offline-predictions/api/factory";
import { LayoutView } from "@/enums";
import { TOfflinePredictionUpdateArgs, updateOfflinePrediction } from "../api/offline-predictions";
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

export const useUpdateOfflinePrediction = ({ mutationConfig }: useUpdateOfflinePredictionOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TOfflinePredictionUpdateArgs) => updateOfflinePrediction(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};