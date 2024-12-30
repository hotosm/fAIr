import ModelAction from "@/features/start-mapping/components/model-action";
import { ChevronDownIcon, CloudDownloadIcon } from "@/components/ui/icons";
import { Map } from "maplibre-gl";
import { MobileDrawer } from "@/components/ui/drawer";
import { ModelDetailsButton } from "@/features/start-mapping/components/model-details-button";
import { ModelPredictionsTracker } from "@/features/start-mapping/components/model-predictions-tracker";
import { ModelSettings } from "@/features/start-mapping/components/model-settings";
import { TDownloadOptions, TQueryParams } from "@/app/routes/start-mapping";
import { TModelPredictions } from "@/types";
import { TModelPredictionsConfig } from "@/features/start-mapping/api/get-model-predictions";
import { ToolTip } from "@/components/ui/tooltip";
import { useState } from "react";
import {
  START_MAPPING_PAGE_CONTENT,
  MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION,
} from "@/constants";

export const StartMappingMobileDrawer = ({
  isOpen,
  disablePrediction,
  trainingConfig,
  setModelPredictions,
  map,
  modelPredictions,
  handleModelDetailsPopup,
  downloadOptions,
  query,
  updateQuery,
  modelDetailsPopupIsActive,
  clearPredictions,
}: {
  isOpen: boolean;
  disablePrediction: boolean;
  trainingConfig: TModelPredictionsConfig;
  modelPredictions: TModelPredictions;
  setModelPredictions: React.Dispatch<React.SetStateAction<TModelPredictions>>;
  map: Map | null;
  handleModelDetailsPopup: () => void;
  modelDetailsPopupIsActive: boolean;
  downloadOptions: TDownloadOptions;
  query: TQueryParams;
  updateQuery: (newParams: TQueryParams) => void;
  clearPredictions: () => void;
}) => {
  const [showDownloadOptions, setShowDownloadOptions] =
    useState<boolean>(false);

  return (
    <MobileDrawer open={isOpen} dialogTitle="Start Mapping Mobile Dialog">
      {disablePrediction && (
        <p className="text-center italic text-body-4 text-primary w-full">
          {MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION}
        </p>
      )}
      <div className="app-padding flex flex-col gap-y-6 ">
        <div className="flex items-center justify-between my-4 gap-x-2">
          <div className="w-full basis-5/6">
            <ModelAction
              trainingConfig={trainingConfig}
              setModelPredictions={setModelPredictions}
              map={map}
              disablePrediction={disablePrediction}
              modelPredictions={modelPredictions}
            />
          </div>
          <div className="p-2 icon-interaction" id="anchor1">
            <ModelDetailsButton
              onClick={handleModelDetailsPopup}
              modelDetailsPopupIsActive={modelDetailsPopupIsActive}
            />
          </div>
        </div>
        <div className="text-body-3 font-normal flex items-center gap-x-2">
          {START_MAPPING_PAGE_CONTENT.mapData.title} -{" "}
          <ModelPredictionsTracker
            modelPredictions={modelPredictions}
            clearPredictions={clearPredictions}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <p className="text-body-3 font-semibold">Settings</p>
          <div className="border rounded-lg border-gray-border p-2">
            <ModelSettings query={query} updateQuery={updateQuery} isMobile />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <ToolTip
            content={
              disablePrediction
                ? START_MAPPING_PAGE_CONTENT.actions.disabledModeTooltip(
                    "see download options",
                  )
                : null
            }
          >
            <button
              className="flex w-fit items-center gap-x-4"
              disabled={disablePrediction}
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
            >
              <p className="text-body-3 font-semibold">Download</p>
              <span>
                <ChevronDownIcon
                  className={`icon  transition-all ${showDownloadOptions ? "rotate-180" : "rotate-0"}`}
                />
              </span>
            </button>
          </ToolTip>
          {showDownloadOptions ? (
            <ul className="flex flex-col gap-y-6 text-body-3">
              {downloadOptions
                .filter((option) => option.showOnMobile)
                .map((option) => (
                  <li key={option.value}>
                    <button
                      className="flex items-center gap-x-4"
                      onClick={option.onClick}
                    >
                      {option.name} <CloudDownloadIcon className="w-5 h-5" />
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      </div>
    </MobileDrawer>
  );
};
