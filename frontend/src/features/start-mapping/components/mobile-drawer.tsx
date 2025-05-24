import ModelAction from "@/features/start-mapping/components/header/model-action";
import { ChevronDownIcon, CloudDownloadIcon } from "@/components/ui/icons";
import { Map } from "maplibre-gl";
import {
  MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION,
} from "@/config";
import { MobileDrawer } from "@/components/ui/drawer";
import { ModelPredictionsTracker } from "@/features/start-mapping/components/header/model-predictions-tracker";
import { ModelSettings } from "@/features/start-mapping/components/model-settings";
import { TDownloadOptions, TQueryParams } from "@/app/routes/start-mapping";
import { TModelDetails, TModelPredictionFeature } from "@/types";
import { ToolTip } from "@/components/ui/tooltip";
import { useState } from "react";
import { START_MAPPING_PAGE_CONTENT } from "@/constants";
import { ImagerySourceSelectorTriggerButton } from "@/features/start-mapping/components/replicable-models/imagery-source-selector-trigger-button";
import { PredictionImagerySource } from "@/enums/start-mapping";
import { useMapStore } from "@/store/map-store";
import { ModelSelectorTriggerButton } from "@/features/start-mapping/components/replicable-models/model-selector-trigger-button";
import { ModelDetailsInfoButton } from "@/features/start-mapping/components/header/model-details-info-button";
import { TileServiceType } from "@/enums";

