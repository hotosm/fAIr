import { useEffect, useState } from "react";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { useImageryCountry } from "@/features/try-fair/hooks/use-imagery-country";
import { BuildingIcon } from "@/components/ui/icons/buildings-icon";
import { TreesIcon } from "@/components/ui/icons/trees-icon";
import { SwimmingPoolIcon } from "@/components/ui/icons/swimming-pool-icon";
import { ParkingIcon } from "@/components/ui/icons/parking-icon";
import { IconProps } from "@/types";
import { Button } from "@/components/ui/button";
import { GlobeSearchIcon } from "@/components/ui/icons/globe-search-icon";
import { ModelType } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { useAuth } from "@/app/providers/auth-provider";
import { DISABLE_AUTH_ON_TRY_FAIR } from "@/config";
import { ImagerySource } from "@/features/try-fair/components/imagery/imagery-location-modal";
import { flagEmoji } from "@/features/try-fair/utils/common";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import {
  FeatureToMapItem,
  useGetAPIBaseModels,
  useGetAPILocalModels,
  useGetFeaturesToMap,
} from "@/features/try-fair/api/features-to-map";
import { RoadsIcon } from "@/components/ui/icons/roads-icon";
import { SolarPanelIcon } from "@/components/ui/icons/solar-panel-icon";
import { cn } from "@/utils";
import { ChooseImageryIcon } from "@/components/ui/icons/choose-imagery-icon";
import { DoubleArrowIcon } from "@/components/ui/icons/double-arrow-icon";

// ─── Shared sub-components ────────────────────────────────────────────────────

const FEATURE_ICONS: Record<string, React.FC<IconProps>> = {
  building: BuildingIcon,
  buildings: BuildingIcon,
  tree: TreesIcon,
  trees: TreesIcon,
  swimming_pool: SwimmingPoolIcon,
  "swimming-pool": SwimmingPoolIcon,
  parking: ParkingIcon,
  roads: RoadsIcon,
  "solar-panels": SolarPanelIcon,
  solar_panels: SolarPanelIcon,
};

const getFeatureIcon = (slug: string): React.FC<IconProps> =>
  FEATURE_ICONS[slug] ?? BuildingIcon;

/** Small coloured chip: icon + label. */
const FeatureBadge = ({ label }: { label: string | undefined }) => {
  const Icon = FEATURE_ICONS[label ?? ""] ?? BuildingIcon;
  const featureLabel = (label ?? "").replace(/[-_]/g, " ");
  return (
    <span className="inline-flex gap-2 items-center px-2 py-0.5 capitalize rounded bg-grey text-white text-xs font-medium">
      <Icon />
      {featureLabel}
    </span>
  );
};

