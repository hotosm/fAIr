import { apiClient, API_ENDPOINTS } from '@/services';
import { FeatureCollection, PaginatedModels, TModelDetails } from '@/types/api';

export const getModels = async (
    limit: number,
    offset: number,
    orderBy: string,
    status: number,
    searchQuery: string,
    dateFilters: Record<string, string>,
): Promise<PaginatedModels> => {
    const res = await apiClient.get(API_ENDPOINTS.GET_MODELS, {
        params: {
            status,
            limit,
            search: searchQuery,
            offset,
            ordering: orderBy,
            ...dateFilters,
        },
    });
    return {
        ...res.data,
        hasNext: res.data.next !== null,
        hasPrev: res.data.previous !== null,
    };
};

export const getModelDetails = async (id: string): Promise<TModelDetails> => {
    const res = await apiClient.get(API_ENDPOINTS.GET_MODEL_DETAILS(id));
    return res.data;
};

export const getModelsMapData = async (): Promise<FeatureCollection> => {
    const res = await apiClient.get(API_ENDPOINTS.GET_MODELS_CENTROIDS);
    return res.data;
};


