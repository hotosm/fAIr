import { ModelType, TryFairMapOutputType, TryFairResolution } from "@/enums";
import { ModelPicker } from "./model-picker-modal";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { Button } from "@/components/ui/button";
import { MapPlayIcon } from "@/components/ui/icons/map-play-icon";
import { ParametersIcon } from "@/components/ui/icons/parameters-icon";
import { SnowflakeIcon } from "@/components/ui/icons/snow-flake-icon";
import { GridIcon } from "@/components/ui/icons/grid-icon";
import { FlameIcon } from "@/components/ui/icons/flame-icon";
import {
  getAccuracyLabel,
  OUTPUT_TYPES,
  RESOLUTIONS,
} from "@/features/try-fair/utils/common";
import {
  BaseModelStacItem,
  InferenceParam,
} from "@/features/try-fair/api/stac";
import { cn } from "@/utils";
import useScreenSize from "@/hooks/use-screen-size";
import { RefreshIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import FeatureToMapDropdown from "@/features/try-fair/components/dropdowns/feature-to-map-dropdown";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";

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
  isPredicting: boolean;
  isMapButtonDisabled: boolean;
  className?: string;
  openMobileModelPickerDialog?: () => void;
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
  isPredicting,
  isMapButtonDisabled,
  className,
  openMobileModelPickerDialog,
}: TryFairSidebarProps) => {
  const { isSmallViewport } = useScreenSize();
  const { currentModelType } = useStartMappingStore();
  return (
    <div
      className={cn(
        "bg-white rounded-lg flex flex-col space-y-4 p-2 sm:px-3 sm:py-4 shadow-lg w-[300px] overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "flex bg-[#FAFAFA] border p-2.5 rounded-lg",
          isSmallViewport
            ? "flex-col items-stretch gap-2"
            : "items-center gap-2",
        )}
      >
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

        {/* Vertical divider */}
        {!isSmallViewport && (
          <div className="self-stretch w-px bg-gray-border shrink-0" />
        )}

        <div id={APP_TOUR_IDS.TRY_FAIR_MAP_BUTTON_TOOLTIP}>
          <Button
            type="button"
            size="medium"
            className="flex gap-2 items-center"
            rounded
            onClick={onMap}
            disabled={isMapButtonDisabled || isPredicting}
            fontSize="12px"
            spinner={isPredicting}
          >
            <MapPlayIcon />
            Map
          </Button>
        </div>
      </div>

      {currentModelType !== ModelType.DEMO && (
        <FeatureToMapDropdown disabled={isPredicting} />
      )}

      <div className="">
        <p className="text-dark text-xs mb-2">
          {TRY_FAIR_PAGE_CONTENT.sidebar.mapOutput.label}
        </p>
        <div className="flex items-center gap-2">
          {OUTPUT_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => onOutputTypeChange(type)}
              title={label}
              disabled={isPredicting}
              aria-label={label}
              className={`flex-1 flex disabled:cursor-wait items-center justify-center py-2 rounded-lg ${
                outputType === type
                  ? "bg-secondary text-primary border-[#D63F4080] border"
                  : "bg-off-white"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Parameters ── */}
      <div
        id={APP_TOUR_IDS.TRY_FAIR_PARAMETERS}
        className="p-3 border bg-[#FAFAFA] rounded-lg border-gray-border space-y-4 flex flex-col"
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

        {inferenceParams
          .filter((p) => p.key === "confidence_threshold")
          .map(({ key, spec }) => {
            const value = paramValues[key] ?? spec.default;
            const min = spec.min ?? 0;
            const max = spec.max ?? 1;

            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-dark text-xs font-medium">Accuracy</p>
                  <span className="text-[#404446] bg-off-white p-1 rounded-md text-xs ">
                    {getAccuracyLabel(value)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <SnowflakeIcon />
                  <div className="relative flex-1">
                    {[25, 50, 75].map((pct) => (
                      <div
                        key={pct}
                        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/80 pointer-events-none z-10"
                        style={{ left: `${pct}%` }}
                      />
                    ))}
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={0.25}
                      disabled={isPredicting}
                      value={Number(value)}
                      onChange={(e) =>
                        onParamChange(key, parseFloat(e.target.value))
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
            );
          })}
      </div>
    </div>
  );
};
