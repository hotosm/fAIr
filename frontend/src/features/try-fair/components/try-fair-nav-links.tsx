import { useAuth } from "@/app/providers/auth-provider";
import { CloudDownloadIcon } from "@/components/ui/icons";
import { ShareIcon } from "@/components/ui/icons/share-icon";
import { ToolTip } from "@/components/ui/tooltip";
import { HANKO_URL } from "@/config";
import { APPLICATION_ROUTES } from "@/constants/routes";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { getDownloadData } from "@/features/try-fair/components/start-mapping/export-map-results";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { geoJSONDowloader } from "@/utils";
import { useNavigate } from "react-router-dom";

export const StartMappingNavlinks: React.FC = () => {
  const {
    setDownloadType,
    setShowSigninModal,
    setShowShareModal,
    predictions,
    outputType,
    predictionBBox,
    predictionGridZoom,
  } = useStartMappingStore();
  const hasPredictions = Boolean(predictions?.features?.length);
  const { isAuthenticated } = useAuth();
  const handleHankoLogin = () => {
    window.location.href = `${HANKO_URL}/app?return_to=${encodeURIComponent(window.location.href)}`;
  };
  const navigate = useNavigate();
  const handleSelect = (value: string) => {
    if (value === "download") {
      if (!predictions) return;
      const exportData = getDownloadData(
        predictions,
        outputType,
        predictionBBox,
        predictionGridZoom,
      );
      geoJSONDowloader(
        exportData,
        `fair-predictions-${outputType.toLowerCase()}`,
      );
      return;
    }
    setDownloadType(value);
  };
  return (
    <div className="hidden lg:flex shrink-0 items-center gap-3">
      {/* Help — text link */}

      {/* Download — icon button */}
      <ToolTip
        content={
          hasPredictions ? "Download results" : "Map to generate results"
        }
      >
        <button
          disabled={!hasPredictions}
          type="button"
          onClick={() => handleSelect("download")}
          className="flex items-center hover:text-gray-900 transition-colors text-inherit font-inherit cursor-pointer"
        >
          <CloudDownloadIcon className="size-6" />
        </button>
      </ToolTip>
      {/* Share — icon button */}
      <ToolTip content="Share">
        <button
          type="button"
          id={APP_TOUR_IDS.TRY_FAIR_SHARE_BUTTON}
          onClick={() => setShowShareModal(true)}
          className="flex items-center hover:text-gray-900 transition-colors text-inherit font-inherit cursor-pointer"
        >
          <ShareIcon className="size-6" />
        </button>
      </ToolTip>

      {/* Choose your own */}
      {/* <ToolTip content="Change Imagery">
        <button
          type="button"
          onClick={() => {
            setChooseLocation(true);
          }}
          className="bg-grey text-xs px-3 flex shrink-0 items-center whitespace-nowrap text-white !w-fit !h-8 md:min-w-fit !rounded-md min-w-[7.5rem]"
          aria-label="Choose a different location"
        >
          Choose your own
        </button>
      </ToolTip> */}

      {/* Map Large Area */}
      <ToolTip content="Map a large area">
        <button
          type="button"
          id={APP_TOUR_IDS.TRY_FAIR_MAP_LARGE_AREA_BUTTON}
          onClick={() => {
            if (!isAuthenticated) {
              setShowSigninModal(true);
            } else {
              handleSelect("large-area");
            }
          }}
          className="bg-grey text-xs px-3 flex shrink-0 items-center whitespace-nowrap text-white !w-fit !h-8 md:min-w-fit !rounded-md min-w-[7.5rem]"
          aria-label="Map a large area"
        >
          Map Large Area
        </button>
      </ToolTip>

      {isAuthenticated ? (
        <ToolTip content="Go to your dashboard">
          <button
            type="button"
            onClick={() => navigate(APPLICATION_ROUTES.PROFILE_BASE)}
            className="bg-dark text-xs px-3 flex shrink-0 items-center whitespace-nowrap text-white !w-fit !h-8 md:min-w-fit !rounded-md min-w-[7.5rem]"
            aria-label="Go to your dashboard"
          >
            Dashboard
          </button>
        </ToolTip>
      ) : (
        <ToolTip content="Login">
          <button
            type="button"
            onClick={handleHankoLogin}
            className="bg-dark text-xs px-3 flex shrink-0 items-center whitespace-nowrap text-white !w-fit !h-8 md:min-w-fit !rounded-md min-w-[7.5rem]"
            aria-label="Login"
          >
            Log in
          </button>
        </ToolTip>
      )}
    </div>
  );
};
