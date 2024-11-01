import { API_ENDPOINTS, apiClient } from "@/services";
import { TModel } from "@/types";

export type TCreateModelArgs = {
  dataset: string;
  base_model: string;
  description: string;
  name: string;
};

export const createModel = async ({
  dataset,
  name,
  description,
  base_model,
}: TCreateModelArgs): Promise<TModel> => {
  return await (
    await apiClient.post(`${API_ENDPOINTS.CREATE_MODELS}`, {
      dataset,
      name,
      description,
      base_model,
    })
  ).data;
};
