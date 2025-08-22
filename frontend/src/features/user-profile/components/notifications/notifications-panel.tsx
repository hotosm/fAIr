import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { MobileDrawer } from "@/components/ui/drawer";
import { Popup } from "@/components/ui/popup";
import { TNotification } from "@/types";
import { showErrorToast } from "@/utils";
import { useUpdateNotifications } from "@/features/user-profile/hooks/use-notifications";
import { NoTrainingAreaIcon } from "@/components/ui/icons";
import { useCallback, useEffect, useRef } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { NotificationType } from "@/enums/user-profile";
import { NotificationItem } from "./notification-item";
import { ButtonVariant } from "@/enums";

const NotificationsPanelSkeleton = () => {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse flex space-x-4 mb-4 w-full h-10 bg-light-gray"
        ></div>
      ))}
    </div>
  );
};

export const NotificationsPanel = ({
  anchor,
  showNotificationPanel,
  isError,
  isPending,
  setNotificationType,
  isSmallViewport,
  setShowNotificationPanel,
  loadMore,
  unreadCount,
  unReadNotifications,
  allNotifications,
  notificationType,
  hasNextPage,
  isFetching,
}: {
  anchor: string;
  showNotificationPanel: boolean;
  isError: boolean;
  isPending: boolean;
  unReadNotifications: TNotification[] | undefined;
  allNotifications: TNotification[] | undefined;
  notificationType: NotificationType;
  setNotificationType: (type: NotificationType) => void;
  isSmallViewport: boolean;
  setShowNotificationPanel: (show: boolean) => void;
  loadMore: () => void;
  unreadCount: number;
  hasNextPage: boolean;
  isFetching: boolean;
}) => {
  const {
    isPending: isNotificationsUpdatePending,
    mutate: updateNotifications,
  } = useUpdateNotifications({
    mutationConfig: {
      onError: (error) => {
        showErrorToast(error);
      },
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef<boolean>(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isFetching || isFetchingRef.current || !hasNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    // Check if within 100px of bottom
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      isFetchingRef.current = true;
      loadMore();
    }
  }, [isFetching, hasNextPage, loadMore]);

  useEffect(() => {
    if (!isFetching) {
      isFetchingRef.current = false;
    }
  }, [isFetching]);

  const notificationsToRender =
    notificationType === NotificationType.UNREAD
      ? unReadNotifications
      : allNotifications;

  const closeNotificationPanel = () => {
    setShowNotificationPanel(false);
  };
  const clickOutsideRef = useClickOutside<HTMLDivElement>((event) => {
    /**
     * Disable this when the user clicks on the notification bell anchor.
     * This is to prevent the flicker when the user clicks on the notification bell.
     */
    if ((event.target as HTMLElement).closest(`#${anchor}`)) return;
    /**
     * Disable this when the user clicks on the 'Mark as Read' dropdown menu item.
     */
    if ((event.target as HTMLElement).closest(`.menu-item`)) return;
    closeNotificationPanel();
  });

  const popUpContent = () => {
    return (
      <>
        <div className="px-2 space-y-2">
          <p className="font-semibold text-body-3 md:text-body-2">
            {USER_PROFILE_PAGE_CONTENT.notifications.panelTitle}
          </p>
          <Divider />
          <div className="flex justify-between">
            <div className="flex gap-x-2">
              <Button
                variant={
                  notificationType === NotificationType.UNREAD
                    ? ButtonVariant.DEFAULT
                    : ButtonVariant.TERTIARY
                }
                size="small"
                className={`!w-fit ${notificationType === NotificationType.ALL ? "font-bold" : ""}`}
                uppercase={false}
                contentClassName="text-body-4"
                onClick={() => setNotificationType(NotificationType.ALL)}
              >
                {USER_PROFILE_PAGE_CONTENT.notifications.all}
              </Button>
              <Button
                variant={
                  notificationType === NotificationType.ALL
                    ? ButtonVariant.DEFAULT
                    : ButtonVariant.TERTIARY
                }
                size="small"
                className={`!w-fit ${notificationType === NotificationType.UNREAD ? "font-bold" : ""}`}
                uppercase={false}
                contentClassName="text-body-4"
                onClick={() => setNotificationType(NotificationType.UNREAD)}
              >
                {USER_PROFILE_PAGE_CONTENT.notifications.unread} ({unreadCount})
              </Button>
            </div>
            {unreadCount > 0 && (
              <button
                disabled={isNotificationsUpdatePending}
                className="text-grey text-body-4"
                onClick={() => updateNotifications(undefined)}
              >
                {USER_PROFILE_PAGE_CONTENT.notifications.markAllAsRead}
              </button>
            )}
          </div>
        </div>
        <div
          className="h-96 max-h-96 overflow-y-auto scrollable flex flex-col gap-y-4 py-5"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {isPending ? (
            <NotificationsPanelSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center gap-y-4">
              <p className="text-center text-primary text-body-3">
                {USER_PROFILE_PAGE_CONTENT.notifications.errorState}
              </p>
            </div>
          ) : !notificationsToRender || notificationsToRender.length === 0 ? (
            <div className="flex items-center justify-center gap-y-4 w-full h-full flex-col">
              <NoTrainingAreaIcon className="w-10 h-10" />
              <p className="text-grey text-body-3">
                {" "}
                {USER_PROFILE_PAGE_CONTENT.notifications.emptyState}
              </p>
            </div>
          ) : (
            <div className="flex gap-y-4 flex-col">
              {notificationsToRender.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  closeNotificationPanel={closeNotificationPanel}
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  const closeDrawer = () => {
    setShowNotificationPanel(false);
  };

  if (isSmallViewport) {
    return (
      <MobileDrawer
        open={showNotificationPanel}
        dialogTitle=""
        snapPoints={[0.6, 0.8]}
        canClose
        closeDrawer={closeDrawer}
      >
        <div
          className={` w-full p-3 py-4 flex flex-col gap-y-4`}
          onScroll={handleScroll}
        >
          {popUpContent()}
        </div>
      </MobileDrawer>
    );
  }
  return (
    <Popup
      active={showNotificationPanel}
      anchor={anchor}
      placement="bottom-end"
      distance={20}
      skidding={30}
    >
      <div
        className={`border w-96 p-3 py-4 flex flex-col gap-y-4 border-gray-border shadow-2xl rounded-2xl bg-white`}
        onScroll={handleScroll}
        ref={clickOutsideRef}
      >
        {popUpContent()}
      </div>
    </Popup>
  );
};
