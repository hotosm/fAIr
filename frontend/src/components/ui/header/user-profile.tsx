import { TUser } from "@/types/api";
import styles from "./header.module.css";
import SlAvatar from "@shoelace-style/shoelace/dist/react/avatar/index.js";
import { DropDown } from "@/components/ui/dropdown";
import { useNavigate } from "react-router-dom";
import { APP_CONTENT, APPLICATION_ROUTES } from "@/utils";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";

type UserProfileProps = {
  logout: () => void;
  user: TUser;
};

const UserProfile: React.FC<UserProfileProps> = ({ logout, user }) => {

  const { onDropdownHide, onDropdownShow, dropdownIsOpened } = useDropdownMenu()
  const navigate = useNavigate();

  return (
    <DropDown
      onDropdownShow={onDropdownShow}
      onDropdownHide={onDropdownHide}
      dropdownIsOpened={dropdownIsOpened}
      menuItems={[
        {
          value: APP_CONTENT.navbar.userProfile.projects,
          onClick: () => navigate(APPLICATION_ROUTES.ACCOUNT_PROJECTS),
        },
        {
          value: APP_CONTENT.navbar.userProfile.settings,
          onClick: () => navigate(APPLICATION_ROUTES.ACCOUNT_SETTINGS),
        },
        {
          value: APP_CONTENT.navbar.userProfile.logout,
          onClick: logout,
          className: "logoutButton",
        },
      ]}
      placement="bottom-end"
    >
      <div className={styles.userProfile} >
        <SlAvatar
          image={user.img_url}
          label={user.username}
          loading="lazy"
          initials={user.username.charAt(0)}
        />
        <p className={styles.userProfileName}>{user.username}</p>
      </div>
    </DropDown>
  );
};

export default UserProfile;
