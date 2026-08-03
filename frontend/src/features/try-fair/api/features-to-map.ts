import { API_ENDPOINTS, apiClient } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { BaseModelStacItem } from "./stac";
export type APIBaseModelUser = {
  osm_id: number;
  username: string;
};

export type APIBaseModelItem = {
  id: number;
  name: string;
  category: string;
  stac_item_id: string;
  status: string;
  visibility: string;
  is_pinned: boolean;
  star_count: number;
  is_starred: boolean;
  error: string;
  user: APIBaseModelUser;
  created_at: string;
  last_modified: string;
  stac: BaseModelStacItem;
};

export type APIBaseModelsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: APIBaseModelItem[];
};
export type FeatureToMapItem = {
  slug: string;
  id: number;
  description: string;
  last_modified: string;
  created_at: string;
  label: string;
};

export type FeaturesToMapResponse = {
  results: FeatureToMapItem[];
  count: number;
  next: string | null;
  previous: string | null;
};

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
  return res.data;
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
  return res.data;
};

export const useGetAPILocalModels = (category: string, enabled = true) => {
  return useQuery({
    queryKey: ["api-local-models", category],
    queryFn: () => getAPILocalModels(category),
    enabled: enabled && Boolean(category),
  });
};
