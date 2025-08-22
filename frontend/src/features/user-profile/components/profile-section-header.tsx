import { AddIcon } from "@/components/ui/icons";
import { ButtonWithIcon } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ButtonVariant } from "@/enums";

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
    <div className="flex justify-between items-center">
      <h1 className="font-bold text-title-3 md:text-title-2 self-start">
        {title}
      </h1>
      {createRoute && createButtonAlt && (
        <ButtonWithIcon
          onClick={handleClick}
          variant={ButtonVariant.PRIMARY}
          prefixIcon={AddIcon}
          label={createButtonAlt}
        />
      )}
    </div>
  );
};
