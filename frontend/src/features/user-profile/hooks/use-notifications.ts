import { useInfiniteQuery, useMutation } from "@tanstack/react-query";

import {
  getNotifications,
  TUpdateNotificationArgs,
  updateNotification,
  updateNotifications,
} from "@/features/user-profile/api/notifications";
import { authService, MutationConfig } from "@/services";
import { useAuth } from "@/app/providers/auth-provider";
import { PaginatedNotifications } from "@/types";

type UseNotificationsOptions = {
  enabled: boolean;
  is_read: boolean | undefined;
};

export const useNotifications = ({
  enabled,
  is_read,
}: UseNotificationsOptions) => {
  return useInfiniteQuery<PaginatedNotifications, PaginatedNotifications>({
    queryKey: ["user-notifications"],
    queryFn: ({ pageParam: offset = 0 }) =>
      getNotifications(is_read, offset as number),
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasNext) {
        const currentOffset = allPages.length * 20;
        return currentOffset;
      }
      return undefined;
    },
  });
};

type useUpdateNotificationOptions = {
  mutationConfig?: MutationConfig<typeof updateNotification>;
};

export const useUpdateNotification = ({
  mutationConfig,
}: useUpdateNotificationOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  const { setUser } = useAuth();
  const { refetch } = useNotifications({
    is_read: undefined,
    enabled: false,
  });

  return useMutation({
    mutationFn: (args: TUpdateNotificationArgs) => updateNotification(args),
    onSuccess: async (...args) => {
      refetch();
      // Update user to reflect the new notification status
      setUser(await authService.getUser());
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};

type useUpdateNotificationsOptions = {
  mutationConfig?: MutationConfig<typeof updateNotifications>;
};

export const useUpdateNotifications = ({
  mutationConfig,
}: useUpdateNotificationsOptions) => {
  const { onSuccess, ...restConfig } = mutationConfig || {};
  const { refetch } = useNotifications({
    is_read: undefined,
    enabled: false,
  });
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: () => updateNotifications(),
    onSuccess: async (...args) => {
      // Update user to reflect the new notification status
      setUser(await authService.getUser());
      refetch();
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
