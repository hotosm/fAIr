import { useQuery } from '@tanstack/react-query';
import { getModelsQueryOptions, getModelDetailsQueryOptions, getModelsMapDataQueryOptions } from './factory';


type UseModelsOptions = {
    limit: number;
    offset: number;
    orderBy: string;
    searchQuery: string;
    dateFilters: Record<string, string>;
    status?: number;
};

export const useModels = ({ limit, offset, status = 0, orderBy, searchQuery, dateFilters }: UseModelsOptions) => {
    return useQuery({
        ...getModelsQueryOptions({ limit, offset, orderBy, status, searchQuery, dateFilters }),
        //@ts-expect-error
        throwOnError: (error) => error.response?.status >= 500,
    });
};

export const useModelDetails = (id: string) => {
    return useQuery({
        ...getModelDetailsQueryOptions(id),
        //@ts-expect-error
        throwOnError: (error) => error.response?.status >= 500,
        retry: (_, error) => {
            // When a model is not found, don't retry.
            //@ts-expect-error
            return error.response?.status !== 404;
        },
    });
};

export const useModelsMapData = () => {
    return useQuery({
        ...getModelsMapDataQueryOptions(),
        //@ts-expect-error
        throwOnError: (error) => error.response?.status >= 500,
    });
};
