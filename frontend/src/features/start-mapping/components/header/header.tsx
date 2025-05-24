import ModelAction from "@/features/start-mapping/components/header/model-action";
import { BrandLogoWithDropDown } from "@/features/start-mapping/components/header/logo-with-dropdown";
import { ButtonWithIcon } from "@/components/ui/button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import {
  ButtonVariant,
  DropdownPlacement,
  SHOELACE_SIZES,
  TileServiceType,
} from "@/enums";
import { ELEMENT_DISTANCE_FROM_NAVBAR } from "@/config";
import { Map } from "maplibre-gl";
import { ModelPredictionsTracker } from "@/features/start-mapping/components/header/model-predictions-tracker";
import { ModelSettings } from "@/features/start-mapping/components/model-settings";
import { TDownloadOptions, TQueryParams } from "@/app/routes/start-mapping";
import { TModelDetails, TModelPredictionFeature } from "@/types";
import { ToolTip } from "@/components/ui/tooltip";
import { UserProfile } from "@/components/layouts";
import { START_MAPPING_PAGE_CONTENT } from "@/constants";
import { ImagerySourceSelectorTriggerButton } from "@/features/start-mapping/components/replicable-models/imagery-source-selector-trigger-button";
import { PredictionImagerySource } from "@/enums/start-mapping";
import { ModelSelectorTriggerButton } from "@/features/start-mapping/components/replicable-models/model-selector-trigger-button";
import { ModelDetailsInfoButton } from "./model-details-info-button";
import { memo } from "react";

const StartMappingHeader = memo(
  ({
    modelInfo,
    modelPredictionsExist,
    modelInfoRequestIsPending,
    modelInfoRequestIsError,
    query,
    updateQuery,
    map,
    downloadOptions,
    predictionImagerySource,
    setPredictionImagerySource,
    modelDefaultImageryURL,
    predictionModel,
    setPredictionModel,
    predictionModelCheckpoint,
    setPredictionModelCheckpoint,
    customPredictionModelCheckpointPath,
    setCustomPredictionModelCheckpointPath,
    tileServerURL,
    tileServiceType,
    tileServiceTypeValidity,
    setTileServiceTypeValidity,
    setTileserverURL,
    loading,
    setTileServiceType,
    modelPredictions,
    setModelPredictions,
    isSmallViewport,
  }: {
    modelPredictionsExist: boolean;
    modelInfoRequestIsPending: boolean;
    modelInfoRequestIsError: boolean;
    modelInfo: TModelDetails;
    query: TQueryParams;
    updateQuery: (newParams: TQueryParams) => void;

    map: Map | null;
    downloadOptions: TDownloadOptions;
    predictionImagerySource: PredictionImagerySource;
    setPredictionImagerySource: React.Dispatch<
      React.SetStateAction<PredictionImagerySource>
    >;
    modelDefaultImageryURL: string;
    predictionModel: string;
    setPredictionModel: React.Dispatch<React.SetStateAction<string>>;
    predictionModelCheckpoint: string;
    setPredictionModelCheckpoint: React.Dispatch<React.SetStateAction<string>>;
    customPredictionModelCheckpointPath: string;
    setCustomPredictionModelCheckpointPath: React.Dispatch<
      React.SetStateAction<string>
    >;
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
    modelPredictions: TModelPredictionFeature[];
    setModelPredictions: (features: TModelPredictionFeature[]) => void;
    isSmallViewport: boolean;
  }) => {
    return (
      <div className="h-10">
        {modelInfoRequestIsPending || modelInfoRequestIsError ? (
          <div className="h-10 animate-pulse bg-light-gray"></div>
        ) : (
          <div className="flex items-center justify-between gap-x-1">
            <div className="flex items-center gap-x-2">
              <div>
                <BrandLogoWithDropDown />
              </div>
              <div className="flex gap-x-1 items-center">
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
                  isSmallViewport={isSmallViewport}
                />
                <div className="hidden lg:inline-block">
                  <ModelDetailsInfoButton
                    modelInfo={modelInfo}
                    modelInfoRequestIsPending={modelInfoRequestIsPending}
                    modelInfoRequestIsError={modelInfoRequestIsError}
                    predictionModel={predictionModel}
                  />
                </div>
              </div>
            </div>
            <div>
              <ImagerySourceSelectorTriggerButton
                predictionImagerySource={predictionImagerySource}
                setPredictionImagerySource={setPredictionImagerySource}
                modelDefaultImageryURL={modelDefaultImageryURL}
                setTileServiceType={setTileServiceType}
                tileServerURL={tileServerURL}
                tileServiceType={tileServiceType}
                tileServiceTypeValidity={tileServiceTypeValidity}
                setTileServiceTypeValidity={setTileServiceTypeValidity}
                setTileserverURL={setTileserverURL}
                loading={loading}
                isSmallViewport={isSmallViewport}
              />
            </div>
            <div className="flex flex-row items-center gap-x-2">
              <ModelSettings updateQuery={updateQuery} query={query} />
              <div className="flex flex-row items-center gap-y-3 gap-x-2">
                <ModelPredictionsTracker
                  features={modelPredictions}
                  resetModelPredictions={setModelPredictions}
                />
                <DropDown
                  placement={DropdownPlacement.TOP_END}
                  disableCheveronIcon
                  menuItems={downloadOptions}
                  distance={ELEMENT_DISTANCE_FROM_NAVBAR}
                  triggerComponent={
                    <ToolTip
                      content={
                        !modelPredictionsExist
                          ? START_MAPPING_PAGE_CONTENT.actions.disabledModeTooltip(
                              "see actions",
                            )
                          : null
                      }
                    >
                      <ButtonWithIcon
                        uppercase={false}
                        suffixIcon={ChevronDownIcon}
                        label={
                          START_MAPPING_PAGE_CONTENT.buttons.download.label
                        }
                        size={SHOELACE_SIZES.SMALL}
                        textClassName="text-body-4"
                        variant={ButtonVariant.SECONDARY}
                        disabled={!modelPredictionsExist}
                        iconClassName={`w-3 h-3`}
                      />
                    </ToolTip>
                  }
                />
              </div>
              <ModelAction
                map={map}
                query={query}
                modelInfo={modelInfo}
                tileServerURL={tileServerURL}
                predictionModelCheckpoint={predictionModelCheckpoint}
                setModelPredictions={setModelPredictions}
                modelPredictions={modelPredictions}
              />
              <UserProfile hideFullName smallerSize />
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default StartMappingHeader;
