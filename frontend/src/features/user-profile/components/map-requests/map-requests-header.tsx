import {  ChevronDownIcon } from "@/components/ui/icons";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { useNavigate } from "react-router-dom";

export const MapRequestsHeader = () => {
  const navigate = useNavigate();
  const { mappingMode } = useTryFairParams();
  const showBackButton = mappingMode !== "advanced";

  return (
    <div className="flex flex-col gap-y-4">
      {showBackButton && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-x-1.5 text-body-3 text-dark hover:text-primary transition-colors"
        >
          <ChevronDownIcon className="size-3.5 rotate-90" />
          Back
        </button>
      )}
      <h1 className="text-title-2 font-bold text-dark">Map Requests</h1>
    </div>
  );
};
