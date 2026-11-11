import { CloudDownloadIcon } from "@/components/ui/icons";
import { ShareIcon } from "@/components/ui/icons/share-icon";
import { ToolTip } from "@/components/ui/tooltip";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { PredictionHistoryButton } from "@/features/try-fair/components/prediction-history-button";
import { useTryFairActions } from "@/features/try-fair/hooks/use-try-fair-actions";

/** Desktop header actions. On phones the same actions live in the map "Menu". */
export const StartMappingNavlinks: React.FC = () => {
  const {
    isAuthenticated,
    hasPredictions,
    downloadResults,
    mapLargeArea,
    changeImagery,
    share,
  } = useTryFairActions();

  return (
    <div className="hidden shrink-0 items-center gap-4 lg:flex">
      {/* Help — text link */}
      <PredictionHistoryButton />
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
          onClick={downloadResults}
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
          onClick={share}
          className="flex items-center hover:text-gray-900 transition-colors text-inherit font-inherit cursor-pointer"
        >
          <ShareIcon className="size-6" />
        </button>
      </ToolTip>

      <ToolTip content="Change imagery">
        <button
          type="button"
          onClick={changeImagery}
          className="border border-light-gray bg-[#EEF1F7] text-[#2E2929] hover:bg-off-white transition-colors text-xs px-3 flex shrink-0 items-center whitespace-nowrap !w-fit !h-8 md:min-w-fit !rounded-md min-w-[7.5rem]"
          aria-label="Change imagery"
        >
          Change imagery
        </button>
      </ToolTip>
      <ToolTip content={isAuthenticated ? "Map an area" : "Login"}>
        <button
          type="button"
          id={
            isAuthenticated
              ? APP_TOUR_IDS.TRY_FAIR_MAP_LARGE_AREA_BUTTON
              : undefined
          }
          onClick={mapLargeArea}
          className={`${isAuthenticated ? "bg-grey" : "bg-dark"} text-xs px-3 flex shrink-0 items-center whitespace-nowrap text-white !w-fit !h-8 md:min-w-fit !rounded-md min-w-[7.5rem]`}
          aria-label={isAuthenticated ? "Map an area" : "Login"}
        >
          {isAuthenticated ? "Map an area" : "Login"}
        </button>
      </ToolTip>
    </div>
  );
};
