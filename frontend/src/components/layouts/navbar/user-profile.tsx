import styles from "@/components/layouts/navbar/navbar.module.css";
import useScreenSize from "@/hooks/use-screen-size";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownPlacement } from "@/enums";
import { ELEMENT_DISTANCE_FROM_NAVBAR } from "@/config";
import { truncateString } from "@/utils";
import { useAuth } from "@/app/providers/auth-provider";
import { useNavigate } from "react-router-dom";
import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { Avatar } from "@/components/ui/avatar/avatar";

export const UserProfile = ({
  hideFullName,
  smallerSize,
}: {
  hideFullName?: boolean;
  smallerSize?: boolean;
}) => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const { isMobile, isTablet } = useScreenSize();

  const size = smallerSize ? "35px" : isTablet || isMobile ? "28px" : "40px";

  return (
    <DropDown
      menuItems={[
        {
          value: SHARED_CONTENT.navbar.userProfile.profile,
          onClick: () => {
            navigate(APPLICATION_ROUTES.PROFILE_BASE);
          },
        },
        {
          value: SHARED_CONTENT.navbar.userProfile.datasets,
          onClick: () => {
            navigate(APPLICATION_ROUTES.PROFILE_DATASETS);
          },
        },
        {
          value: SHARED_CONTENT.navbar.userProfile.models,
          onClick: () => {
            navigate(APPLICATION_ROUTES.PROFILE_MODELS);
          },
        },
        {
          value: SHARED_CONTENT.navbar.userProfile.settings,
          onClick: () => {
            navigate(APPLICATION_ROUTES.PROFILE_SETTINGS);
          },
        },
        {
          value: SHARED_CONTENT.navbar.userProfile.logout,
          onClick: () => {
            logout();
          },
          className: "logoutButton",
        },
      ]}
      distance={ELEMENT_DISTANCE_FROM_NAVBAR}
      placement={DropdownPlacement.BOTTOM_END}
      triggerComponent={
        <div className={styles.userProfile}>
          <Avatar label={user?.username} size={size} imageUrl={user?.img_url} />
          {!hideFullName && (
            <p className={styles.userProfileName}>
              {truncateString(user?.username, 20)}
            </p>
          )}
        </div>
      }
    ></DropDown>
  );
};
