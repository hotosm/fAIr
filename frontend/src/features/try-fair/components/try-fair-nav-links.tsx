import { useAuth } from "@/app/providers/auth-provider";
import { CloudDownloadIcon } from "@/components/ui/icons";
import { ShareIcon } from "@/components/ui/icons/share-icon";
import { ToolTip } from "@/components/ui/tooltip";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { HANKO_URL } from "@/config";
import { getDownloadData } from "@/features/try-fair/components/start-mapping/export-map-results";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { geoJSONDowloader } from "@/utils";

export const StartMappingNavlinks: React.FC = () => {
  const { setChooseLocation } = useTryFairParams();
  const {
    setDownloadType,
    setShowShareModal,
    predictions,
    outputType,
    predictionBBox,
    predictionGridZoom,
  } = useStartMappingStore();
  const hasPredictions = Boolean(predictions?.features?.length);
  const { isAuthenticated } = useAuth();

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
          hasPredictions ? "Download results" : "Map to download results"
        }
      >
        <button
          disabled={!hasPredictions}
          aria-label="Download results"
          type="button"
          onClick={() => handleSelect("download")}
          className="flex items-center enabled:hover:text-gray-900 transition-colors text-inherit font-inherit cursor-pointer disabled:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <ToolTip content="Change imagery">
        <button
          type="button"
          onClick={() => {
            setChooseLocation(true);
          }}
          className={`${isAuthenticated ? "bg-dark" : "bg-grey"} text-xs px-3 flex shrink-0 items-center whitespace-nowrap text-white !w-fit !h-8 md:min-w-fit !rounded-md min-w-[7.5rem]`}
          aria-label="Change imagery"
        >
          Change imagery
        </button>
      </ToolTip>
      <ToolTip content={isAuthenticated ? "Map an area" : "Login"}>
        <button
          type="button"
          id={APP_TOUR_IDS.TRY_FAIR_MAP_LARGE_AREA_BUTTON}
          onClick={() => {
            if (!isAuthenticated) {
              window.location.href = `${HANKO_URL}/app?return_to=${encodeURIComponent(window.location.href)}`;
            } else {
              handleSelect("large-area");
            }
          }}
          className={`${isAuthenticated ? "bg-grey" : "bg-dark"} text-xs px-3 flex shrink-0 items-center whitespace-nowrap text-white !w-fit !h-8 md:min-w-fit !rounded-md min-w-[7.5rem]`}
          aria-label={isAuthenticated ? "Map an area" : "Login"}
        >
          {isAuthenticated ? "Map an area" : "Login"}
        </button>
      </ToolTip>
    </div>
  );
};
