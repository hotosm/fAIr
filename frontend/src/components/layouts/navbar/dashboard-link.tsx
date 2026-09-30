import { SolidButton } from "@/components/shared/solid-button";
import { APPLICATION_ROUTES } from "@/constants";
import { useNavigate } from "react-router-dom";

export const DashboardLink = () => {
  const navigate = useNavigate();
  return (
    <SolidButton
      onClick={() => navigate(APPLICATION_ROUTES.PROFILE_BASE)}
      variant="dark"
    >
      Dashboard
    </SolidButton>
  );
};
