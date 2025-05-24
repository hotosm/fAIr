import { ChevronDownIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { DropDown } from "@/components/ui/dropdown";
import { ELEMENT_DISTANCE_FROM_NAVBAR } from "@/config";
import { DropdownPlacement } from "@/enums";
import { TModelDetails } from "@/types";
import { PredictionModel } from "@/enums/start-mapping";
import { ModelSelector } from "@/features/start-mapping/components/replicable-models/model-selector";
import { useMemo } from "react";

type ModelSelectorTriggerButtonProps = {
  modelInfo: TModelDetails;
  predictionModel: string;
  setPredictionModel: React.Dispatch<React.SetStateAction<string>>;
  predictionModelCheckpoint: string;
  setPredictionModelCheckpoint: React.Dispatch<React.SetStateAction<string>>;
  customPredictionModelCheckpointPath: string;
  setCustomPredictionModelCheckpointPath: React.Dispatch<
    React.SetStateAction<string>
  >;
  isSmallViewport: boolean;
  openMobileDialog?: () => void;
};

export const ModelSelectorTriggerButton = ({
  modelInfo,
  predictionModel,
  setPredictionModel,
  predictionModelCheckpoint,
  setPredictionModelCheckpoint,
  customPredictionModelCheckpointPath,
  setCustomPredictionModelCheckpointPath,
  isSmallViewport,
  openMobileDialog,
}: ModelSelectorTriggerButtonProps) => {
  const dropdownLabel =
    predictionModel === PredictionModel.DEFAULT
      ? modelInfo?.name
      : predictionModel;

  const dropdownContent = useMemo(
    () => (
      <ModelSelector
        predictionModel={predictionModel}
        setPredictionModel={setPredictionModel}
        predictionModelCheckpoint={predictionModelCheckpoint}
        setPredictionModelCheckpoint={setPredictionModelCheckpoint}
        isMobile={isSmallViewport}
        defaultPredictionModel={modelInfo?.name}
        customPredictionModelCheckpointPath={
          customPredictionModelCheckpointPath
        }
        setCustomPredictionModelCheckpointPath={
          setCustomPredictionModelCheckpointPath
        }
        modelInfo={modelInfo}
      />
    ),
    [
      predictionModel,
      predictionModelCheckpoint,
      isSmallViewport,
      modelInfo,
      customPredictionModelCheckpointPath,
      setCustomPredictionModelCheckpointPath,
      setPredictionModel,
      setPredictionModelCheckpoint,
    ],
  );

  return (
    <div className="flex items-center gap-x-1 mr-1 lg:mr-0">
      <DropDown
        placement={DropdownPlacement.BOTTOM_START}
        disableCheveronIcon
        disabled={isSmallViewport}
        distance={ELEMENT_DISTANCE_FROM_NAVBAR}
        triggerComponent={
          <ToolTip content={!isSmallViewport ? "Prediction Model" : ""}>
            <DropdownButton
              label={dropdownLabel}
              isSmallViewport={isSmallViewport}
              onClick={isSmallViewport ? openMobileDialog : () => null}
            />
          </ToolTip>
        }
      >
        {dropdownContent}
      </DropDown>
    </div>
  );
};

type ButtonProps = {
  label: string;

  isSmallViewport: boolean;
  onClick?: () => void;
};

const DropdownButton = ({
  label,

  isSmallViewport,
  onClick,
}: ButtonProps) => (
  <div className="px-2 bg-off-white hover:bg-opacity-50 flex items-center p-2 gap-x-2 rounded-[6px]">
    <button
      onClick={onClick}
      className={`${
        isSmallViewport
          ? "w-fit max-w-[100px]"
          : "max-w-[50px] lg:max-w-[200px]"
      } text-body-4 overflow-hidden text-ellipsis whitespace-nowrap`}
    >
      {label}
    </button>
    <ChevronDownIcon
      className={`transition-all ${isSmallViewport ? "-rotate-90" : ""} w-3 h-3`}
    />
  </div>
);
