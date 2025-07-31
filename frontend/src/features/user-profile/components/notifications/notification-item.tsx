import { TNotification } from "@/types";
import { useUpdateNotification } from "@/features/user-profile/hooks/use-notifications";
import { formatDate } from "@/utils";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";
import { useNavigate } from "react-router-dom";
import { APPLICATION_ROUTES } from "@/constants";
import { useCallback } from "react";
import { DropDown } from "@/components/ui/dropdown";
import { ElipsisIcon } from "@/components/ui/icons";
import { DropdownPlacement, NotificationType } from "@/enums";

export const NotificationItem = ({
  notification,
  closeNotificationPanel,
}: {
  notification: TNotification;
  closeNotificationPanel: () => void;
}) => {
  const { isPending, mutate } = useUpdateNotification({});
  const navigate = useNavigate();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;

      // Ignore clicks on the dropdown
      if (target.closest("sl-dropdown")) return;

      const modelId = notification.related_obj?.model ?? null;
      const shouldNavigateToModelsPage =
        modelId !== null &&
        notification.related_obj?.type === NotificationType.TRAINING;

      const goToModel = () => {
        closeNotificationPanel();
        if (shouldNavigateToModelsPage) {
          navigate(`${APPLICATION_ROUTES.MODELS}/${modelId}`);
        } else if (
          notification.related_obj?.type === NotificationType.PREDICTION
        ) {
          navigate(`${APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS}`);
        } else {
          navigate(`${APPLICATION_ROUTES.PROFILE_BASE}`);
        }
      };

      if (!notification.is_read) {
        mutate(
          { id: notification.id },
          {
            onSuccess: goToModel,
          },
        );
        return;
      }

      goToModel();
    },
    [notification, navigate, mutate],
  );

  return (
    <div
      onClick={handleClick}
      className="flex flex-col gap-y-4 p-3 items-start transition-colors duration-150 justify-between rounded-lg w-full hover:bg-gray-border cursor-pointer group"
    >
      <div className="flex w-full">
        <div className="w-3/4">
          <p className="text-body-4 h-1/2">{notification.message}</p>
        </div>
        <div className="w-1/4 flex items-center justify-end">
          {!notification.is_read && (
            <span className="w-2 h-2 bg-primary rounded-full" />
          )}
        </div>
      </div>
      <div className="w-full flex justify-between items-center group">
        <p className="text-body-4 text-grey">
          {formatDate(notification.created_at)}
        </p>
        <DropDown
          menuItems={[
            {
              value: USER_PROFILE_PAGE_CONTENT.notifications.markAsRead,
              className: "text-body-4",
              onClick: () => {
                mutate({ id: notification.id });
              },
              disabled: isPending,
            },
          ]}
          triggerComponent={<ElipsisIcon className="icon" />}
          placement={DropdownPlacement.BOTTOM_END}
          disableCheveronIcon
          className={`invisible transition-all duration-100 ${!notification.is_read && "group-hover:visible"}`}
        />
      </div>
    </div>
  );
};
