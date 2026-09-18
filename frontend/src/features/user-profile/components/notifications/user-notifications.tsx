import { useEffect, useState } from "react";
import { useNotifications } from "@/features/user-profile/hooks/use-notifications";
import { useAuth } from "@/app/providers/auth-provider";
import useScreenSize from "@/hooks/use-screen-size";
import { NotificationBell } from "./notification-bell";
import { NotificationsPanel } from "./notifications-panel";
import { NOTIFICATIONS_POLLING_INTERVAL_MS } from "@/config";
import { NotificationType } from "@/enums/user-profile";

// Viewport width below which the notification panel is displayed as a bottom modal.
// This is to prevent the notification panel from covering the entire screen on small devices.
const SMALL_VIEWPORT = 960;

export const UserNotifications = () => {
  const [showNotificationPanel, setShowNotificationPanel] =
    useState<boolean>(false);

  const { user } = useAuth();

  const notificationAnchor = "notificationPanel";

  const { screenWidth } = useScreenSize();

  const [notificationType, setNotificationType] = useState<NotificationType>(
    NotificationType.UNREAD,
  );

  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetching,
    refetch,
  } = useNotifications({
    enabled: true,
    is_read: undefined,
  });

  const handleClick = () => {
    setShowNotificationPanel((prev) => !prev);
  };

  /**
   * Refetch notifications every 10 seconds if there are unread notifications.
   * This is to prevent unnecessary polling when there are no unread notifications.
   */
  useEffect(() => {
    if (user.unread_notifications_count === 0) return;
    const interval = setInterval(() => {
      refetch();
    }, NOTIFICATIONS_POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refetch, user.unread_notifications_count]);

  return (
    <>
      <NotificationBell
        showNotificationPanel={showNotificationPanel}
        notificationAnchor={notificationAnchor}
        unreadCount={user?.unread_notifications_count}
        handleClick={handleClick}
      />

      <NotificationsPanel
        showNotificationPanel={showNotificationPanel}
        setShowNotificationPanel={setShowNotificationPanel}
        unReadNotifications={data?.pages
          .map((page) => page.results)
          .flat()
          .filter((notification) => !notification.is_read)}
        allNotifications={data?.pages.map((page) => page.results).flat()}
        isPending={isPending}
        isError={isError}
        loadMore={fetchNextPage}
        anchor={notificationAnchor}
        notificationType={notificationType}
        setNotificationType={setNotificationType}
        isSmallViewport={screenWidth < SMALL_VIEWPORT}
        unreadCount={user?.unread_notifications_count}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
      />
    </>
  );
};
