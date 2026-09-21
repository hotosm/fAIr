import {
  DropdownPlacement,
  TryFairMapOutputType,
  TryFairResolution,
} from "@/enums";
import { ModelPicker } from "./model-picker-modal";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { Button } from "@/components/ui/button";
import { MapPlayIcon, MapStopIcon } from "@/components/ui/icons/map-play-icon";
import { ParametersIcon } from "@/components/ui/icons/parameters-icon";
import { SnowflakeIcon } from "@/components/ui/icons/snow-flake-icon";
import { GridIcon } from "@/components/ui/icons/grid-icon";
import { FlameIcon } from "@/components/ui/icons/flame-icon";
import { ButtonVariant } from "@/enums";

import {
  getAccuracyLabel,
  getModelOutputType,
  OUTPUT_TYPES,
  RESOLUTIONS,
} from "@/features/try-fair/utils/common";
import {
  BaseModelStacItem,
  InferenceParam,
} from "@/features/try-fair/api/stac";
import { cn } from "@/utils";
import useScreenSize from "@/hooks/use-screen-size";
import { ChevronDownIcon, RefreshIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { LocationSearchIcon } from "@/components/ui/icons/location-search-icon";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { AdvancedModelPicker } from "@/features/try-fair/components/model-picker/advanced-model-picker-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useRef } from "react";
import { AdvancedSettingsPanel } from "@/features/try-fair/components/advanced-settings-panel";
import { DropDown } from "@/components/ui/dropdown";
import type { SlDropdownType } from "@/types";

type TryFairSidebarProps = {
  selectedModel: BaseModelStacItem | null;
  models: BaseModelStacItem[];
  modelsLoading: boolean;
  onSelectModel: (model: BaseModelStacItem) => void;
  outputType: TryFairMapOutputType;
  onOutputTypeChange: (type: TryFairMapOutputType) => void;
  resolution: TryFairResolution;
  onResolutionChange: (resolution: TryFairResolution) => void;
  inferenceParams: InferenceParam[];
  paramValues: Record<string, number | string | boolean>;
  onParamChange: (key: string, value: number | string | boolean) => void;
  onResetParameters: () => void;
  isParametersDefault: boolean;
  onMap: () => void;
  onCancelPrediction: () => void;
  isPredicting: boolean;
  isMapButtonDisabled: boolean;
  className?: string;
  openMobileModelPickerDialog?: () => void;
  openAdvancedModelPickerDialog?: () => void;
};

export const TryFairSidebar = ({
  selectedModel,
  models,
  modelsLoading,
  onSelectModel,
  outputType,
  onOutputTypeChange,
  resolution,
  onResolutionChange,
  inferenceParams,
  paramValues,
  onParamChange,
  onResetParameters,
  isParametersDefault,
  onMap,
  onCancelPrediction,
  isPredicting,
  isMapButtonDisabled,
  className,
  openMobileModelPickerDialog,
  openAdvancedModelPickerDialog,
}: TryFairSidebarProps) => {
  const { isSmallViewport } = useScreenSize();
  const { mappingMode } = useTryFairParams();
  const advancedSettingsDropdownRef = useRef<SlDropdownType>(null);

  const supportsPolygon = selectedModel
    ? getModelOutputType(selectedModel) === TryFairMapOutputType.POLYGON
    : true;
  const confidenceParam = inferenceParams.find(
    (param) => param.key === "confidence_threshold",
  );
  const confidenceValue =
    paramValues.confidence_threshold ?? confidenceParam?.spec.default ?? 0.7;
  const confidenceMin = confidenceParam?.spec.min ?? 0;
  const confidenceMax = confidenceParam?.spec.max ?? 1;
  const hasAdvancedSettings = inferenceParams.some(
    ({ key }) => key !== "confidence_threshold",
  );

  return (
    <div
      className={cn(
        "relative bg-white rounded-lg flex flex-col space-y-4 p-2 sm:px-3 sm:py-4 shadow-lg w-[300px] overflow-visible",
        className,
      )}
    >
      <div
        className={cn(
          "flex bg-gray-white border-[#687075] border  p-2.5 rounded-lg",
          isSmallViewport
            ? "flex-col items-stretch gap-2"
            : "items-center gap-2",
        )}
      >
        <div className="hidden md:inline-block">
          <LocationSearchIcon className="size-5" />
        </div>
        <div className="flex-1 min-w-0 items-center">
          <ModelPicker
            selectedModel={selectedModel}
            onSelect={onSelectModel}
            models={models}
            disabled={isPredicting}
            loading={modelsLoading}
            isSmallViewport={isSmallViewport}
            openMobileDialog={openMobileModelPickerDialog}
          />
        </div>
          <ChevronDownIcon className="size-3" />

        {/* Vertical divider */}
        {!isSmallViewport && (
          <div className="self-stretch w-px bg-gray-border shrink-0" />
        )}

        <div
          id={APP_TOUR_IDS.TRY_FAIR_MAP_BUTTON_TOOLTIP}
          className="flex items-center gap-2"
        >
          {isPredicting ? (
            <>
              <Spinner />
              <Button
                type="button"
                size="medium"
                rounded
              className="flex gap-2 items-center"
                variant={ButtonVariant.TERTIARY}
                onClick={onCancelPrediction}
                fontSize="12px"
              >
                <MapStopIcon className="size-4" />
                Stop
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="medium"
              className="flex gap-2 items-center"
              rounded
              onClick={onMap}
              disabled={isMapButtonDisabled}
              fontSize="12px"
            >
              <MapPlayIcon className="size-4" />
              Map
            </Button>
          )}
        </div>
      </div>

      {/* ── Model selector (advanced mode only) ── */}
      {mappingMode === "advanced" && (
        <AdvancedModelPicker
          selectedModel={selectedModel}
          disabled={isPredicting}
          loading={modelsLoading}
          openDialog={openAdvancedModelPickerDialog}
        />
      )}

      <div className="">
        <p className="text-dark text-xs mb-2">
          {TRY_FAIR_PAGE_CONTENT.sidebar.mapOutput.label}
        </p>
        <div className="flex items-center gap-2">
          {OUTPUT_TYPES.map(({ type, label, icon }) => {
            const optionDisabled =
              isPredicting ||
              (type === TryFairMapOutputType.POLYGON && !supportsPolygon);
            return (
              <button
                key={type}
                type="button"
                onClick={() => onOutputTypeChange(type)}
                title={label}
                disabled={optionDisabled}
                aria-label={label}
                className={cn(
                  "flex-1 flex items-center justify-center py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-40",
                  outputType === type
                    ? "bg-secondary text-primary border-[#D63F4080] border"
                    : "bg-off-white",
                )}
              >
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Parameters ── */}
      <div
        id={APP_TOUR_IDS.TRY_FAIR_PARAMETERS}
        className="p-3 border bg-gray-white rounded-lg border-gray-border space-y-4 flex flex-col"
      >
        {/* Section header */}
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center gap-2">
            <ParametersIcon />
            <p className="text-dark font-bold uppercase text-xs">
              {TRY_FAIR_PAGE_CONTENT.sidebar.parameters.label}
            </p>
          </div>

          <ToolTip content={"Reset Parameters"}>
            <button
              type="button"
              className={`border p-2 rounded-md transition-opacity ${
                isParametersDefault || isPredicting
                  ? "bg-[#F0EFEF] opacity-40 cursor-not-allowed"
                  : "bg-[#F0EFEF] hover:bg-[#E5E4E4]"
              }`}
              disabled={isParametersDefault || isPredicting}
              onClick={onResetParameters}
            >
              <RefreshIcon />
            </button>
          </ToolTip>
        </div>

        {/* Description */}
        <div className="flex items-start gap-2">
          <div>
            <p className="text-grey text-xs leading-relaxed">
              {TRY_FAIR_PAGE_CONTENT.sidebar.parameters.description}{" "}
            </p>
          </div>
        </div>

        {/* Resolution */}
        <div>
          <p className="text-dark text-xs mb-2 font-medium">
            {TRY_FAIR_PAGE_CONTENT.sidebar.parameters.resolution.label}
          </p>

          <div className="flex items-center gap-1">
            {RESOLUTIONS.map(({ value, label, size }) => (
              <button
                key={value}
                type="button"
                disabled={isPredicting}
                onClick={() => onResolutionChange(value)}
                className={`flex-1 gap-1 flex disabled:cursor-wait text-xs items-center justify-center py-2 rounded-lg ${
                  resolution === value
                    ? "bg-secondary border-[#D63F4080] border"
                    : "bg-off-white"
                }`}
              >
                <GridIcon width={size} height={size} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-dark text-xs font-medium">Accuracy</p>
            <span className="text-[#404446] bg-off-white p-1 rounded-md text-xs ">
              {getAccuracyLabel(confidenceValue)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <SnowflakeIcon />
            <div className="relative flex-1">
              {[50].map((pct) => (
                <div
                  key={pct}
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/80 pointer-events-none z-10"
                  style={{ left: `${pct}%` }}
                />
              ))}
              <input
                type="range"
                min={confidenceMin}
                max={confidenceMax}
                step={0.5}
                disabled={isPredicting}
                value={Number(confidenceValue)}
                onChange={(e) =>
                  onParamChange(
                    "confidence_threshold",
                    parseFloat(e.target.value),
                  )
                }
                className="try-fair-confidence-slider disabled:cursor-wait w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none"
                style={{
                  background: `linear-gradient(90deg, #0088FF 0%, #FF383C 100%)`,
                }}
              />
            </div>
            <FlameIcon />
          </div>
        </div>

        {hasAdvancedSettings && mappingMode === "advanced" && (
          <DropDown
            ref={advancedSettingsDropdownRef}
            placement={
              isSmallViewport
                ? DropdownPlacement.BOTTOM_START
                : DropdownPlacement.RIGHT_START
            }
            distance={20}
            hoist
            disableCheveronIcon
            disabled={isPredicting}
            triggerComponent={
              <button
                type="button"
                disabled={isPredicting}
                className="flex w-full items-center justify-between text-left text-xs text-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Advanced Settings
                <span className="text-lg leading-none">›</span>
              </button>
            }
          >
            <AdvancedSettingsPanel
              closePanel={() => advancedSettingsDropdownRef.current?.hide()}
              inferenceParams={inferenceParams}
              paramValues={paramValues}
              onParamChange={onParamChange}
              onReset={onResetParameters}
              isPredicting={isPredicting}
            />
          </DropDown>
        )}
      </div>
    </div>
  );
};
