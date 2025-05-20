import useDebounce from "@/hooks/use-debounce";
import { TQueryParams } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetTrainingDatasetsV2 } from "./use-datasets";
import { ORDERING_FIELDS } from "@/components/shared/filters/ordering-filter";
import { SEARCH_PARAMS } from "@/utils/search-params";

export const useDatasetsQueryParams = (userId?: number) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultQueries = {
    [SEARCH_PARAMS.offset]: 0,
    [SEARCH_PARAMS.searchQuery]:
      searchParams.get(SEARCH_PARAMS.searchQuery) || "",
    [SEARCH_PARAMS.ordering]:
      searchParams.get(SEARCH_PARAMS.ordering) ||
      (ORDERING_FIELDS[1].apiValue as string),
    [SEARCH_PARAMS.mapIsActive]:
      Boolean(searchParams.get(SEARCH_PARAMS.mapIsActive)) ||
      false,
  };

  const [query, setQuery] = useState<TQueryParams>(defaultQueries);

  const debouncedSearchText = useDebounce(
    query[SEARCH_PARAMS.searchQuery] as string,
    300,
  );

  const { isPending, isError, data, refetch, isPlaceholderData } =
    useGetTrainingDatasetsV2(
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

  //reset offset back to 0 when searching or when ID filtering is applied from the map.
  useEffect(() => {
    if (
      query[SEARCH_PARAMS.searchQuery] !== "" &&
      (query[SEARCH_PARAMS.offset] as number) > 0
    ) {
      updateQuery({ [SEARCH_PARAMS.offset]: 0 });
    }
  }, [query]);

  useEffect(() => {
    const newQuery = {
      [SEARCH_PARAMS.offset]: defaultQueries[SEARCH_PARAMS.offset],
      [SEARCH_PARAMS.ordering]: defaultQueries[SEARCH_PARAMS.ordering],
      [SEARCH_PARAMS.searchQuery]: defaultQueries[SEARCH_PARAMS.searchQuery],
      [SEARCH_PARAMS.mapIsActive]: defaultQueries[SEARCH_PARAMS.mapIsActive],
    };
    setQuery(newQuery);
  }, []);

  const mapViewIsActive = useMemo(
    () => Boolean(query[SEARCH_PARAMS.mapIsActive]),
    [searchParams],
  );

  return {
    query,
    data,
    isPending,
    isPlaceholderData,
    isError,
    updateQuery,
    refetch,
    mapViewIsActive,
  };
};
