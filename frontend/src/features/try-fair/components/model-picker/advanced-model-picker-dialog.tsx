import { createPortal } from "react-dom";
import {
  SwitchSampleDialog,
  shouldShowSwitchWarning,
} from "@/features/try-fair/components/model-picker/switch-sample-dialog";
import { useState, useMemo, useEffect } from "react";
import {
  useGetAllAPIBaseModels,
  useGetAllAPILocalModels,
  useGetFeaturesToMap,
} from "@/features/try-fair/api/features-to-map";
import {
  RadioDot,
  ExperimentalModelBadge,
} from "@/features/try-fair/components/model-picker/model-picker-badges";
import useScreenSize from "@/hooks/use-screen-size";
import { SearchIcon } from "@/components/ui/icons/search-icon";
import { ChevronDownIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { ToolTip } from "@/components/ui/tooltip";
import { DropdownPlacement, ModelType } from "@/enums";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import type { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { StarredIcon } from "@/components/ui/icons/starred-icon";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import {
  FeatureDropdown,
  FeatureListItem,
} from "@/features/try-fair/components/model-picker/feature-to-map-list";
import { APIBaseModelItem } from "@/features/try-fair/types/data-types";
import { ModelDetailsDialog } from "@/features/try-fair/components/model-picker/model-details-dialog";

type ModelSource = "base" | "local";

const MODEL_SOURCE_LABELS: Record<ModelSource, string> = {
  base: "Base Models",
  local: "Local Models",
};

const ITEMS_PER_PAGE = 3;

type AdvancedModelPickerProps = {
  selectedModel: BaseModelStacItem | null;
  loading?: boolean;
  disabled?: boolean;
  openDialog?: () => void;
};

export const AdvancedModelPicker: React.FC<AdvancedModelPickerProps> = ({
  selectedModel,
  loading = false,
  disabled = false,
  openDialog,
}) => {
  return (
    <div>
      <p className="text-dark text-xs mb-2">Model</p>
      <button
        type="button"
        onClick={openDialog}
        disabled={disabled}
        className="w-full flex items-center justify-between bg-gray-white border border-gray-border rounded-lg px-3 py-2.5 transition-colors hover:border-grey disabled:cursor-wait"
      >
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
          <span className="max-w-full text-dark text-sm font-medium truncate">
            {loading ? (
              <span className="text-grey text-xs animate-pulse">
                Loading models…
              </span>
            ) : (
              (selectedModel?.properties.title ?? "Select a model")
            )}
          </span>
        </span>
        <ChevronDownIcon className="size-4 text-grey shrink-0" />
      </button>
    </div>
  );
};

type AdvancedModelPickerContentProps = {
  feature: string;
  onSelect: (model: BaseModelStacItem) => void;
  onFeatureChange?: (slug: string) => void;
  /** Closes the picker once a model has been applied. */
  onClose?: () => void;
};

/**
 * Changing the feature is held here as temporary state and never picks a
 * model: the new feature's list starts unselected and nothing on the page
 * changes until the user clicks a model. Clicking a model applies it (with
 * the feature, after the Samples warning) and closes the picker. Closing
 * without clicking one keeps the model selected before the picker opened;
 * the picker is unmounted when closed, so every opening starts fresh.
 */
export const AdvancedModelPickerContent = ({
  feature,
  onSelect,
  onFeatureChange,
  onClose,
}: AdvancedModelPickerContentProps) => {
  const [source, setSource] = useState<ModelSource>("base");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const { isSmallViewport } = useScreenSize();
  const { selectedModelId, modelId, setSelectedModelId, mode } =
    useTryFairParams();
  const activeModelId = selectedModelId ?? modelId;
  // Model whose details dialog is open.
  const [detailsModel, setDetailsModel] = useState<APIBaseModelItem | null>(
    null,
  );
  // Model waiting on the Samples-mode warning before it is applied.
  const [pendingModel, setPendingModel] = useState<APIBaseModelItem | null>(
    null,
  );

  // Feature list from API
  const { data: featuresData } = useGetFeaturesToMap();
  const featureList = (featuresData?.results ?? []).filter(
    (f) => f.slug !== "other",
  );
  const [stagedFeature, setStagedFeature] = useState<string | null>(null);

  const effectiveFeatureSlug = stagedFeature ?? feature;
  const isFeatureChanged = effectiveFeatureSlug !== feature;
  const featureLabel =
    featureList.find((item) => item.slug === effectiveFeatureSlug)?.label ??
    effectiveFeatureSlug.replace(/[-_]/g, " ");

  // Drop the staged feature when the committed feature changes externally.
  useEffect(() => {
    setStagedFeature(null);
  }, [feature]);

  // Fetch models for the effective (staged or committed) feature
  const { data: baseModelsData, isLoading: baseLoading } =
    useGetAllAPIBaseModels(effectiveFeatureSlug);
  const { data: localModelsData, isLoading: localLoading } =
    useGetAllAPILocalModels(effectiveFeatureSlug);

  const models = useMemo(() => {
    const raw =
      source === "base"
        ? (baseModelsData?.results ?? [])
        : (localModelsData?.results ?? []);

    if (!search.trim()) return raw;
    const q = search.toLowerCase();
    return raw.filter(
      (m) => m.name.toLowerCase().includes(q) || String(m.id).includes(q),
    );
  }, [source, baseModelsData, localModelsData, search]);

  // Reset page when source or search changes
  const totalPages = Math.max(1, Math.ceil(models.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageModels = models.slice(
    safePage * ITEMS_PER_PAGE,
    (safePage + 1) * ITEMS_PER_PAGE,
  );

  const isLoading = source === "base" ? baseLoading : localLoading;

  const startIdx = models.length > 0 ? safePage * ITEMS_PER_PAGE + 1 : 0;
  const endIdx = Math.min((safePage + 1) * ITEMS_PER_PAGE, models.length);

  // The committed model is highlighted only while browsing its feature; a
  // newly chosen feature starts with no model selected.
  const highlightedModelId =
    pendingModel?.stac_item_id ?? (isFeatureChanged ? null : activeModelId);

  const applyModel = (item: APIBaseModelItem) => {
    setPendingModel(null);
    if (!item.stac) return;
    onSelect(item.stac);
    setSelectedModelId(item.stac_item_id);
    if (isFeatureChanged) onFeatureChange?.(effectiveFeatureSlug);
    onClose?.();
  };

  const handleSelectModel = (item: APIBaseModelItem) => {
    if (item.stac_item_id === activeModelId && !isFeatureChanged) return;
    if (mode === ModelType.DEMO && shouldShowSwitchWarning()) {
      setPendingModel(item);
    } else {
      applyModel(item);
    }
  };

  const handleFeatureSelect = (slug: string) => {
    if (slug === effectiveFeatureSlug) return;
    setStagedFeature(slug === feature ? null : slug);
    setPage(0);
    setSearch("");
  };

  const featureListItems = featureList.map((f) => (
    <FeatureListItem
      key={f.slug}
      feature={f}
      includeUnpinned
      isSelected={effectiveFeatureSlug === f.slug}
      disabled={false}
      onSelect={handleFeatureSelect}
    />
  ));

  return (
    <div className="flex flex-col min-h-[428px]">
      {/* Portalled: on phones the picker sits in a sheet that moves with a
          transform, which would trap and clip this dialog inside it. */}
      {detailsModel &&
        createPortal(
          <ModelDetailsDialog
            model={detailsModel}
            source={source}
            isSelected={
              detailsModel !== null &&
              highlightedModelId === detailsModel.stac_item_id
            }
            onClose={() => setDetailsModel(null)}
            onUseModel={(model) => {
              setDetailsModel(null);
              handleSelectModel(model);
            }}
          />,
          document.body,
        )}
      {pendingModel && (
        <SwitchSampleDialog
          message="Changing the feature or model in Samples mode will switch your imagery and map location to the selected sample’s imagery location and clear your current progress. You can restore saved predictions from History."
          onCancel={() => setPendingModel(null)}
          onConfirm={() => applyModel(pendingModel)}
        />
      )}
      {/* Phones: feature dropdown above a one-column model list. Wider
          screens: feature list beside a model grid. */}
      <div className="flex flex-1 flex-col gap-4 sm:flex-row">
        <div className="flex flex-col overflow-hidden sm:w-[180px] sm:shrink-0">
          <p className="text-xs pb-2">Feature to map</p>
          {isSmallViewport ? (
            <FeatureDropdown
              features={featureList}
              selectedSlug={effectiveFeatureSlug}
              selectedLabel={featureLabel}
              includeUnpinned
              onSelect={handleFeatureSelect}
            />
          ) : (
            <div className="flex flex-col bg-frosted-blue border rounded-lg flex-1 px-1 overflow-y-auto">
              {featureListItems}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <p className="text-xs pb-2">Models</p>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex w-full items-center gap-2 border border-gray-border rounded-lg px-3 py-2 bg-white flex-shrink-0 sm:w-auto">
              <SearchIcon className="size-4 text-grey" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="bg-transparent outline-none text-sm text-dark placeholder:text-grey w-full sm:w-48"
              />
            </div>

            {/* Source toggle dropdown */}
            <DropDown
              ref={dropdownRef}
              placement={DropdownPlacement.BOTTOM_START}
              disableCheveronIcon
              triggerComponent={
                <div className="flex items-center gap-2 cursor-pointer text-sm text-dark">
                  <span>{MODEL_SOURCE_LABELS[source]}</span>
                  <ChevronDownIcon className="size-3 text-dark" />
                </div>
              }
            >
              <div className="bg-white rounded-lg p-1 min-w-[140px]">
                {(
                  Object.entries(MODEL_SOURCE_LABELS) as [ModelSource, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSource(key);
                      setPage(0);
                      onDropdownHide();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-dark rounded-md hover:bg-light-gray transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </DropDown>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Pagination */}
            <div className="flex items-center gap-2 text-sm text-grey shrink-0">
              <span>
                {startIdx}-{endIdx} of {models.length}
              </span>
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1 rounded hover:bg-light-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDownIcon className="size-3 rotate-90" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1 rounded hover:bg-light-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDownIcon className="size-3 -rotate-90" />
              </button>
            </div>
          </div>
          {/* Model cards */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-grey text-sm animate-pulse">Loading models…</p>
            </div>
          ) : models.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-dark font-semibold text-sm mb-1">
                No models found
              </p>
              <p className="text-grey text-xs max-w-xs">
                {search
                  ? "Try a different search term."
                  : `No ${MODEL_SOURCE_LABELS[source].toLowerCase()} available for this feature.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pageModels.map((model) => {
                const isSelected = highlightedModelId === model.stac_item_id;
                return (
                  // "View details" sits over the card's corner as a sibling:
                  // a button can't contain another button.
                  <div key={model.id} className="relative">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectModel(model)}
                      className={`relative w-full text-left p-3 bg-frosted-blue min-h-[98px] rounded-lg border transition-colors ${
                        isSelected ? "border-primary border-2 " : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-dark font-bold text-sm leading-tight truncate">
                            {model.stac.properties.title}
                          </p>
                          <p className="text-grey text-xs mt-0.5">
                            ID: {model.id}
                          </p>
                        </div>
                        <RadioDot selected={isSelected} />
                      </div>
                      <ExperimentalModelBadge
                        category={model.stac.properties["fair:category"]}
                      />
                      {/* Right side left free for "View details". */}
                      <div className="mt-3 flex items-center gap-2 pr-20">
                        <div className="flex items-center gap-1 text-grey text-xs">
                          <StarredIcon />
                          <span>({model.star_count})</span>
                        </div>
                        {model.is_pinned && (
                          <ToolTip
                            content={`This is a recommended model for mapping ${featureLabel.toLowerCase()}.`}
                          >
                            <span className="inline-flex items-center rounded border border-primary bg-secondary px-2 py-0.5 text-[10px] font-semibold leading-tight text-primary">
                              Pinned
                            </span>
                          </ToolTip>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailsModel(model)}
                      aria-label={`View details of ${model.stac.properties.title}`}
                      className="absolute bottom-3 right-3 text-xs font-medium text-dark underline hover:text-primary"
                    >
                      View details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
