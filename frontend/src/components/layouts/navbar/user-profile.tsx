import styles from "@/components/layouts/navbar/navbar.module.css";
import useScreenSize from "@/hooks/use-screen-size";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownPlacement } from "@/enums";
import { ELEMENT_DISTANCE_FROM_NAVBAR } from "@/config";
import { truncateString } from "@/utils";
import { useAuth } from "@/app/providers/auth-provider";
import { Link } from "@/components/ui/link";
import { useNavigate } from "react-router-dom";
import { APPLICATION_ROUTES, SHARED_CONTENT } from "@/constants";
import { Avatar } from "@/components/ui/avatar/avatar";

const profileMenuItems = [
  {
    value: SHARED_CONTENT.navbar.userProfile.profile,
    route: APPLICATION_ROUTES.PROFILE_BASE,
  },
  {
    value: SHARED_CONTENT.navbar.userProfile.datasets,
    route: APPLICATION_ROUTES.PROFILE_DATASETS,
  },
  {
    value: SHARED_CONTENT.navbar.userProfile.models,
    route: APPLICATION_ROUTES.PROFILE_MODELS,
  },
  {
    value: SHARED_CONTENT.navbar.userProfile.offlinePredictions,
    route: APPLICATION_ROUTES.PROFILE_OFFLINE_PREDICTIONS,
  },
  {
    value: SHARED_CONTENT.navbar.userProfile.settings,
    route: APPLICATION_ROUTES.PROFILE_SETTINGS,
  },
];

export const UserProfile = ({
  hideFullName,
  smallerSize,
  isHanko,
  variant = "dropdown",
  onNavigate,
}: {
  hideFullName?: boolean;
  smallerSize?: boolean;
  isHanko?: boolean;
  variant?: "dropdown" | "list";
  onNavigate?: () => void;
}) => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const { isMobile, isTablet } = useScreenSize();

  const size = smallerSize ? "35px" : isTablet || isMobile ? "28px" : "40px";

  if (variant === "list") {
    return (
      <ul className={styles.profileList}>
        {profileMenuItems.map((item) => (
          <li key={item.route} className={styles.profileListItem}>
            <Link
              title={item.value}
              href={item.route}
              nativeAnchor={false}
              onClick={() => onNavigate?.()}
            >
              {item.value}
            </Link>
          </li>
        ))}
        {!isHanko && (
          <li className={styles.profileListItem}>
            <button
              onClick={() => {
                logout();
                onNavigate?.();
              }}
              className={styles.logoutButton}
            >
              {SHARED_CONTENT.navbar.userProfile.logout}
            </button>
          </li>
        )}
      </ul>
    );
  }

  return (
    <DropDown
      menuItems={[
        ...profileMenuItems.map((item) => ({
          value: item.value,
          onClick: () => navigate(item.route),
        })),
        ...(!isHanko
          ? [
              {
                value: SHARED_CONTENT.navbar.userProfile.logout,
                onClick: () => {
                  logout();
                },
                className: "logoutButton",
              },
            ]
          : []),
      ]}
      distance={ELEMENT_DISTANCE_FROM_NAVBAR}
      placement={DropdownPlacement.BOTTOM_END}
      triggerComponent={
        <div className={styles.userProfile}>
          {!isHanko && (
            <Avatar
              label={user?.username}
              size={size}
              imageUrl={user?.img_url}
            />
          )}
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
