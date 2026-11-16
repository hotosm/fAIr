import { API_ENDPOINTS, apiClient } from "@/services";
import { TUser } from "@/types";

export type TUpdateUserProfileArgs = {
  email?: string;
  newsletter_subscription?: boolean;
  account_deletion_requested?: boolean;
};

export const updateUserProfile = async ({
  email,
  newsletter_subscription,
  account_deletion_requested,
}: TUpdateUserProfileArgs): Promise<TUser> => {
  return await (
    await apiClient.patch(API_ENDPOINTS.USER, {
      email,
      newsletter_subscription,
      account_deletion_requested,
    })
  ).data;
};

export const requestEmailVerification = async (): Promise<{
  message: string;
}> => {
  return await (
    await apiClient.post(API_ENDPOINTS.REQUEST_EMAIL_VERIFICATION)
  ).data;
};
