import { NotificationBellIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { USER_PROFILE_PAGE_CONTENT } from "@/constants/ui-contents/user-profile-content";

export const NotificationBell = ({
  showNotificationPanel,
  notificationAnchor,
  unreadCount,
  handleClick,
}: {
  showNotificationPanel: boolean;
  notificationAnchor: string;
  unreadCount: number;
  handleClick: () => void;
}) => {
  return (
    <ToolTip content={USER_PROFILE_PAGE_CONTENT.notifications.toolTip}>
      <button
        id={notificationAnchor}
        className={`cursor-pointer rounded-md p-2 hover:bg-hover-accent ${showNotificationPanel ? "bg-hover-accent" : ""}`}
        onClick={handleClick}
      >
        <div className="relative">
          <NotificationBellIcon className="size-5" />
          <div
            className={`absolute right-0 top-0 flex size-2 items-center justify-center rounded-full text-white ${unreadCount > 0 ? "bg-primary" : "bg-grey"}`}
          ></div>
        </div>
      </button>
    </ToolTip>
  );
};
