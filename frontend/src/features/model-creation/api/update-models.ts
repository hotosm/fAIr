import { API_ENDPOINTS, apiClient } from "@/services";
import { TModel } from "@/types";

export type TUpdateModelArgs = {
  description: string;
  name: string;
  modelId: string;
};

export const updateModel = async ({
  name,
  description,
  modelId,
}: TUpdateModelArgs): Promise<TModel> => {
  return await (
    await apiClient.patch(`${API_ENDPOINTS.UPDATE_MODEL(modelId)}`, {
      name,
      description,
    })
  ).data;
};
