import { API_ENDPOINTS, apiClient } from "@/services";
import { Feature } from "@/types";

export type TCreateFeedbackPayload = {
  comments: string;
  feedback_type: string;
  geom: string;
  source_imagery: string;
  zoom_level: number;
  training: number;
};

export const createFeedback = async ({
  comments,
  feedback_type,
  geom,
  source_imagery,
  zoom_level,
  training,
}: TCreateFeedbackPayload): Promise<Feature & { id: number }> => {
  return await (
    await apiClient.post(API_ENDPOINTS.CREATE_FEEDBACK, {
      comments,
      feedback_type,
      geom,
      source_imagery,
      zoom_level,
      training,
    })
  ).data;
};

export type TCreateApprovedPredictionPayload = {
  config: Record<string, number | boolean>;
  geom: string;
  training: number;
  user: number;
};

export const createApprovedPrediction = async ({
  config,
  geom,
  training,
  user,
}: TCreateApprovedPredictionPayload): Promise<Feature & { id: number }> => {
  return await (
    await apiClient.post(API_ENDPOINTS.CREATE_APPROVED_PREDICTION, {
      config,
      training,
      geom,
      user,
    })
  ).data;
};

export type TDeleteModelPredictionFeedbackPayload = {
  id: number;
  approvePrediction?: boolean;
};

export const deleteModelPredictionFeedback = async ({
  id,
}: TDeleteModelPredictionFeedbackPayload) => {
  return await (
    await apiClient.delete(API_ENDPOINTS.DELETE_FEEDBACK(id))
  ).data;
};

export type TDeleteApprovedModelPredictionPayload = {
  id: number;
  createFeedback?: boolean;
};

export const deleteApprovedModelPrediction = async ({
  id,
}: TDeleteApprovedModelPredictionPayload) => {
  return await (
    await apiClient.delete(API_ENDPOINTS.DELETE_APPROVED_PREDICTION(id))
  ).data;
};
