import { MutationConfig } from "@/services";
import { useMutation } from "@tanstack/react-query";
import {
  createApprovedPrediction,
  createFeedback,
  deleteApprovedModelPrediction,
  deleteModelPredictionFeedback,
  TCreateApprovedPredictionPayload,
  TCreateFeedbackPayload,
  TDeleteApprovedModelPredictionPayload,
  TDeleteModelPredictionFeedbackPayload,
} from "@/features/start-mapping/api/create-feedbacks";

export type useCreateFeedbackOptions = {
  mutationConfig?: MutationConfig<typeof createFeedback>;
};

export const useCreateModelFeedback = ({
  mutationConfig,
}: useCreateFeedbackOptions) => {
  const { ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TCreateFeedbackPayload) => createFeedback(args),
    ...restConfig,
  });
};

export type useCreateApprovedPredictionsOptions = {
  mutationConfig?: MutationConfig<typeof createApprovedPrediction>;
};

export const useCreateApprovedModelPrediction = ({
  mutationConfig,
}: useCreateApprovedPredictionsOptions) => {
  const { ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TCreateApprovedPredictionPayload) =>
      createApprovedPrediction(args),
    ...restConfig,
  });
};

export type useDeleteModelPredictionFeedbackOptions = {
  mutationConfig?: MutationConfig<typeof deleteModelPredictionFeedback>;
};

export const useDeleteModelPredictionFeedback = ({
  mutationConfig,
}: useDeleteModelPredictionFeedbackOptions) => {
  const { ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TDeleteModelPredictionFeedbackPayload) =>
      deleteModelPredictionFeedback(args),
    ...restConfig,
  });
};

export type useDeleteApprovedModelPredictionOptions = {
  mutationConfig?: MutationConfig<typeof deleteApprovedModelPrediction>;
};

export const useDeleteApprovedModelPrediction = ({
  mutationConfig,
}: useDeleteApprovedModelPredictionOptions) => {
  const { ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TDeleteApprovedModelPredictionPayload) =>
      deleteApprovedModelPrediction(args),
    ...restConfig,
  });
};
