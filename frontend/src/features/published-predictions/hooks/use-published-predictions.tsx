import useDebounce from "@/hooks/use-debounce";
import { useCallback, useEffect } from "react";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import {
  getPublishedPredictionsMapDataQueryOptions,
  getPublishedPredictionsQueryOptions,
} from "@/features/published-predictions/api/factory";
import { PAGE_LIMIT } from "@/components/shared";
import { LayoutView } from "@/enums";
import { SEARCH_PARAMS } from "@/utils/search-params";
import { TQueryParams } from "@/types";

const ORDERING_OPTIONS = [
  { label: "Newest Published", value: "-published_at" },
  { label: "Oldest Published", value: "published_at" },
] as const;

const usePublishedPredictionsSearchParams = () => {
  return useQueryStates({
    [SEARCH_PARAMS.searchQuery]: parseAsString.withDefault(""),
    [SEARCH_PARAMS.ordering]: parseAsString.withDefault("-id"),
    [SEARCH_PARAMS.offset]: parseAsInteger.withDefault(0),
    [SEARCH_PARAMS.layout]: parseAsString.withDefault(LayoutView.GRID),
    [SEARCH_PARAMS.mapIsActive]: parseAsBoolean.withDefault(false),
    [SEARCH_PARAMS.id]: parseAsString.withDefault(""),
  });
};

export const usePublishedPredictions = () => {
  const [params, setParams] = usePublishedPredictionsSearchParams();
  const search = params[SEARCH_PARAMS.searchQuery] as string;
  const orderingParam = params[SEARCH_PARAMS.ordering] as string;
  const offset = params[SEARCH_PARAMS.offset] as number;
  const layout = params[SEARCH_PARAMS.layout] as string;
  const mapIsActive = params[SEARCH_PARAMS.mapIsActive] as boolean;
  const predictionIdParam = params[SEARCH_PARAMS.id] as string;

  const debouncedSearch = useDebounce(search, 300);
  const clearAllFilters = useCallback(() => {
    void setParams({
      [SEARCH_PARAMS.searchQuery]: null,
      [SEARCH_PARAMS.id]: null,
      [SEARCH_PARAMS.offset]: 0,
    });
  }, [setParams]);
  const { isPending, isError, data, refetch, isPlaceholderData } = useQuery({
    ...getPublishedPredictionsQueryOptions(
      debouncedSearch.length > 0 ? debouncedSearch : undefined,
      orderingParam,
      offset > 0 ? offset : undefined,
      predictionIdParam.length > 0 ? parseInt(predictionIdParam) : undefined,
    ),
  });

  const setPredictionId = useCallback(
    (value: string | number | null) => {
      void setParams({
        [SEARCH_PARAMS.id]: value ? String(value) : null,
        [SEARCH_PARAMS.offset]: 0,
      });
    },
    [setParams],
  );
  useEffect(() => {
    if ((search !== "" || predictionIdParam !== "") && offset > 0) {
      void setParams({ [SEARCH_PARAMS.offset]: 0 });
    }
  }, [offset, predictionIdParam, search, setParams]);
  const setSearch = useCallback(
    (value: string) => {
      void setParams({ q: value, offset: 0 });
    },
    [setParams],
  );

  const setOrdering = useCallback(
    (value: string) => {
      void setParams({ orderBy: value, offset: 0 });
    },
    [setParams],
  );

  const setLayout = useCallback(
    (value: string) => {
      void setParams({ layout: value });
    },
    [setParams],
  );
  const setMapView = useCallback(
    (value: boolean) => {
      void setParams({ map: value });
    },
    [setParams],
  );
  const goToNextPage = useCallback(() => {
    if (data?.hasNext) {
      void setParams({ offset: offset + PAGE_LIMIT });
    }
  }, [data?.hasNext, offset, setParams]);

  const goToPrevPage = useCallback(() => {
    if (data?.hasPrev) {
      void setParams({ offset: Math.max(offset - PAGE_LIMIT, 0) });
    }
  }, [data?.hasPrev, offset, setParams]);

  const {
    data: mapData,
    isPending: isMapDataPending,
    isError: isMapDataError,
  } = useQuery({
    ...getPublishedPredictionsMapDataQueryOptions(),
    enabled: mapIsActive && params.layout !== LayoutView.LIST,
  });
  useEffect(() => {
    if (params.layout === LayoutView.LIST && params.map) {
      void setParams({ map: false });
    }
  }, [params.layout, params.map, setParams]);


    const query: TQueryParams = {
    [SEARCH_PARAMS.searchQuery]: search,
    [SEARCH_PARAMS.id]: predictionIdParam,
    [SEARCH_PARAMS.offset]: offset,
    [SEARCH_PARAMS.ordering]: orderingParam,
    [SEARCH_PARAMS.layout]: layout,
    [SEARCH_PARAMS.mapIsActive]: mapIsActive,
  };
  return {
    data,
    query,
    mapData,
    isMapDataPending,
    isMapDataError,
    isPending,
    isError,
    isPlaceholderData,
    refetch,
    search,
    ordering: orderingParam,
    layout,
    offset,
    clearAllFilters,
    mapViewIsActive: mapIsActive && params.layout !== LayoutView.LIST,
    setMapView,
    setSearch,
    setOrdering,
    setPredictionId,
    setLayout,
    goToNextPage,
    goToPrevPage,
  };
};

export { ORDERING_OPTIONS };
