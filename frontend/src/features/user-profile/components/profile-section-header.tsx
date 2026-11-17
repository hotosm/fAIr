import { AddIcon } from "@/components/ui/icons";
import { ButtonWithIcon } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ButtonVariant } from "@/enums";
import { ProfilePageTitle } from "@/features/user-profile/components/profile-page-title";

export const ProfileSectionHeader = ({
  title,
  createRoute,
  createButtonAlt,
}: {
  title: string;
  createRoute?: string;
  createButtonAlt?: string;
}) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(createRoute as string);
  };
  return (
    <ProfilePageTitle
      title={title}
      actions={
        createRoute &&
        createButtonAlt && (
          <ButtonWithIcon
            onClick={handleClick}
            variant={ButtonVariant.PRIMARY}
            prefixIcon={AddIcon}
            label={createButtonAlt}
          />
        )
      }
    />
  );
};
