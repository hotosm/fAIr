import { SolidButton } from "@/components/shared/solid-button";
import { AddIcon } from "@/components/ui/icons";
import { ProfileEmptyStateIcon } from "@/components/ui/icons/profile-empty-state-icon";
import { useNavigate } from "react-router-dom";

const PageEmptyState = ({
  heading,
  subHeading,
  ctaText,
  ctaHref,
}: {
  heading: string;
  subHeading: string;
  ctaText: string;
  ctaHref: string;
}) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col space-y-4 jusitfy-center items-center ">
      <ProfileEmptyStateIcon />
      <h1 className="text-lg text-dark font-semibold">{heading}</h1>
      <p className="text-center text-sm text-grey max-w-sm">{subHeading}</p>

      <SolidButton
        onClick={() => navigate(ctaHref)}
        variant="primary"
        className="flex items-center gap-3"
      >
        <span className="bg-white rounded-full p-1">
          <AddIcon className="text-primary size-3" />
        </span>
        {ctaText}
      </SolidButton>
    </div>
  );
};

export default PageEmptyState;
