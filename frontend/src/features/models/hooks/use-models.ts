import { useQuery } from "@tanstack/react-query";
import {
  getModelsQueryOptions,
  getModelDetailsQueryOptions,
  getModelsMapDataQueryOptions,
} from "@/features/models/api/factory";
import { useSearchParams } from "react-router-dom";
import { SEARCH_PARAMS } from "@/app/routes/models/models-list";
import { ORDERING_FIELDS } from "@/features/models/components/filters/ordering-filter";
import { TQueryParams } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { buildDateFilterQueryString } from "@/utils";
import { PAGE_LIMIT } from "@/components/shared";
import { dateFilters } from "@/features/models/components/filters/date-range-filter";
import useDebounce from "@/hooks/use-debounce";
import { LayoutView } from "@/enums";

type UseModelsOptions = {
  limit: number;
  offset: number;
  orderBy: string;
  searchQuery: string;
  dateFilters: Record<string, string>;
  status: number;
  id: number;
  userId?: number;
};

export const useModels = ({
  limit,
  offset,
  status,
  orderBy,
  searchQuery,
  dateFilters,
  id,
  userId,
}: UseModelsOptions) => {
  return useQuery({
    ...getModelsQueryOptions({
      limit,
      offset,
      orderBy,
      status,
      searchQuery,
      dateFilters,
      id,
      userId,
    }),
  });
};

export const useModelDetails = (
  id: string,
  enabled: boolean = true,
  refetchInterval: boolean | number = false,
) => {
  return useQuery({
    ...getModelDetailsQueryOptions(id, refetchInterval),
    retry: (_, error) => {
      // When a model is not found, don't retry.
      //@ts-expect-error bad type definition
      return error.response?.status !== 404;
    },
    enabled: enabled,
  });
};

export const useModelsMapData = () => {
  return useQuery({
    ...getModelsMapDataQueryOptions(),
  });
};

export const useModelsListFilters = (
  status: number | undefined,
  userId?: number,
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultQueries = {
    [SEARCH_PARAMS.offset]: 0,
    [SEARCH_PARAMS.searchQuery]:
      searchParams.get(SEARCH_PARAMS.searchQuery) || "",
    [SEARCH_PARAMS.ordering]:
      searchParams.get(SEARCH_PARAMS.ordering) ||
      (ORDERING_FIELDS[1].apiValue as string),
    [SEARCH_PARAMS.mapIsActive]:
      searchParams.get(SEARCH_PARAMS.mapIsActive) || false,
    [SEARCH_PARAMS.startDate]: searchParams.get(SEARCH_PARAMS.startDate) || "",
    [SEARCH_PARAMS.endDate]: searchParams.get(SEARCH_PARAMS.endDate) || "",
    [SEARCH_PARAMS.dateFilter]:
      searchParams.get(SEARCH_PARAMS.dateFilter) || dateFilters[0].searchParams,
    [SEARCH_PARAMS.layout]:
      searchParams.get(SEARCH_PARAMS.layout) || LayoutView.GRID,
    [SEARCH_PARAMS.id]: searchParams.get(SEARCH_PARAMS.id) || "",
    // Status will be undefined for 'all' status filter in users models, so exclude it from the api call.
    ...(status !== undefined && {
      [SEARCH_PARAMS.status]: searchParams.get(SEARCH_PARAMS.status) || status,
    }),
  };
  const [query, setQuery] = useState<TQueryParams>(defaultQueries);

  const debouncedSearchText = useDebounce(
    query[SEARCH_PARAMS.searchQuery] as string,
    300,
  );

  const { data, isPending, isPlaceholderData, isError } = useModels({
    searchQuery: debouncedSearchText,
    limit: PAGE_LIMIT,
    offset: query[SEARCH_PARAMS.offset] as number,
    orderBy: query[SEARCH_PARAMS.ordering] as string,
    id: query[SEARCH_PARAMS.id] as number,
    dateFilters: buildDateFilterQueryString(
      dateFilters.find(
        (filter) => filter.searchParams === query[SEARCH_PARAMS.dateFilter],
      ),
      query[SEARCH_PARAMS.startDate] as string,
      query[SEARCH_PARAMS.endDate] as string,
    ),
    userId: userId,
    status: query[SEARCH_PARAMS.status] as number,
  });

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

  //reset offset back to 0 when searching or when ID filtering is applied from the map.
  useEffect(() => {
    if (
      (query[SEARCH_PARAMS.searchQuery] !== "" ||
        query[SEARCH_PARAMS.id] !== "") &&
      (query[SEARCH_PARAMS.offset] as number) > 0
    ) {
      updateQuery({ [SEARCH_PARAMS.offset]: 0 });
    }
  }, [query]);

  useEffect(() => {
    const newQuery = {
      [SEARCH_PARAMS.offset]: defaultQueries[SEARCH_PARAMS.offset],
      [SEARCH_PARAMS.ordering]: defaultQueries[SEARCH_PARAMS.ordering],
      [SEARCH_PARAMS.mapIsActive]: defaultQueries[SEARCH_PARAMS.mapIsActive],
      [SEARCH_PARAMS.startDate]: defaultQueries[SEARCH_PARAMS.startDate],
      [SEARCH_PARAMS.endDate]: defaultQueries[SEARCH_PARAMS.endDate],
      [SEARCH_PARAMS.dateFilter]: defaultQueries[SEARCH_PARAMS.dateFilter],
      [SEARCH_PARAMS.layout]: defaultQueries[SEARCH_PARAMS.layout],
      [SEARCH_PARAMS.searchQuery]: defaultQueries[SEARCH_PARAMS.searchQuery],
      [SEARCH_PARAMS.id]: defaultQueries[SEARCH_PARAMS.id],
      [SEARCH_PARAMS.status]: defaultQueries[SEARCH_PARAMS.status],
    };
    setQuery(newQuery);
  }, []);

  const mapViewIsActive = query[SEARCH_PARAMS.mapIsActive]

  const clearAllFilters = useCallback(() => {
    const resetParams = new URLSearchParams();
    setSearchParams(resetParams);
    setQuery((prev) => ({
      // Preserve existing query params
      ...prev,
      // Clear only the filter fields
      [SEARCH_PARAMS.searchQuery]: "",
      [SEARCH_PARAMS.startDate]: "",
      [SEARCH_PARAMS.endDate]: "",
      [SEARCH_PARAMS.id]: "",
    }));
  }, []);

  return {
    query,
    data,
    isPending,
    isPlaceholderData,
    isError,
    updateQuery,
    mapViewIsActive,
    clearAllFilters,
  };
};
