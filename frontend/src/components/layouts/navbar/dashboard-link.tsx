import { SolidButton } from "@/components/shared/solid-button";
import { APPLICATION_ROUTES } from "@/constants";
import { useNavigate } from "react-router-dom";

export const DashboardLink = ({
  className,
  onClick,
}: {
  className?: string;
  /** Runs before navigating, e.g. to close the mobile menu. */
  onClick?: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <SolidButton
      onClick={() => {
        onClick?.();
        navigate(APPLICATION_ROUTES.PROFILE_BASE);
      }}
      variant="dark"
      className={className}
    >
      Dashboard
    </SolidButton>
  );
};
