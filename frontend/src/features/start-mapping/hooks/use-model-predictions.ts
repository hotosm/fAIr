import { MutationConfig } from "@/services";
import { TModelPredictionsConfig } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { getModelPredictions } from "@/features/start-mapping/api/get-model-predictions";

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
