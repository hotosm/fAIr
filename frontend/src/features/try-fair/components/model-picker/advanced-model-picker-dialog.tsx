import { useState, useMemo, useEffect, useRef } from "react";
import {
  useGetAPIBaseModels,
  useGetAPILocalModels,
  useGetFeaturesToMap,
} from "@/features/try-fair/api/features-to-map";
import type { APIBaseModelItem } from "@/features/try-fair/api/features-to-map";
import { RadioDot } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { SearchIcon } from "@/components/ui/icons/search-icon";
import { ChevronDownIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownPlacement } from "@/enums";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import type { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { StarredIcon } from "@/components/ui/icons/starred-icon";
import { useTryFairParams } from "@/features/try-fair/hooks/use-try-fair-params";
import { FeatureListItem } from "@/features/try-fair/components/model-picker/feature-to-map-list";

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
        <span className="text-dark text-sm font-medium truncate">
          {loading ? (
            <span className="text-grey text-xs animate-pulse">
              Loading models…
            </span>
          ) : (
            (selectedModel?.properties.title ?? "Select a model")
          )}
        </span>
        <ChevronDownIcon className="size-4 text-grey shrink-0" />
      </button>
    </div>
  );
};

type AdvancedModelPickerContentProps = {
  feature: string;
  selectedModelId: string | null;
  onSelect: (model: BaseModelStacItem) => void;
  onClose?: () => void;
  onFeatureChange?: (slug: string) => void;
};

export const AdvancedModelPickerContent = ({
  feature,
  onSelect,
  onFeatureChange,
}: Omit<AdvancedModelPickerContentProps, "selectedModelId">) => {
  const [source, setSource] = useState<ModelSource>("base");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const { selectedModelId, setSelectedModelId } = useTryFairParams();

  // Feature list from API
  const { data: featuresData } = useGetFeaturesToMap();
  const featureList = (featuresData?.results ?? []).filter(
    (f) => f.slug !== "other",
  );
  const [stagedFeature, setStagedFeature] = useState<string | null>(null);

  const effectiveFeatureSlug = stagedFeature ?? feature;
  

  // Drop staged feature when the committed feature changes externally.
  useEffect(() => {
    setStagedFeature(null);
  }, [feature]);

  // Fetch models for the effective (staged or committed) feature
  const { data: baseModelsData, isLoading: baseLoading } =
    useGetAPIBaseModels(effectiveFeatureSlug);
  const { data: localModelsData, isLoading: localLoading } =
    useGetAPILocalModels(effectiveFeatureSlug);

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

  const applyModel = (item: APIBaseModelItem, featureSlug?: string) => {
    if (!item.stac) return;
    onSelect(item.stac);
    setSelectedModelId(item.stac_item_id);
    if (featureSlug && featureSlug !== feature) {
      onFeatureChange?.(featureSlug);
    }
  };

  const handleSelectModel = (item: APIBaseModelItem) => {
    applyModel(item, stagedFeature ?? undefined);
  };

  const handleFeatureSelect = (slug: string) => {
    setStagedFeature(slug);
    setPage(0);
    setSearch("");
  };

  // Auto-change the model to the selected feature's default, mirroring the
  // basic model picker: picking a feature should switch the model to a
  // compatible one (base first, then local) rather than requiring a separate
  // model click. Runs once per feature, and only when the currently selected
  // model isn't already valid for that feature (so it never overrides a manual
  // pick or the model restored on open).
  const baseModels = baseModelsData?.results ?? [];
  const localModels = localModelsData?.results ?? [];
  const autoSelectedFeatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (baseLoading || localLoading) return;

    const featureModels = [...baseModels, ...localModels];
    if (featureModels.length === 0) return;
    if (autoSelectedFeatureRef.current === effectiveFeatureSlug) return;

    const currentModelIsValid = featureModels.some(
      (model) => model.stac_item_id === selectedModelId,
    );
    if (!currentModelIsValid) {
      const defaultModel = baseModels[0] ?? localModels[0];
      if (defaultModel) {
        applyModel(defaultModel, stagedFeature ?? undefined);
      }
    }

    autoSelectedFeatureRef.current = effectiveFeatureSlug;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    effectiveFeatureSlug,
    baseLoading,
    localLoading,
    baseModelsData,
    localModelsData,
    selectedModelId,
  ]);
  return (
    <div className="flex flex-col min-h-[428px]">
      <div className="flex gap-4 flex-1">
        <div className="w-[180px] shrink-0 overflow-hidden flex flex-col">
          <p className="text-xs pb-2">Feature to map</p>
          <div className="flex flex-col bg-frosted-blue border rounded-lg flex-1 px-1 overflow-y-auto">
            {featureList.map((f) => (
              <FeatureListItem
                key={f.slug}
                feature={f}
                isSelected={effectiveFeatureSlug === f.slug}
                disabled={false}
                onSelect={handleFeatureSelect}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-4">
        {/* Toolbar */}
      <div className="flex items-center  gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 border border-gray-border rounded-lg px-3 py-2 bg-white flex-shrink-0">
          <SearchIcon className="size-4 text-grey" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="bg-transparent outline-none text-sm text-dark placeholder:text-grey w-48"
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
            const isSelected = selectedModelId === model.stac_item_id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => handleSelectModel(model)}
                className={`text-left p-3 bg-frosted-blue min-h-[98px] rounded-lg border transition-colors ${
                  isSelected ? "border-primary border-2 " : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-dark font-bold text-sm leading-tight truncate">
                      {model.stac.properties.title}
                    </p>
                    <p className="text-grey text-xs mt-0.5">ID: {model.id}</p>
                  </div>
                  <RadioDot selected={isSelected} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-grey text-xs">
                    <StarredIcon />
                    <span>({model.star_count})</span>
                  </div>
                  {/* <span className="text-dark underline text-xs font-medium">
                    View details
                  </span> */}
                </div>
              </button>
            );
          })}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
