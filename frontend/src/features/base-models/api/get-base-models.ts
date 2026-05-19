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

export const getBaseModelById = async (id: string) => {
  const res = await stacClient.get(API_ENDPOINTS.GET_BASE_MODEL_BY_ID(id));
  return res.data;
};
