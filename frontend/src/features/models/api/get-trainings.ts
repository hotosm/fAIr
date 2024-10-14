import { API_ENDPOINTS, apiClient } from "@/services";
import { TrainingWorkspace, TTrainingDetails, TTrainingFeedbacks } from "@/types";



// This may potential be moved.

export const getTrainingDetails = async (id: number): Promise<TTrainingDetails> => {
    const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_DETAILS(id));
    return res.data;
};


export const getTrainingFeedbacks = async (id: number): Promise<TTrainingFeedbacks> => {
    const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_FEEDBACKS(id));
    return res.data;
};

export const getTrainingWorkspace = async (datasetId: number, trainingId: number, directory_name: string): Promise<TrainingWorkspace> => {
    const res = await apiClient.get(API_ENDPOINTS.GET_TRAINING_WORKSPACE(datasetId, trainingId, directory_name));
    return res.data;
};
