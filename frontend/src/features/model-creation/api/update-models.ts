import { API_ENDPOINTS, apiClient } from "@/services";
import { BASE_MODELS } from "@/enums";
import { TModel } from "@/types";

export type TUpdateModelArgs = {
  description: string;
  name: string;
  modelId: string;
  dataset?: string;
  base_model?: BASE_MODELS;
};

export const updateModel = async ({
  name,
  description,
  modelId,
  dataset,
  base_model,
}: TUpdateModelArgs): Promise<TModel> => {
  const payload = {
    name,
    description,
    ...(dataset !== undefined && { dataset }),
    ...(base_model !== undefined && { base_model }),
  };
  return await (
    await apiClient.patch(`${API_ENDPOINTS.UPDATE_MODEL(modelId)}`, payload)
  ).data;
};
