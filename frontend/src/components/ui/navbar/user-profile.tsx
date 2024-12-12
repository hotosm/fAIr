
import styles from "@/components/ui/navbar/navbar.module.css";
import SlAvatar from "@shoelace-style/shoelace/dist/react/avatar/index.js";
import { DropDown } from "@/components/ui/dropdown";
import { useNavigate } from "react-router-dom";
import { APP_CONTENT, APPLICATION_ROUTES } from "@/utils";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { useAuth } from "@/app/providers/auth-provider";


const UserProfile = ({ hideFullName }: { hideFullName?: boolean }) => {
  const { user, logout } = useAuth();

  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();
  const navigate = useNavigate();

  return (
    <DropDown
      onDropdownShow={onDropdownShow}
      onDropdownHide={onDropdownHide}
      dropdownIsOpened={dropdownIsOpened}
      menuItems={[
        {
          value: APP_CONTENT.navbar.userProfile.models,
          onClick: () => {
            navigate(APPLICATION_ROUTES.ACCOUNT_MODELS);
            onDropdownHide();
          },
        },
        {
          value: APP_CONTENT.navbar.userProfile.settings,
          onClick: () => {
            navigate(APPLICATION_ROUTES.ACCOUNT_SETTINGS);
            onDropdownHide();
          },
        },
        {
          value: APP_CONTENT.navbar.userProfile.logout,
          onClick: () => {
            logout();
            onDropdownHide();
          },
          className: "logoutButton",
        },
      ]}
      distance={0}
      placement="bottom-end"
      triggerComponent={
        <div className={styles.userProfile}>
          <SlAvatar
            image={user.img_url}
            label={user.username}
            loading="lazy"
            initials={user.username.charAt(0)}

          />
          {!hideFullName && <p className={styles.userProfileName}>{user.username}</p>}
        </div>
      }
    ></DropDown>
  );
};

export default UserProfile;
