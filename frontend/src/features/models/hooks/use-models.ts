import { useQuery } from "@tanstack/react-query";
import {
  getModelsQueryOptions,
  getModelDetailsQueryOptions,
  getModelsMapDataQueryOptions,
} from "../api/factory";

type UseModelsOptions = {
  limit: number;
  offset: number;
  orderBy: string;
  searchQuery: string;
  dateFilters: Record<string, string>;
  status?: number;
  id: number;
};

export const useModels = ({
  limit,
  offset,
  status = 0,
  orderBy,
  searchQuery,
  dateFilters,
  id,
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
    }),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error.response?.status >= 500,
  });
};

export const useModelDetails = (id: string, enabled: boolean = true) => {
  return useQuery({
    ...getModelDetailsQueryOptions(id),
    //@ts-expect-error bad type definition
    throwOnError: (error) => error.response?.status >= 500,
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
    //@ts-expect-error bad type definition
    throwOnError: (error) => error.response?.status >= 500,
  });
};
