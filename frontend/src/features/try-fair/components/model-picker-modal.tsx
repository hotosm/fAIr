import { useEffect, useState } from "react";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { useImageryCountry } from "@/features/try-fair/hooks/use-imagery-country";
import { Button } from "@/components/ui/button";
import { GlobeSearchIcon } from "@/components/ui/icons/globe-search-icon";
import { ModelType } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { ImagerySource } from "@/features/try-fair/components/imagery/imagery-location-modal";
import type { ImagerySelection } from "@/features/try-fair/types/imagery-types";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { useGetFeaturesToMap } from "@/features/try-fair/api/features-to-map";
import { cn } from "@/utils";
import { ChooseImageryIcon } from "@/components/ui/icons/choose-imagery-icon";
import { DoubleArrowIcon } from "@/components/ui/icons/double-arrow-icon";
import { ChevronDownIcon } from "@/components/ui/icons";
import { LocationSearchIcon } from "@/components/ui/icons/location-search-icon";
import { FeatureListItem } from "@/features/try-fair/components/model-picker/feature-to-map-list";
import {
  RadioDot,
  FeatureBadge,
  ExperimentalModelBadge,
  SelectedModelBadge,
} from "@/features/try-fair/components/model-picker/model-picker-badges";
import { ImageryPreviewCard } from "@/features/try-fair/components/model-picker/imagery-preview-card";
import { RecentImageriesList } from "@/features/try-fair/components/model-picker/recent-imageries-list";
import type { RecentImageryEntry } from "@/features/try-fair/hooks/use-recent-imageries";
import { cleanFeatureLabel } from "@/features/try-fair/utils/common";

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
  // const place = selectedModel?.properties["fair:preview"]?.place;
  // const selectedLocation = [place?.name, place?.country]
  //   .filter(Boolean)
  //   .join(", ");
  const { feature } = useTryFairParams();
  const { currentModelType, selectedImagery } = useStartMappingStore();

  const isImagerySelected =
    currentModelType === ModelType.IMAGERY && !!selectedImagery;
  const selectedImageryName =
    selectedImagery?.source === ImagerySource.OPEN_AERIAL_MAP
      ? selectedImagery.item.title
      : "Custom Imagery";
  const triggerContent = (
    <div className="flex items-center justify-between gap-2 w-full">
      <LocationSearchIcon className="size-5 shrink-0 hidden md:inline-block" />
      <div className="w-full text-left flex-1 min-w-0">
        {isImagerySelected ? (
          <>
            <p className="font-semibold text-dark text-xs leading-tight capitalize truncate">
              {selectedImageryName}
            </p>
            <p className="text-grey capitalize font-semibold text-[10px] leading-tight truncate">
              {cleanFeatureLabel(feature)}
            </p>
          </>
        ) : loading ? (
          <p className="text-grey text-xs animate-pulse">Loading models…</p>
        ) : selectedModel ? (
          <>
            <p className="font-semibold text-dark text-xs leading-tight capitalize truncate">
              {selectedModel.properties.title}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-grey capitalize font-semibold text-[10px] leading-tight truncate">
                {cleanFeatureLabel(
                  selectedModel.properties["fair:category"] ?? "Building",
                )}
              </p>
              <ExperimentalModelBadge
                category={selectedModel.properties["fair:category"]}
              />
            </div>
          </>
        ) : (
          <p className="text-grey text-xs">Select a model</p>
        )}
      </div>
      <ChevronDownIcon className="size-3 shrink-0" />
    </div>
  );

  // Both viewports now open the page-level modal dialog.
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={openMobileDialog}
      className={cn(
        "w-full h-full flex items-center text-left cursor-pointer",
        isSmallViewport ? "rounded-xl border px-3 py-2 bg-white" : "",
      )}
    >
      {triggerContent}
    </button>
  );
};

// ─── Sentinel key for imagery selection ──────────────────────────────────────

const IMAGERY_KEY = "imagery";

type StagedChoice =
  | { type: "model"; model: BaseModelStacItem }
  | { type: "imagery"; entry?: RecentImageryEntry };

// ─── Tab constants ────────────────────────────────────────────────────────────

export const TAB_SAMPLES = "Samples";
export const TAB_CHOOSE = "Custom setup";

