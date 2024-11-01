import { useMutation } from "@tanstack/react-query";
import { createModel, TCreateModelArgs } from "../api/create-models";
import { MutationConfig } from "@/services";
import {
  createTrainingRequest,
  TCreateTrainingRequestArgs,
} from "../api/create-trainings";

type useCreateModelOptions = {
  mutationConfig?: MutationConfig<typeof createModel>;
};

export const useCreateModel = ({ mutationConfig }: useCreateModelOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TCreateModelArgs) => createModel(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};

type useCreateModelTrainingOptions = {
  mutationConfig?: MutationConfig<typeof createTrainingRequest>;
};

export const useCreateModelTrainingRequest = ({
  mutationConfig,
}: useCreateModelTrainingOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: (args: TCreateTrainingRequestArgs) =>
      createTrainingRequest(args),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
