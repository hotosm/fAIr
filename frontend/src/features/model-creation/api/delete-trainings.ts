import { API_ENDPOINTS, apiClient } from "@/services";

export type TDeleteTrainingAreaArgs = {
  trainingAreaId: number;
};

export const deleteTrainingArea = async ({
  trainingAreaId,
}: TDeleteTrainingAreaArgs): Promise<any> => {
  return await (
    await apiClient.delete(
      `${API_ENDPOINTS.DELETE_TRAINING_AREA(trainingAreaId)}`,
    )
  ).data;
};