export const ModelPickerContent = ({
  selectedModel,
  onSelect,
  models,
  onClose,
  feature,
  onFeatureChange,
  onChooseImagery,
  stagedImagery,
  onApplyStagedImagery,
  recentImageries = [],
  onApplyRecentImagery,
  onClearRecentImageries,
}: {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
  onClose?: () => void;
  feature?: string;
  onFeatureChange?: (slug: string) => void;
  onChooseImagery?: () => void;
  stagedImagery?: ImagerySelection | null;
  onApplyStagedImagery?: (selection: ImagerySelection) => void;
  recentImageries?: RecentImageryEntry[];
  onApplyRecentImagery?: (entry: RecentImageryEntry) => void;
  onClearRecentImageries: () => void;
}) => {
  const { setChooseLocation, mode } = useTryFairParams();
  const { setCurrentModelType, currentModelType, selectedImagery } =
    useStartMappingStore();

  const isImageryModeActive =
    currentModelType === ModelType.IMAGERY || mode === ModelType.IMAGERY;

  const tabs = isImageryModeActive
    ? [TAB_CHOOSE, TAB_SAMPLES]
    : [TAB_SAMPLES, TAB_CHOOSE];

  // Active tab: defaults to whichever mode is currently active
  const [activeTab, setActiveTab] = useState<string>(() =>
    isImageryModeActive ? TAB_CHOOSE : TAB_SAMPLES,
  );

  // Imagery panel sub-view: "preview" shows the map card, "recent" shows the list.
  const [imageryPanelView, setImageryPanelView] = useState<
    "preview" | "recent"
  >("preview");

  // Choice staged in the picker but not yet applied (committed only on Apply).
  const [stagedChoice, setStagedChoice] = useState<StagedChoice | null>(null);

  // Feature staged in the picker but not yet applied (committed only on Apply).
  const [stagedFeatureSlug, setStagedFeatureSlug] = useState<string | null>(
    null,
  );

  // Drop staged choice and sync tab when committed selection changes.
  useEffect(() => {
    setStagedChoice(null);
    setStagedFeatureSlug(null);
    setActiveTab(
      currentModelType === ModelType.IMAGERY || mode === ModelType.IMAGERY
        ? TAB_CHOOSE
        : TAB_SAMPLES,
    );
  }, [selectedModel, currentModelType, mode]);

  // A new browser selection supersedes any unapplied recent-list choice.
  useEffect(() => {
    if (!stagedImagery) return;
    setStagedChoice(null);
    setImageryPanelView("preview");
    setActiveTab(TAB_CHOOSE);
  }, [stagedImagery]);

  // Imagery currently shown (staged selection, else the applied imagery).
  const activeImagerySelection =
    stagedChoice?.type === "imagery" && stagedChoice.entry
      ? stagedChoice.entry.selection
      : (stagedImagery ?? selectedImagery);

  // Imagery metadata
  const imageryCountry = useImageryCountry(
    activeImagerySelection?.bounds ?? null,
  );
  const isOpenAerialMapImagery =
    activeImagerySelection?.source === ImagerySource.OPEN_AERIAL_MAP;
  const activeImageryTitle = activeImagerySelection
    ? isOpenAerialMapImagery
      ? activeImagerySelection.item.title
      : (imageryCountry?.place ?? "Custom Imagery")
    : "";
  const activeImagerySourceLabel = isOpenAerialMapImagery
    ? "OpenAerialMap"
    : "Custom";

  // Feature list from API
  const { data: featuresResponse } = useGetFeaturesToMap();
  const featureOptions = (featuresResponse?.results ?? []).filter(
    (featureOption) => featureOption.slug !== "other",
  );
  const activeFeatureSlug = stagedFeatureSlug ?? feature;
  const activeFeature =
    featureOptions.find(
      (featureOption) => featureOption.slug === activeFeatureSlug,
    ) ??
    featureOptions[0] ??
    null;

  // A stable key identifying a model/imagery selection, used to detect changes.
  const getChoiceKey = (choice: StagedChoice): string =>
    choice.type === "imagery"
      ? (choice.entry?.tileUrl ?? IMAGERY_KEY)
      : choice.model.id;

  const appliedSelectionKey =
    currentModelType === ModelType.IMAGERY
      ? (selectedImagery?.tileUrl ?? IMAGERY_KEY)
      : (selectedModel?.id ?? null);
  const stagedChoiceKey = stagedChoice ? getChoiceKey(stagedChoice) : null;
  const stagedImageryKey = stagedImagery?.tileUrl ?? null;
  const hasStagedFeatureChange =
    stagedFeatureSlug !== null && stagedFeatureSlug !== feature;
  const hasUnappliedChanges =
    ((stagedChoiceKey ?? stagedImageryKey) !== null &&
      (stagedChoiceKey ?? stagedImageryKey) !== appliedSelectionKey) ||
    hasStagedFeatureChange;

  const handleApply = () => {
    if (!stagedChoice && !stagedImagery && !hasStagedFeatureChange) return;
    if (stagedChoice) {
      if (stagedChoice.type === "model") {
        onSelect(stagedChoice.model);
      } else {
        if (stagedChoice.entry) {
          onApplyRecentImagery?.(stagedChoice.entry);
        } else {
          setCurrentModelType(ModelType.IMAGERY);
        }
      }
    } else if (stagedImagery) {
      onApplyStagedImagery?.(stagedImagery);
    }
    if (hasStagedFeatureChange && stagedFeatureSlug) {
      onFeatureChange?.(stagedFeatureSlug);
    }
    setStagedChoice(null);
    setStagedFeatureSlug(null);
    onClose?.();
  };

  const handleChooseOwnImagery = () => {
    if (onChooseImagery) {
      onChooseImagery();
    } else {
      setChooseLocation(true);
    }
    onClose?.();
  };

  return (
    <div className="flex  flex-col">
      {/* ── Tabs header + Apply ── */}
      <div className="flex items-center border-b border-gray-border mb-4">
        <div className="flex flex-1">
          {tabs.map((tab) => (
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
        <div className="pb-3">
          <Button
            type="button"
            size="medium"
            className="!w-fit"
            rounded
            fontSize="12px"
            disabled={!hasUnappliedChanges}
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </div>

      {/* ── Samples tab ── */}
      {activeTab === TAB_SAMPLES && (
        <div className="space-y-4 h-[520px]">
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
                const isApplied = appliedSelectionKey === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => onSelect(model)}
                    className={cn(
                      "text-left p-3 bg-frosted-blue rounded-lg transition-colors",
                      isApplied ? "border-primary border-2" : "",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-dark capitalize text-sm font-bold leading-tight flex-1 min-w-0 break-words">
                        {model?.properties?.title ?? ""}
                      </p>
                      {isApplied ? (
                        <SelectedModelBadge selected={isApplied} />
                      ) : (
                        <RadioDot darkBorder={true} selected={false} />
                      )}
                    </div>
                    <p className="text-grey text-xs mb-0.5">
                      Model: {model?.properties?.["mlm:name"] ?? ""}
                    </p>
                    <p className="text-grey text-xs mb-2">
                      By: {model?.properties?.providers[0]?.name ?? ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <FeatureBadge
                        label={model?.properties?.keywords[0] ?? ""}
                      />
                      <ExperimentalModelBadge
                        category={model.properties["fair:category"]}
                      />
                    </div>
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

      {/* ── Custom setup tab ── */}
      {activeTab === TAB_CHOOSE && (
        <div className="flex gap-4 h-[520px]">
          {/* Left: Feature list */}
          <div className="w-[180px] shrink-0  overflow-hidden flex flex-col">
            <p className="text-xs pb-2">Feature to map</p>
            <div className="flex flex-col bg-frosted-blue border  rounded-lg flex-1 px-1  overflow-y-auto">
              {featureOptions.map((featureOption) => (
                <FeatureListItem
                  key={featureOption.slug}
                  feature={featureOption}
                  isSelected={activeFeatureSlug === featureOption.slug}
                  disabled={false}
                  onSelect={(slug) => setStagedFeatureSlug(slug)}
                />
              ))}
            </div>
          </div>

          {/* Right: Imagery panel */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeImagerySelection ? (
              imageryPanelView === "recent" ? (
                /* Recent imageries list sub-view */
                <RecentImageriesList
                  recentImageries={recentImageries}
                  currentTileUrl={activeImagerySelection.tileUrl}
                  onSelectRecent={(entry) => {
                    setStagedChoice({ type: "imagery", entry });
                    setImageryPanelView("preview");
                  }}
                  onBack={() => setImageryPanelView("preview")}
                  onClear={onClearRecentImageries}
                />
              ) : (
                /* Imagery preview with map — default sub-view */
                <>
                  <div className="flex items-center justify-between  pb-2">
                    <p className="text-sm  text-dark">Imagery</p>
                    <button
                      type="button"
                      onClick={() => setImageryPanelView("recent")}
                      className="text-primary flex items-center gap-1 text-xs font-medium"
                    >
                      Recent <ChevronDownIcon className="size-3 -rotate-90" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                    <ImageryPreviewCard
                      selectedImagery={activeImagerySelection}
                      imageryTitle={activeImageryTitle}
                      imagerySourceLabel={activeImagerySourceLabel}
                      imageryCountry={imageryCountry}
                      onChangeImagery={handleChooseOwnImagery}
                    />
                  </div>
                </>
              )
            ) : (
              /* Empty state — centered */
              <div>
                <p className="text-sm pb-2 text-dark">Imagery</p>

                <div className="flex-1 h-full min-h-[360px] flex border border-gray-border rounded-lg flex-col items-center justify-center p-6 text-center gap-4">
                  <div>
                    <ChooseImageryIcon />
                  </div>
                  <p className="text-grey max-w-lg text-xs">
                    Choose an imagery to map{" "}
                    <span>{activeFeature?.label ?? "buildings"}</span>
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
