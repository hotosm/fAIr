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
