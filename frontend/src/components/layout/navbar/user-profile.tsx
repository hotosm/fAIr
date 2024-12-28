import styles from "@/components/layout/navbar/navbar.module.css";
import SlAvatar from "@shoelace-style/shoelace/dist/react/avatar/index.js";
import { DropDown } from "@/components/ui/dropdown";
import { useNavigate } from "react-router-dom";
import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { truncateString } from "@/utils";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { useAuth } from "@/app/providers/auth-provider";
import useScreenSize from "@/hooks/use-screen-size";
import { DropdownPlacement } from "@/enums";
import { TCSSWithVars } from "@/types";

export const UserProfile = ({
  hideFullName,
  smallerSize,
}: {
  hideFullName?: boolean;
  smallerSize?: boolean;
}) => {
  const { user, logout } = useAuth();

  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useScreenSize();
  const size = smallerSize ? "35px" : isTablet || isMobile ? "28px" : "40px";
  return (
    <DropDown
      onDropdownShow={onDropdownShow}
      onDropdownHide={onDropdownHide}
      dropdownIsOpened={dropdownIsOpened}
      menuItems={[
        {
          value: SHARED_CONTENT.navbar.userProfile.models,
          onClick: () => {
            navigate(APPLICATION_ROUTES.ACCOUNT_MODELS);
            onDropdownHide();
          },
        },
        {
          value: SHARED_CONTENT.navbar.userProfile.settings,
          onClick: () => {
            navigate(APPLICATION_ROUTES.ACCOUNT_SETTINGS);
            onDropdownHide();
          },
        },
        {
          value: SHARED_CONTENT.navbar.userProfile.logout,
          onClick: () => {
            logout();
            onDropdownHide();
          },
          className: "logoutButton",
        },
      ]}
      distance={10}
      placement={DropdownPlacement.BOTTOM_END}
      triggerComponent={
        <div className={styles.userProfile}>
          <SlAvatar
            image={user?.img_url}
            label={user?.username}
            loading="lazy"
            initials={user?.username.charAt(0)}
            style={{ "--size": size } as TCSSWithVars}
          />
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