/** Radio indicator dot. */
const RadioDot = ({ selected }: { selected: boolean }) => (
  <span
    className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
      selected ? "border-primary" : "border-gray-border"
    }`}
  >
    {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
  </span>
);

/** Country flag chip. */
const CountryBadge = ({ country, code }: { country: string; code: string }) => (
  <span className="inline-flex gap-1.5 truncate items-center px-2 py-0.5 rounded bg-grey text-white text-xs font-medium">
    <span aria-hidden>{flagEmoji(code)}</span>
    {country}
  </span>
);

// ─── ModelPicker trigger ──────────────────────────────────────────────────────

type ModelPickerProps = {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
  loading?: boolean;
  disabled?: boolean;
  isSmallViewport: boolean;
  /** Opens the page-level modal dialog (desktop + mobile). */
  openMobileDialog?: () => void;
};

export const ModelPicker: React.FC<ModelPickerProps> = ({
  selectedModel,
  loading = false,
  disabled = false,
  isSmallViewport,
  openMobileDialog,
}) => {
  const selectedLocation = [
    selectedModel?.properties["fair:preview_place"],
    selectedModel?.properties["fair:preview_country"],
  ]
    .filter(Boolean)
    .join(", ");

  const { currentModelType, selectedImagery } = useStartMappingStore();

  const showImagery =
    currentModelType === ModelType.IMAGERY && !!selectedImagery;
  const imageryName =
    selectedImagery?.source === ImagerySource.OPEN_AERIAL_MAP
      ? selectedImagery.item.title
      : "Custom Imagery";

  const trigger = (
    <div className="flex justify-between items-center">
      <div className="w-full text-left flex-1 min-w-0">
        {loading ? (
          <p className="text-grey text-xs animate-pulse">Loading models…</p>
        ) : showImagery ? (
          <p className="font-semibold text-dark text-xs leading-tight capitalize truncate">
            {imageryName}
          </p>
        ) : selectedModel ? (
          <>
            <p className="font-semibold text-dark text-xs leading-tight">
              {selectedModel.properties.title}
            </p>
            {selectedLocation && (
              <p className="text-grey font-semibold text-[10px] leading-tight truncate">
                {selectedLocation}
              </p>
            )}
          </>
        ) : (
          <p className="text-grey text-xs">Select a model</p>
        )}
      </div>
    </div>
  );

  // Both viewports now open the page-level modal dialog.
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={openMobileDialog}
      className={cn(
        "w-full text-left",
        isSmallViewport ? "rounded-xl border px-3 py-2 bg-white" : "",
      )}
    >
      {trigger}
    </button>
  );
};

// ─── Sentinel key for imagery selection ──────────────────────────────────────

const IMAGERY_KEY = "imagery";

type StagedChoice =
  | { type: "model"; model: BaseModelStacItem }
  | { type: "imagery" };

// ─── Tab constants ────────────────────────────────────────────────────────────

const TAB_SAMPLES = "Samples";
const TAB_CHOOSE = "Choose your own";

// ─── Feature list item (Choose your own tab) ─────────────────────────────────

type FeatureListItemProps = {
  feature: FeatureToMapItem;
  isSelected: boolean;
  disabled: boolean;
  onSelect: (slug: string) => void;
};

const FeatureListItem = ({
  feature,
  isSelected,
  disabled,
  onSelect,
}: FeatureListItemProps) => {
  const { data: baseModels, isPending: isBaseModelsPending } =
    useGetAPIBaseModels(feature.slug);
  const { data: localModels, isPending: isLocalModelsPending } =
    useGetAPILocalModels(feature.slug);
  const hasNoModels =
    baseModels?.results.length === 0 && localModels?.results.length === 0;
  const isItemDisabled =
    disabled || isBaseModelsPending || isLocalModelsPending || hasNoModels;
  const FeatureIcon = getFeatureIcon(feature.slug);

  return (
    <button
      type="button"
      disabled={isItemDisabled}
      title={hasNoModels ? "No models available for this feature" : undefined}
      onClick={() => onSelect(feature.slug)}
      className={cn(
        "flex items-center justify-between w-full py-3 px-3 rounded-lg transition-colors text-left",
        isSelected ? "" : "",
        isItemDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
      )}
    >
      <div className="flex items-center gap-2">
        <FeatureIcon className="w-4 h-4 text-dark shrink-0" />
        <span className="text-xs font-medium text-dark">{feature.label}</span>
      </div>
      {isSelected && (
        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  );
};

// ─── ModelPickerContent ───────────────────────────────────────────────────────

/**
 * Standalone content rendered inside the page-level Dialog.
 * Contains two tabs: "Samples" (default-location model cards) and
 * "Choose your own" (feature list + imagery panel).
 */
export const ModelPickerContent = ({
  selectedModel,
  onSelect,
  models,
  onClose,
  feature,
  onFeatureChange,
  onChooseImagery,
}: {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
  /** Close the picker after a choice is applied. */
  onClose?: () => void;
  /** Currently selected feature slug (for "Choose your own" tab). */
  feature?: string;
  /** Called when the user picks a feature in "Choose your own". */
  onFeatureChange?: (slug: string) => void;
  /** Called when the user clicks "Choose Imagery" in "Choose your own". */
  onChooseImagery?: () => void;
}) => {
  const { isAuthenticated: _isAuthenticated } = useAuth();
  const isAuthenticated = DISABLE_AUTH_ON_TRY_FAIR || _isAuthenticated;
  const { setChooseLocation } = useTryFairParams();
  const {
    setShowSigninModal,
    setCurrentModelType,
    currentModelType,
    selectedImagery,
  } = useStartMappingStore();

  // Active tab
  const [activeTab, setActiveTab] = useState<string>(TAB_SAMPLES);

  // Staged choice (committed only on Apply)
  const [staged, setStaged] = useState<StagedChoice | null>(null);

  // Drop staged choice when committed selection changes.
  useEffect(() => {
    setStaged(null);
  }, [selectedModel, currentModelType]);

  // Imagery metadata
  const imageryCountry = useImageryCountry(selectedImagery?.bounds ?? null);
  const isOamImagery =
    selectedImagery?.source === ImagerySource.OPEN_AERIAL_MAP;
  const imageryTitle = isOamImagery
    ? selectedImagery.item.title
    : (imageryCountry?.place ?? "Custom Imagery");
  const imagerySourceLabel = isOamImagery ? "OpenAerialMap" : "Custom";

  // Feature list from API
  const { data: featuresData } = useGetFeaturesToMap();
  const featureList = (featuresData?.results ?? []).filter(
    (f) => f.slug !== "other",
  );
  const selectedFeature =
    featureList.find((f) => f.slug === feature) ?? featureList[0] ?? null;

  // Key helpers
  const keyOf = (choice: StagedChoice): string =>
    choice.type === "imagery" ? IMAGERY_KEY : choice.model.id;

  const committedKey =
    currentModelType === ModelType.IMAGERY
      ? IMAGERY_KEY
      : (selectedModel?.id ?? null);
  const stagedKey = staged ? keyOf(staged) : null;
  const activeKey = stagedKey ?? committedKey;
  const imageryActive = activeKey === IMAGERY_KEY;
  const hasChange = stagedKey !== null && stagedKey !== committedKey;

  const handleApply = () => {
    if (!staged) return;
    if (staged.type === "model") {
      onSelect(staged.model);
    } else {
      setCurrentModelType(ModelType.IMAGERY);
    }
    setStaged(null);
    onClose?.();
  };

  const handleChooseOwnImagery = () => {
    if (onChooseImagery) {
      onChooseImagery();
    } else {
      setChooseLocation(true);
      if (!isAuthenticated) {
        setShowSigninModal(true);
      }
    }
    onClose?.();
  };

  return (
    <div className="flex flex-col">
      {/* ── Tabs header ── */}
      <div className="flex border-b border-gray-border mb-4">
        {[TAB_SAMPLES, TAB_CHOOSE].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-primary text-dark"
                : "border-transparent text-grey hover:text-dark",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Samples tab ── */}
      {activeTab === TAB_SAMPLES && (
        <div className="space-y-4">
          {/* Banner: navigate to choose-your-own */}
          <button
            type="button"
            onClick={() => setActiveTab(TAB_CHOOSE)}
            className="w-full flex items-center justify-between gap-3 bg-dark text-white rounded-lg px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <GlobeSearchIcon className="text-white shrink-0" />
              <p className="text-sm">
                Choose your own <strong>feature</strong> and{" "}
                <strong>location</strong> to map
              </p>
            </div>
            <DoubleArrowIcon />
          </button>

          {/* Model cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {models.length > 0 ? (
              models.map((model) => {
                const isSelected = activeKey === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setStaged({ type: "model", model })}
                    className={cn(
                      "text-left p-3 bg-frosted-blue rounded-lg transition-colors",
                      isSelected ? "border-primary border-2" : "",
                    )}
                  >
                    <div className="flex space-y-2 items-start justify-between gap-2 mb-1">
                      <p className="text-dark capitalize text-sm font-bold leading-tight">
                        {model?.properties?.title ?? ""}
                      </p>
                      <RadioDot selected={isSelected} />
                    </div>
                    <p className="text-grey text-xs mb-0.5">
                      Model: {model?.properties?.["mlm:name"] ?? ""}
                    </p>
                    <p className="text-grey text-xs mb-2">
                      By: {model?.properties?.providers[0]?.name ?? ""}
                    </p>
                    <FeatureBadge
                      label={model?.properties?.keywords[0] ?? ""}
                    />
                  </button>
                );
              })
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-10 px-4 text-center">
                <p className="text-dark font-semibold text-sm mb-1">
                  No models available
                </p>
                <p className="text-grey text-xs max-w-xs">
                  There are currently no models available for use.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Choose your own tab ── */}
      {activeTab === TAB_CHOOSE && (
        <div className="flex gap-4 min-h-[320px]">
          {/* Left: Feature list */}
          <div className="w-[180px] shrink-0 border border-gray-border rounded-xl overflow-hidden flex flex-col">
            <p className="text-xs font-semibold text-grey px-3 pt-3 pb-2">
              Feature to map
            </p>
            <div className="flex flex-col flex-1 px-1 pb-2 overflow-y-auto">
              {featureList.map((f) => (
                <FeatureListItem
                  key={f.slug}
                  feature={f}
                  isSelected={selectedFeature?.slug === f.slug}
                  disabled={false}
                  onSelect={(slug) => onFeatureChange?.(slug)}
                />
              ))}
            </div>
          </div>

          {/* Right: Imagery panel */}
          <div className="flex-1 border border-gray-border rounded-xl overflow-hidden flex flex-col">
            {selectedImagery ? (
              /* Listed imagery — top-aligned like sample cards */
              <>
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <p className="text-xs font-semibold text-grey">Imagery</p>
                  <button
                    type="button"
                    onClick={handleChooseOwnImagery}
                    className="text-primary text-xs font-medium"
                  >
                    + Add imagery
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => setStaged({ type: "imagery" })}
                    className={cn(
                      "text-left p-3 w-full bg-frosted-blue rounded-lg transition-colors",
                      imageryActive
                        ? "border-primary border-2"
                        : "border border-transparent",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-dark capitalize text-sm font-medium leading-tight flex-1 min-w-0 break-words">
                        {imageryTitle}
                      </p>
                      <RadioDot selected={imageryActive} />
                    </div>
                    <p className="text-grey text-xs">
                      Imagery: {imagerySourceLabel}
                    </p>
                    {imageryCountry && (
                      <div className="mt-2">
                        <CountryBadge
                          country={imageryCountry.country}
                          code={imageryCountry.countryCode}
                        />
                      </div>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Empty state — centered */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
                <div>
                  <ChooseImageryIcon />
                </div>
                <p className="text-grey max-w-lg text-xs">
                  Choose an imagery to map{" "}
                  <span>{selectedFeature?.label ?? "buildings"}</span>
                </p>
                <Button
                  type="button"
                  size="medium"
                  className="!w-fit"
                  fontSize="12px"
                  rounded
                  onClick={handleChooseOwnImagery}
                >
                  Choose Imagery
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer: Apply button ── */}
      <div className="flex justify-end mt-4 pt-3 border-t border-gray-border">
        <Button
          type="button"
          size="medium"
          className="!w-fit"
          rounded
          fontSize="12px"
          disabled={!hasChange}
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};
