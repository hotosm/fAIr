import { DropDown } from "@/components/ui/dropdown";
import { ChevronDownIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { ELEMENT_DISTANCE_FROM_NAVBAR } from "@/config";
import { DropdownPlacement, TileServiceType } from "@/enums";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { ImagerySourceSelector } from "@/features/start-mapping/components/replicable-models/imagery-source-selector";
import { PredictionImagerySource } from "@/enums/start-mapping";
import { useMemo } from "react";

type ImagerySourceSelectorTriggerButtonProps = {
  predictionImagerySource: PredictionImagerySource;
  setPredictionImagerySource: React.Dispatch<
    React.SetStateAction<PredictionImagerySource>
  >;
  modelDefaultImageryURL: string;
  openMobileDialog?: () => void;
  tileServerURL: string;
  tileServiceType: TileServiceType;
  tileServiceTypeValidity: {
    valid: boolean;
    message: string;
  };
  setTileServiceTypeValidity: React.Dispatch<
    React.SetStateAction<{ valid: boolean; message: string }>
  >;
  setTileserverURL: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setTileServiceType: React.Dispatch<React.SetStateAction<TileServiceType>>;
  isSmallViewport: boolean;
};

export const ImagerySourceSelectorTriggerButton = ({
  predictionImagerySource,
  setPredictionImagerySource,
  modelDefaultImageryURL,
  openMobileDialog,
  tileServerURL,
  tileServiceType,
  tileServiceTypeValidity,
  setTileServiceTypeValidity,
  setTileserverURL,
  loading,
  setTileServiceType,
  isSmallViewport,
}: ImagerySourceSelectorTriggerButtonProps) => {
  const { dropdownRef, onDropdownHide } = useDropdownMenu();

  const dropdownContent = useMemo(
    () => (
      <ImagerySourceSelector
        predictionImagerySource={predictionImagerySource}
        setPredictionImagerySource={setPredictionImagerySource}
        modelDefaultImageryURL={modelDefaultImageryURL}
        onDropdownHide={onDropdownHide}
        tileServerURL={tileServerURL}
        tileServiceType={tileServiceType}
        tileServiceTypeValidity={tileServiceTypeValidity}
        setTileServiceTypeValidity={setTileServiceTypeValidity}
        setTileserverURL={setTileserverURL}
        loading={loading}
        setTileServiceType={setTileServiceType}
      />
    ),
    [
      predictionImagerySource,
      setPredictionImagerySource,
      modelDefaultImageryURL,
      tileServerURL,
      tileServiceType,
      tileServiceTypeValidity,
      setTileServiceTypeValidity,
      setTileserverURL,
      loading,
      setTileServiceType,
    ],
  );

  return (
    <div className="flex items-center gap-x-1 w-fit">
      <p className="text-body-4 hidden lg:inline-block">Imagery:</p>
      <DropDown
        ref={dropdownRef}
        placement={DropdownPlacement.TOP_END}
        disableCheveronIcon
        disabled={isSmallViewport}
        distance={ELEMENT_DISTANCE_FROM_NAVBAR}
        triggerComponent={
          <ToolTip content={!isSmallViewport ? "Prediction Imagery" : ""}>
            <DropdownButton
              label={predictionImagerySource}
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

const DropdownButton = ({ label, isSmallViewport, onClick }: ButtonProps) => (
  <div className="px-2 bg-off-white hover:bg-opacity-50 flex items-center p-2 gap-x-2 rounded-[6px]">
    <button
      onClick={onClick}
      className={`${isSmallViewport ? "w-fit max-w-[100px]" : "max-w-[50px] lg:max-w-[100px]"} text-body-4 overflow-hidden text-ellipsis whitespace-nowrap`}
    >
      {label}
    </button>
    <ChevronDownIcon
      className={`transition-all ${isSmallViewport ? "-rotate-90" : ""} w-3 h-3`}
    />
  </div>
);
