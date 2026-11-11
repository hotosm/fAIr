import { ArrowBackIcon } from "@/components/ui/icons";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { useNavigate } from "react-router-dom";
import { ProfilePageTitle } from "@/features/user-profile/components/profile-page-title";
import useScreenSize from "@/hooks/use-screen-size";

export const MapRequestsHeader = () => {
  const navigate = useNavigate();
  const { mappingMode } = useTryFairParams();
  const { isSmallViewport } = useScreenSize();
  // Phones always get Back (as in the mobile design); on wider screens the
  // advanced sidebar is the way out, so only basic mode shows it.
  const showBackButton = isSmallViewport || mappingMode !== "advanced";

  return (
    <div className="flex flex-col gap-y-4">
      {showBackButton && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-x-2 text-xs text-dark hover:text-primary transition-colors sm:text-sm"
        >
          <ArrowBackIcon className="size-4" />
          Back
        </button>
      )}
      <ProfilePageTitle
        title={isSmallViewport ? "Map Request" : "Map Requests"}
        showModeSwitch={false}
        // Phones have Back here, so no ☰ next to the title.
        showSidebarButton={!isSmallViewport}
      />
    </div>
  );
};
