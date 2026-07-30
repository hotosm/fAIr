import { API_ENDPOINTS, apiClient } from "@/services";
import { useQuery } from "@tanstack/react-query";

export type FeatureToMapItem = {
  value: string;
  label: string;
};

export type FeaturesToMapResponse = FeatureToMapItem[];

const getFeaturesToMap = async (): Promise<FeatureToMapItem[]> => {
  const res = await apiClient.get<FeatureToMapItem[]>(
    API_ENDPOINTS.GET_BASE_MODELS_CATEGORIES,
  );
  return res.data;
};

export const useGetFeaturesToMap = () => {
  return useQuery({
    queryKey: ["features-to-map"],
    queryFn: getFeaturesToMap,
  });
};

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
};

export type APIBaseModelsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: APIBaseModelItem[];
};

export const getAPIBaseModels = async (
  category: string,
): Promise<APIBaseModelsResponse> => {
  const res = await apiClient.get<APIBaseModelsResponse>(
    API_ENDPOINTS.GET_API_BASE_MODELS(category),
  );
  return res.data;
};

export const useGetAPIBaseModels = (category: string) => {
  return useQuery({
    queryKey: ["api-base-models", category],
    queryFn: () => getAPIBaseModels(category),
    enabled: Boolean(category),
  });
};
