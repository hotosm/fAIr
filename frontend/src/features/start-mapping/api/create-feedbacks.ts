import { FeedbackType } from "@/enums/start-mapping";
import { API_ENDPOINTS, apiClient } from "@/services";
import { Feature, TModelPredictionFeature } from "@/types";

export type TCreateFeedbackPayload = {
  comments: string;
  feedback_type: string;
  geom: string;
  training: number;
  config: {
    area_threshold?: number;
    orthogonalize?: boolean;
    ortho_max_angle_change_deg?: number;
    ortho_skew_tolerance_deg?: number;
    zoom_level?: number;
    confidence?: number;
    tolerance?: number;
    source_imagery?: string;
    checkpoint?: string;
  };
};

export const createFeedback = async ({
  comments,
  feedback_type,
  geom,
  config,
  training
}: TCreateFeedbackPayload): Promise<Feature & { id: number }> => {
  return await (
    await apiClient.post(API_ENDPOINTS.CREATE_FEEDBACK, {
      comments,
      feedback_type,
      geom,
      config,
      action: FeedbackType.REJECT,
      training
    })
  ).data;
};

export type TCreateApprovedPredictionPayload = {
  config: {
    area_threshold?: number;
    orthogonalize?: boolean;
    ortho_max_angle_change_deg?: number;
    ortho_skew_tolerance_deg?: number;
    zoom_level?: number;
    confidence?: number;
    tolerance?: number;
    source_imagery?: string;
    checkpoint?: string;
  };
  geom: string;
  training: number;
  user: number;
};

export const createApprovedPrediction = async ({
  config,
  geom,
  training,
  user,
}: TCreateApprovedPredictionPayload): Promise<TModelPredictionFeature> => {
  return await (
    await apiClient.post(API_ENDPOINTS.CREATE_FEEDBACK, {
      config,
      training,
      geom,
      user,
      action: FeedbackType.ACCEPT,
    })
  ).data;
};

export type TDeleteModelPredictionFeedbackPayload = {
  id: number;
  approvePrediction?: boolean;
};

export const deleteModelPredictionFeedback = async ({
  id,
}: TDeleteModelPredictionFeedbackPayload): Promise<TModelPredictionFeature> => {
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
}: TDeleteApprovedModelPredictionPayload): Promise<TModelPredictionFeature> => {
  return await (
    await apiClient.delete(API_ENDPOINTS.DELETE_FEEDBACK(id))
  ).data;
};
