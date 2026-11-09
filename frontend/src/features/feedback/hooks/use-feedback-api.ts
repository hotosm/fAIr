import { useMutation } from "@tanstack/react-query";
import {
  createFeatureFeedback,
  deleteFeatureFeedback,
  updateFeatureFeedback,
  type TCreateFeatureFeedbackPayload,
  type TDeleteFeatureFeedbackPayload,
  type TUpdateFeatureFeedbackPayload,
} from "@/features/feedback/api/feedback";
import type { MutationConfig } from "@/services";

type UseCreateFeatureFeedbackOptions = {
  mutationConfig?: MutationConfig<typeof createFeatureFeedback>;
};

export const useCreateFeatureFeedback = ({
  mutationConfig,
}: UseCreateFeatureFeedbackOptions = {}) => {
  return useMutation({
    mutationFn: (args: TCreateFeatureFeedbackPayload) =>
      createFeatureFeedback(args),
    ...mutationConfig,
  });
};

type UseUpdateFeatureFeedbackOptions = {
  mutationConfig?: MutationConfig<typeof updateFeatureFeedback>;
};

export const useUpdateFeatureFeedback = ({
  mutationConfig,
}: UseUpdateFeatureFeedbackOptions = {}) => {
  return useMutation({
    mutationFn: (args: TUpdateFeatureFeedbackPayload) =>
      updateFeatureFeedback(args),
    ...mutationConfig,
  });
};

type UseDeleteFeatureFeedbackOptions = {
  mutationConfig?: MutationConfig<typeof deleteFeatureFeedback>;
};

export const useDeleteFeatureFeedback = ({
  mutationConfig,
}: UseDeleteFeatureFeedbackOptions = {}) => {
  return useMutation({
    mutationFn: (args: TDeleteFeatureFeedbackPayload) =>
      deleteFeatureFeedback(args),
    ...mutationConfig,
  });
};
