import { API_ENDPOINTS, apiClient } from "@/services";
import { TMapSwipeProjectAPIResponse, TMapSwipeProjectStatus } from "@/types";

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

export const getMapSwipeProjectStatus = async (
  projectId: string,
): Promise<TMapSwipeProjectStatus> => {
  const res = await apiClient.get(
    API_ENDPOINTS.GET_MAPSWIPE_PROJECT_STATUS(projectId),
  );
  return {
    ...res.data.data,
  };
};
