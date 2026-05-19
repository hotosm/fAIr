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
import { MODELS_LIST, TryFairModel } from "@/features/try-fair/models";
import { OUTPUT_TYPES, RESOLUTIONS } from "@/features/try-fair/utils/constants.tsx";

type TryFairSidebarProps = {
  selectedModel: TryFairModel;
  onSelectModel: (model: TryFairModel) => void;
  outputType: TryFairMapOutputType;
  onOutputTypeChange: (type: TryFairMapOutputType) => void;
  resolution: TryFairResolution;
  onResolutionChange: (resolution: TryFairResolution) => void;
  confidence: number;
  onConfidenceChange: (value: number) => void;
};


export const TryFairSidebar = ({
  selectedModel,
  onSelectModel,
  outputType,
  onOutputTypeChange,
  resolution,
  onResolutionChange,
  confidence,
  onConfidenceChange,
}: TryFairSidebarProps) => {

  return (
    <div className="bg-white rounded-lg flex flex-col space-y-4 px-3 py-4 shadow-lg w-[300px] overflow-hidden">
      {/* ── Model selector + Map button ── */}
      <div className="flex bg-[#FAFAFA] items-center border p-2.5 gap-2 rounded-lg">
        <div className="flex-1 min-w-0 items-center">
          <ModelPicker
            selectedModel={selectedModel}
            onSelect={onSelectModel}
            models={MODELS_LIST}
          />
        </div>

        {/* Vertical divider */}
        <div className="self-stretch w-px bg-gray-border shrink-0" />

        <div className="">
          <Button
            type="button"
            size="medium"
            className="flex gap-2 items-center"
            rounded
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
              aria-label={label}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg ${
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
          <p className="text-dark text-xs">
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
            <a
              href="#"
              className="text-grey text-xs underline underline-offset-2"
              onClick={(e) => e.preventDefault()}
            >
              {TRY_FAIR_PAGE_CONTENT.sidebar.parameters.learnMore}
            </a>
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

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-dark text-xs font-medium">
              {TRY_FAIR_PAGE_CONTENT.sidebar.parameters.confidence.label}
            </p>
            <span className="text-dark text-xs font-semibold">
              {confidence}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SnowflakeIcon />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={confidence}
              onChange={(e) => onConfidenceChange(Number(e.target.value))}
              className="try-fair-confidence-slider flex-1 h-1.5 rounded-full appearance-none cursor-pointer outline-none"
              style={{
                background: `linear-gradient(90deg, #0088FF 0%, #FF383C 100%)`,
              }}
            />
            <FlameIcon />
          </div>
        </div>
      </div>
    </div>
  );
};
