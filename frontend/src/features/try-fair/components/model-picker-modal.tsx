import { useEffect, useState } from "react";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { useImageryCountry } from "@/features/try-fair/hooks/use-imagery-country";
import { Button } from "@/components/ui/button";
import { GlobeSearchIcon } from "@/components/ui/icons/globe-search-icon";
import { ModelType } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { useAuth } from "@/app/providers/auth-provider";
import { DISABLE_AUTH_ON_TRY_FAIR } from "@/config";
import { ImagerySource } from "@/features/try-fair/components/imagery/imagery-location-modal";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import {
  useGetFeaturesToMap,
} from "@/features/try-fair/api/features-to-map";
import { cn } from "@/utils";
import { ChooseImageryIcon } from "@/components/ui/icons/choose-imagery-icon";
import { DoubleArrowIcon } from "@/components/ui/icons/double-arrow-icon";
import { ChevronDownIcon } from "@/components/ui/icons";
import { FeatureListItem } from "@/features/try-fair/components/model-picker/feature-to-map-list";
import { RadioDot, FeatureBadge } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { ImageryPreviewCard } from "@/features/try-fair/components/model-picker/imagery-preview-card";
import { RecentImageriesList } from "@/features/try-fair/components/model-picker/recent-imageries-list";
import type { RecentImageryEntry } from "@/features/try-fair/hooks/use-recent-imageries";





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
  | { type: "imagery"; entry?: RecentImageryEntry };

// ─── Tab constants ────────────────────────────────────────────────────────────

const TAB_SAMPLES = "Samples";
const TAB_CHOOSE = "Choose your own";



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
  recentImageries = [],
  onApplyRecentImagery,
}: {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
  onClose?: () => void;
  feature?: string;
  onFeatureChange?: (slug: string) => void;
  onChooseImagery?: () => void;
  recentImageries?: RecentImageryEntry[];
  onApplyRecentImagery?: (entry: RecentImageryEntry) => void;
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

  // Imagery panel sub-view: "preview" shows the map card, "recent" shows the list.
  const [imageryView, setImageryView] = useState<"preview" | "recent">("preview");

  // Staged choice (committed only on Apply)
  const [staged, setStaged] = useState<StagedChoice | null>(null);

  // Drop staged choice when committed selection changes.
  useEffect(() => {
    setStaged(null);
  }, [selectedModel, currentModelType]);

  // Active imagery choice (staged selection or committed imagery)
  const activeImagery =
    staged?.type === "imagery" && staged.entry
      ? staged.entry.selection
      : selectedImagery;

  // Imagery metadata
  const imageryCountry = useImageryCountry(activeImagery?.bounds ?? null);
  const isOamImagery =
    activeImagery?.source === ImagerySource.OPEN_AERIAL_MAP;
  const imageryTitle = activeImagery
    ? isOamImagery
      ? activeImagery.item.title
      : (imageryCountry?.place ?? "Custom Imagery")
    : "";
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
    choice.type === "imagery"
      ? (choice.entry?.tileUrl ?? IMAGERY_KEY)
      : choice.model.id;

  const committedKey =
    currentModelType === ModelType.IMAGERY
      ? (selectedImagery?.tileUrl ?? IMAGERY_KEY)
      : (selectedModel?.id ?? null);
  const stagedKey = staged ? keyOf(staged) : null;
  const activeKey = stagedKey ?? committedKey;
  const hasChange = stagedKey !== null && stagedKey !== committedKey;

  const handleApply = () => {
    if (!staged) return;
    if (staged.type === "model") {
      onSelect(staged.model);
    } else {
      if (staged.entry) {
        onApplyRecentImagery?.(staged.entry);
      } else {
        setCurrentModelType(ModelType.IMAGERY);
      }
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
        <div className="space-y-4 min-h-[420px]">
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
        <div className="flex gap-4 min-h-[420px]">
          {/* Left: Feature list */}
          <div className="w-[180px] shrink-0 border  rounded-lg overflow-hidden flex flex-col">
            <p className="text-xs font-semibold text-grey px-3 pt-3 pb-2">
              Feature to map
            </p>
            <div className="flex flex-col bg-frosted-blue flex-1 px-1 pb-2 overflow-y-auto">
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
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeImagery ? (
              imageryView === "recent" ? (
                /* Recent imageries list sub-view */
                <RecentImageriesList
                  recentImageries={recentImageries}
                  currentTileUrl={activeImagery.tileUrl}
                  onSelectRecent={(entry) => {
                    setStaged({ type: "imagery", entry });
                    setImageryView("preview");
                  }}
                  onBack={() => setImageryView("preview")}
                />
              ) : (
                /* Imagery preview with map — default sub-view */
                <>
                  <div className="flex items-center justify-between  pb-2">
                    <p className="text-sm  text-dark">Imagery</p>
                    <button
                      type="button"
                      onClick={() => setImageryView("recent")}
                      className="text-primary flex items-center gap-1 text-xs font-medium"
                    >
                      Recent <ChevronDownIcon className="size-3 -rotate-90" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                    <ImageryPreviewCard
                      selectedImagery={activeImagery}
                      imageryTitle={imageryTitle}
                      imagerySourceLabel={imagerySourceLabel}
                      imageryCountry={imageryCountry}
                      onChangeImagery={handleChooseOwnImagery}
                    />
                  </div>
                </>
              )
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
      <div className="flex justify-end mt-4 pt-3">
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
