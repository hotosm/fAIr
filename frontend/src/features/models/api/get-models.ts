import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS, } from '@/services';
import { PaginatedModels } from '@/types/api';



export const getModels = async (
    limit: number,
    offset: number,
    orderBy: string,
    status?: number,
    searchQuery?: string,

): Promise<PaginatedModels> => {
    const res = (
        await apiClient.get(API_ENDPOINTS.GET_MODELS, {
            params: {
                status,
                limit,
                search: searchQuery,
                offset,
                ordering: orderBy
            },
        })
    ).data
    return {
        ...res,
        hasNext: res?.next !== null,
        hasPrev: res?.previous !== null
    }
};

export const getModelsMapData = async (
): Promise<any> => {
    return {
        "type": 'FeatureCollection',
        "features": (
            await apiClient.get(API_ENDPOINTS.GET_MODELS_CENTROIDS)
        ).data?.results
    }
};

type TMmodelQuerysOptions = {
    status?: number
    searchQuery?: string
    id?: number
    limit: number
    offset: number
    orderBy: string

}
export const getModelsQueryOptions = ({
    status, searchQuery, limit, offset, orderBy
}: TMmodelQuerysOptions) => {
    return queryOptions({
        queryKey: ['models', { status, searchQuery, offset, orderBy }],
        queryFn: () => getModels(limit, offset, orderBy, status, searchQuery,),
        placeholderData: keepPreviousData

    });
};


type useModelsOptions = {
    limit: number
    status?: number
    searchQuery?: string
    date?: string
    offset: number
    orderBy: string

}

export const useModels = ({ limit, offset, status = 0, orderBy, searchQuery = '', }: useModelsOptions) => {
    return useQuery({
        ...getModelsQueryOptions({ status, offset, orderBy, searchQuery, limit })
    })
}

export const useModelsMapData = () => {
    return useQuery({
        queryKey: ['models-centroid',],
        queryFn: () => getModelsMapData(),
    })
}