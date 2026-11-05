import { API_ENDPOINTS, apiClient } from "@/services";
import { useQuery } from "@tanstack/react-query";
import {
  APIBaseModelsResponse,
  FeaturesToMapResponse,
} from "@/features/try-fair/types/data-types";

// Expanded API STAC metadata can omit its top-level ID. Selection and URL
// state use that ID, so restore it from the registry's canonical pointer.
const normalizeModelIds = (
  data: APIBaseModelsResponse,
): APIBaseModelsResponse => ({
  ...data,
  results: data.results.map((model) =>
    model.stac
      ? { ...model, stac: { ...model.stac, id: model.stac_item_id } }
      : model,
  ),
});

const getFeaturesToMap = async (): Promise<FeaturesToMapResponse> => {
  const res = await apiClient.get<FeaturesToMapResponse>(
    API_ENDPOINTS.GET_CATEGORIES,
  );
  return res.data;
};

export const useGetFeaturesToMap = () => {
  return useQuery({
    queryKey: ["features-to-map"],
    queryFn: getFeaturesToMap,
  });
};

export const getAPIBaseModels = async (
  category: string,
): Promise<APIBaseModelsResponse> => {
  const res = await apiClient.get<APIBaseModelsResponse>(
    API_ENDPOINTS.GET_API_BASE_MODELS(category),
  );
  return normalizeModelIds(res.data);
};

export const useGetAPIBaseModels = (category: string, enabled = true) => {
  return useQuery({
    queryKey: ["api-base-models", category],
    queryFn: () => getAPIBaseModels(category),
    enabled: enabled && Boolean(category),
  });
};

export const getAPILocalModels = async (
  category: string,
): Promise<APIBaseModelsResponse> => {
  const res = await apiClient.get<APIBaseModelsResponse>(
    API_ENDPOINTS.GET_API_LOCAL_MODELS(category),
  );
  return normalizeModelIds(res.data);
};

export const useGetAPILocalModels = (category: string, enabled = true) => {
  return useQuery({
    queryKey: ["api-local-models", category],
    queryFn: () => getAPILocalModels(category),
    enabled: enabled && Boolean(category),
  });
};

export const getAllAPIBaseModels = async (
  category: string,
): Promise<APIBaseModelsResponse> => {
  const res = await apiClient.get<APIBaseModelsResponse>(
    API_ENDPOINTS.GET_ALL_API_BASE_MODELS(category),
  );
  return normalizeModelIds(res.data);
};

export const useGetAllAPIBaseModels = (category: string, enabled = true) => {
  return useQuery({
    queryKey: ["all-api-base-models", category],
    queryFn: () => getAllAPIBaseModels(category),
    enabled: enabled && Boolean(category),
  });
};

export const getAllAPILocalModels = async (
  category: string,
): Promise<APIBaseModelsResponse> => {
  const res = await apiClient.get<APIBaseModelsResponse>(
    API_ENDPOINTS.GET_ALL_API_LOCAL_MODELS(category),
  );
  return normalizeModelIds(res.data);
};

export const useGetAllAPILocalModels = (category: string, enabled = true) => {
  return useQuery({
    queryKey: ["all-api-local-models", category],
    queryFn: () => getAllAPILocalModels(category),
    enabled: enabled && Boolean(category),
  });
};
