import { useQuery } from "@tanstack/react-query";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { API_ENDPOINTS, stacClient } from "@/services";

export type TGetBaseModelsParams = {
  limit?: number;
  page?: number;
};

export const getBaseModels = async ({
  limit = 20,
}: TGetBaseModelsParams = {}) => {
  const res = await stacClient.get(API_ENDPOINTS.GET_BASE_MODELS(limit));
  return {
    ...res.data,
    hasNext: res.data.next,
    hasPrev: res.data.previous,
  };
};

/**
 * Fetches all non-deprecated base models from the STAC catalogue.
 * Reuses the existing base-models API function but returns the raw STAC items
 * (not mapped to TBaseModel) so the try-fair page can access inference fields
 * such as mlm:inference-endpoint, mlm:hyperparameters, etc.
 */
export const useBaseModels = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["fair-base-models"],
    queryFn: async () => {
      const res = await getBaseModels({ limit: 100 });
      return (res.features as BaseModelStacItem[]).filter(
        (f) => !f.properties.deprecated,
      );
    },
  });

  return {
    models: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
};
