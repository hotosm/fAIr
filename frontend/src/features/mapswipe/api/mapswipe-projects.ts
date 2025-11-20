import { API_ENDPOINTS, apiClient } from "@/services";
import { TMapSwipeProjectAPIResponse } from "@/types";

export type TMapSwipeProjectCreateArgs = {
  topic: string;
  region: string;
  description: string;
  instruction: string;
  look_for: string;
  geojson_url: string;
  tms_url: string;
};
export const createMapSwipeProject = async ({
  ...payload
}: TMapSwipeProjectCreateArgs): Promise<TMapSwipeProjectAPIResponse> => {
  const res = await apiClient.post(API_ENDPOINTS.CREATE_MAPSWIPE_PROJECT, {
    ...payload,
  });
  return {
    ...res.data,
  };
};