export const StartMappingMobileDrawer = ({
  isOpen,
  map,
  downloadOptions,
  query,
  updateQuery,
  modelInfo,
  modelInfoRequestIsPending,
  modelInfoRequestIsError,
  predictionImagerySource,
  setPredictionImagerySource,
  modelDefaultImageryURL,
  openMobileDialog,
  predictionModel,
  setPredictionModel,
  predictionModelCheckpoint,
  setPredictionModelCheckpoint,
  customPredictionModelCheckpointPath,
  setCustomPredictionModelCheckpointPath,
  openModelSelectionDialog,
  tileServerURL,
  tileServiceType,
  tileServiceTypeValidity,
  setTileServiceTypeValidity,
  loading,
  setTileServiceType,
  setTileserverURL,
  modelPredictions,
  setModelPredictions,
  isSmallViewport,
}: {
  isOpen: boolean;

  map: Map | null;
  downloadOptions: TDownloadOptions;
  query: TQueryParams;
  updateQuery: (newParams: TQueryParams) => void;

  modelInfo: TModelDetails;

  modelInfoRequestIsPending: boolean;
  modelInfoRequestIsError: boolean;

  predictionImagerySource: PredictionImagerySource;
  setPredictionImagerySource: React.Dispatch<
    React.SetStateAction<PredictionImagerySource>
  >;
  modelDefaultImageryURL: string;
  openMobileDialog: () => void;
  predictionModel: string;
  setPredictionModel: React.Dispatch<React.SetStateAction<string>>;
  predictionModelCheckpoint: string;
  setPredictionModelCheckpoint: React.Dispatch<React.SetStateAction<string>>;
  customPredictionModelCheckpointPath: string;
  setCustomPredictionModelCheckpointPath: React.Dispatch<
    React.SetStateAction<string>
  >;
  openModelSelectionDialog: () => void;
  tileServerURL: string;
  tileServiceType: TileServiceType;
  tileServiceTypeValidity: {
    valid: boolean;
    message: string;
  };
  setTileServiceTypeValidity: React.Dispatch<
    React.SetStateAction<{
      valid: boolean;
      message: string;
    }>
  >;
  setTileserverURL: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setTileServiceType: React.Dispatch<React.SetStateAction<TileServiceType>>;
  setModelPredictions: (features: TModelPredictionFeature[]) => void;
  modelPredictions: TModelPredictionFeature[];
  isSmallViewport: boolean;
}) => {
  const [showDownloadOptions, setShowDownloadOptions] =
    useState<boolean>(false);
  const currentZoom = useMapStore((state) => state.zoom);

  const disablePrediction =
    currentZoom < MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION;

  return (
    <MobileDrawer
      open={isOpen}
      dialogTitle="Start Mapping Mobile Dialog"
      snapPoints={[0.2, 0.9]}
    >
      <div className="mb-20">
        {disablePrediction && (
          <p className="text-center italic text-body-4 text-primary w-full">
            {MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION}
          </p>
        )}
        <div className="flex flex-col gap-y-6">
          <div className="flex items-center gap-x-2 w-full">
            <div className="flex-1">
              <ModelAction
                query={query}
                map={map}
                modelInfo={modelInfo}
                tileServerURL={tileServerURL}
                predictionModelCheckpoint={predictionModelCheckpoint}
                modelPredictions={modelPredictions}
                setModelPredictions={setModelPredictions}
              />
            </div>
            <div className="bg-off-white rounded-md p-1">
              <ModelDetailsInfoButton
                modelInfo={modelInfo}
                modelInfoRequestIsPending={modelInfoRequestIsPending}
                modelInfoRequestIsError={modelInfoRequestIsError}
                predictionModel={predictionModel}
              />
            </div>
          </div>
          <div className="flex items-center gap-x-2 w-full justify-between">
            <p className="text-body-3 text-nowrap">Model:</p>
            {modelInfo && (
              <ModelSelectorTriggerButton
                modelInfo={modelInfo}
                setPredictionModel={setPredictionModel}
                setPredictionModelCheckpoint={setPredictionModelCheckpoint}
                predictionModel={predictionModel}
                predictionModelCheckpoint={predictionModelCheckpoint}
                customPredictionModelCheckpointPath={
                  customPredictionModelCheckpointPath
                }
                setCustomPredictionModelCheckpointPath={
                  setCustomPredictionModelCheckpointPath
                }
                openMobileDialog={openModelSelectionDialog}
                isSmallViewport={isSmallViewport}
              />
            )}
          </div>
          <div className="flex items-center gap-x-2 w-full justify-between">
            <p className="text-body-3 text-nowrap">Prediction imagery:</p>
            <ImagerySourceSelectorTriggerButton
              predictionImagerySource={predictionImagerySource}
              setPredictionImagerySource={setPredictionImagerySource}
              modelDefaultImageryURL={modelDefaultImageryURL}
              openMobileDialog={openMobileDialog}
              setTileServiceType={setTileServiceType}
              tileServerURL={tileServerURL}
              tileServiceType={tileServiceType}
              tileServiceTypeValidity={tileServiceTypeValidity}
              setTileServiceTypeValidity={setTileServiceTypeValidity}
              loading={loading}
              setTileserverURL={setTileserverURL}
              isSmallViewport={isSmallViewport}
            />
          </div>
          <div className="text-body-3 font-normal flex items-center gap-x-2">
            {START_MAPPING_PAGE_CONTENT.mapData.title} -{" "}
            <ModelPredictionsTracker
              features={modelPredictions}
              resetModelPredictions={setModelPredictions}
            />
          </div>
          <div className="flex flex-col gap-y-4">
            <p className="text-body-3 font-semibold">Settings</p>
            <div className="border rounded-lg border-gray-border p-2">
              <ModelSettings query={query} updateQuery={updateQuery} isMobile />
            </div>
          </div>
          <div className="flex flex-col h-fit">
            <button
              className="flex w-fit items-center gap-x-4"
              disabled={disablePrediction}
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
            >
              <ToolTip
                content={
                  disablePrediction
                    ? START_MAPPING_PAGE_CONTENT.actions.disabledModeTooltip(
                        "see download options",
                      )
                    : null
                }
              >
                <p className="text-body-3 font-semibold">Download</p>
                <span>
                  <ChevronDownIcon
                    className={`icon  transition-all ${showDownloadOptions ? "rotate-180" : "rotate-0"}`}
                  />
                </span>
              </ToolTip>
            </button>
            {showDownloadOptions ? (
              <ul className="flex flex-col gap-y-4 text-body-3 mt-2">
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
      </div>
    </MobileDrawer>
  );
};
