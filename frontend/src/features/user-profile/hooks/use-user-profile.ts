import { useMutation } from "@tanstack/react-query";
import {
  requestEmailVerification,
  TUpdateUserProfileArgs,
  updateUserProfile,
} from "@/features/user-profile/api/user-profile";
import { MutationConfig } from "@/services";

type useUpdateProfileOptions = {
  mutationConfig?: MutationConfig<typeof updateUserProfile>;
};

export const useUpdateUserProfile = ({
  mutationConfig,
}: useUpdateProfileOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: (args: TUpdateUserProfileArgs) => updateUserProfile(args),
    onSuccess: async (...args) => {
      await onSuccess?.(...args);
    },
    ...restConfig,
  });
};

type useEmailVerificationOptions = {
  mutationConfig?: MutationConfig<typeof requestEmailVerification>;
};

export const useEmailVerification = ({
  mutationConfig,
}: useEmailVerificationOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    mutationFn: requestEmailVerification,
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
