import { API_ENDPOINTS, apiClient } from "@/services";
import { TTrainingDetails } from "@/types";



// This may potential be moved.

export const getTrainingDetails = async (id: number): Promise<TTrainingDetails> => {
    const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_DETAILS(id));
    return res.data;
};