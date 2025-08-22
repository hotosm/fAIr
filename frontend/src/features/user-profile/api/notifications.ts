import { API_ENDPOINTS, apiClient } from "@/services";
import { PaginatedNotifications, TNotification } from "@/types";

export const getNotifications = async (
  is_read: boolean | undefined,
  offset?: number,
): Promise<PaginatedNotifications> => {
  const res = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS, {
    params: {
      offset,
      is_read,
      limit: 10,
    },
  });
  return {
    ...res.data,
    hasNext: Boolean(res.data.next),
    hasPrev: Boolean(res.data.previous),
  };
};

export type TUpdateNotificationArgs = {
  id: number;
};

export const updateNotification = async ({
  id,
}: TUpdateNotificationArgs): Promise<TNotification> => {
  return await (
    await apiClient.post(API_ENDPOINTS.UPDATE_NOTIFICATION(id))
  ).data;
};

export const updateNotifications = async (): Promise<TNotification> => {
  return await (
    await apiClient.post(API_ENDPOINTS.UPDATE_NOTIFICATIONS)
  ).data;
};
