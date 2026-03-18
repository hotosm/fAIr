import useDebounce from "@/hooks/use-debounce";
import { useCallback } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getPublishedPredictionsQueryOptions } from "@/features/published-predictions/api/factory";
import { PAGE_LIMIT } from "@/components/shared";
import { LayoutView } from "@/enums";

const ORDERING_OPTIONS = [
  { label: "Newest First", value: "-id" },
  { label: "Oldest First", value: "id" },
  { label: "Recently Published", value: "-published_at" },
] as const;

const usePublishedPredictionsSearchParams = () => {
  return useQueryStates({
    q: parseAsString.withDefault(""),
    orderBy: parseAsString.withDefault("-id"),
    offset: parseAsInteger.withDefault(0),
    layout: parseAsString.withDefault(LayoutView.GRID),
  });
};

export const usePublishedPredictions = () => {
  const [params, setParams] = usePublishedPredictionsSearchParams();

  const debouncedSearch = useDebounce(params.q, 300);

  const { isPending, isError, data, refetch, isPlaceholderData } = useQuery({
    ...getPublishedPredictionsQueryOptions(
      debouncedSearch.length > 0 ? debouncedSearch : undefined,
      params.orderBy,
      params.offset > 0 ? params.offset : undefined,
    ),
  });

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

  const goToNextPage = useCallback(() => {
    if (data?.hasNext) {
      void setParams({ offset: params.offset + PAGE_LIMIT });
    }
  }, [data?.hasNext, params.offset, setParams]);

  const goToPrevPage = useCallback(() => {
    if (data?.hasPrev) {
      void setParams({ offset: Math.max(params.offset - PAGE_LIMIT, 0) });
    }
  }, [data?.hasPrev, params.offset, setParams]);

  return {
    data,
    isPending,
    isError,
    isPlaceholderData,
    refetch,
    search: params.q,
    ordering: params.orderBy,
    layout: params.layout,
    offset: params.offset,
    setSearch,
    setOrdering,
    setLayout,
    goToNextPage,
    goToPrevPage,
  };
};

export { ORDERING_OPTIONS };
