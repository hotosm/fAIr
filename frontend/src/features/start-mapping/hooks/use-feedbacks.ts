import { MutationConfig } from "@/services";
import { useMutation } from "@tanstack/react-query";
import {
  createApprovedPrediction,
  createFeedback,
  TCreateApprovedPredictionPayload,
  TCreateFeedbackPayload,
} from "../api/create-feedbacks";

export type useCreateFeedbackOptions = {
  mutationConfig?: MutationConfig<typeof createFeedback>;
};

export const useCreateModelFeedback = ({
  mutationConfig,
}: useCreateFeedbackOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TCreateFeedbackPayload) => createFeedback(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};

export type useCreateApprovedPredictionsOptions = {
  mutationConfig?: MutationConfig<typeof createApprovedPrediction>;
};

export const useCreateApprovedModelPrediction = ({
  mutationConfig,
}: useCreateApprovedPredictionsOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TCreateApprovedPredictionPayload) =>
      createApprovedPrediction(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
