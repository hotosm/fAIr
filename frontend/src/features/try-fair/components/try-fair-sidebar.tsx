import { TryFairMapOutputType, TryFairResolution } from "@/enums/try-fair";
import { InfoIcon } from "@/components/ui/icons";
import { ModelPicker } from "./model-picker-modal";
import { TRY_FAIR_PAGE_CONTENT } from "@/constants/ui-contents/try-fair-contents";
import { Button } from "@/components/ui/button";
import { MapPlayIcon } from "@/components/ui/icons/map-play-icon";
import { ParametersIcon } from "@/components/ui/icons/parameters-icon";
import { SnowflakeIcon } from "@/components/ui/icons/snow-flake-icon";
import { GridIcon } from "@/components/ui/icons/grid-icon";
import { FlameIcon } from "@/components/ui/icons/flame-icon";
import { OUTPUT_TYPES, RESOLUTIONS } from "@/features/try-fair/utils/common";
import {
  BaseModelStacItem,
  InferenceParam,
} from "@/features/try-fair/api/stac";
import { cn } from "@/utils";
import useScreenSize from "@/hooks/use-screen-size";

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
  onMap: () => void;
  isPredicting: boolean;
  isMapButtonDisabled: boolean;
  className?: string;
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
  onMap,
  isPredicting,
  isMapButtonDisabled,
  className,
}: TryFairSidebarProps) => {
  const { isSmallViewport } = useScreenSize();

  return (
    <div
      className={cn(
        "bg-white rounded-lg flex flex-col space-y-4 p-2 sm:px-3 sm:py-4 shadow-lg w-[300px] overflow-hidden",
        className,
      )}
    >
      {/* ── Model selector + Map button ── */}
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
            loading={modelsLoading}
          />
        </div>

        {/* Vertical divider */}
        {!isSmallViewport && (
          <div className="self-stretch w-px bg-gray-border shrink-0" />
        )}

        <div>
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

      {/* ── Map Output ── */}
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
              className={`flex-1 flex disabled:cursor-not-allowed items-center justify-center py-2 rounded-lg ${
                outputType === type
                  ? "bg-secondary text-primary"
                  : "bg-off-white"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Parameters ── */}
      <div className="p-3 border bg-[#FAFAFA] rounded-lg border-gray-border space-y-4 flex flex-col">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <ParametersIcon />
          <p className="text-dark font-bold uppercase text-xs">
            {TRY_FAIR_PAGE_CONTENT.sidebar.parameters.label}
          </p>
        </div>

        {/* Description */}
        <div className="flex items-start gap-2">
          <InfoIcon className="size-6" />
          <div>
            <p className="text-grey text-xs italic leading-relaxed">
              {TRY_FAIR_PAGE_CONTENT.sidebar.parameters.description}{" "}
            </p>
          </div>
        </div>

        {/* Resolution */}
        <div>
          <p className="text-dark text-xs mb-2">
            {TRY_FAIR_PAGE_CONTENT.sidebar.parameters.resolution.label}
          </p>

          <div className="flex items-center gap-1">
            {RESOLUTIONS.map(({ value, label, size }) => (
              <button
                key={value}
                type="button"
                disabled={isPredicting}
                onClick={() => onResolutionChange(value)}
                className={`flex-1 gap-1 flex text-xs items-center justify-center py-2 rounded-lg ${
                  resolution === value ? "bg-secondary" : "bg-off-white"
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
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-dark text-xs font-medium">Confidence</p>
                  <span className="text-dark text-xs font-semibold">
                    {Math.round(Number(value) * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <SnowflakeIcon />

                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={0.01}
                    disabled={isPredicting}
                    value={Number(value)}
                    onChange={(e) =>
                      onParamChange(key, parseFloat(e.target.value))
                    }
                    className="try-fair-confidence-slider disabled:cursor-not-allowed flex-1 h-1.5 rounded-full appearance-none cursor-pointer outline-none"
                    style={{
                      background: `linear-gradient(90deg, #0088FF 0%, #FF383C 100%)`,
                    }}
                  />
                  <FlameIcon />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
