import { MutationConfig } from "@/services";
import { TModelPredictionsConfig, TOfflinePredictionsConfig } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { getModelPredictions } from "@/features/start-mapping/api/get-model-predictions";
import { submitOfflinePredictionRequest } from "../api/predictions";

export type useGetModelPredictionsOptions = {
  mutationConfig?: MutationConfig<typeof getModelPredictions>;
};

export const useGetModelPredictions = ({
  mutationConfig,
}: useGetModelPredictionsOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TModelPredictionsConfig) => getModelPredictions(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};

export type useSubmitOfflinePredictionsOptions = {
  mutationConfig?: MutationConfig<typeof submitOfflinePredictionRequest>;
};

export const useSubmitOfflinePredictionsRequest = ({
  mutationConfig,
}: useSubmitOfflinePredictionsOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TOfflinePredictionsConfig) =>
      submitOfflinePredictionRequest(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
