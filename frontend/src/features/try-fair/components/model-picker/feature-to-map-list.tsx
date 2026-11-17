// ─── Feature list item (Choose your own tab) ─────────────────────────────────

import { FeatureCheckIcon } from "@/components/ui/icons/feature-check-icon";
import {
  useGetAllAPIBaseModels,
  useGetAllAPILocalModels,
  useGetAPIBaseModels,
  useGetAPILocalModels,
} from "@/features/try-fair/api/features-to-map";
import { getFeatureIcon } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { FeatureToMapItem } from "@/features/try-fair/types/data-types";
import { cn } from "@/utils";
import { DropDown } from "@/components/ui/dropdown";
import { ChevronDownIcon } from "@/components/ui/icons";
import { DropdownPlacement } from "@/enums";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";

type FeatureListItemProps = {
  feature: FeatureToMapItem;
  includeUnpinned?: boolean;
  isSelected: boolean;
  disabled: boolean;
  onSelect: (slug: string) => void;
};

export const FeatureListItem = ({
  feature,
  includeUnpinned = false,
  isSelected,
  disabled,
  onSelect,
}: FeatureListItemProps) => {
  const pinnedBase = useGetAPIBaseModels(feature.slug, !includeUnpinned);
  const pinnedLocal = useGetAPILocalModels(feature.slug, !includeUnpinned);
  const allBase = useGetAllAPIBaseModels(feature.slug, includeUnpinned);
  const allLocal = useGetAllAPILocalModels(feature.slug, includeUnpinned);
  const { data: baseModels, isPending: isBaseModelsPending } = includeUnpinned
    ? allBase
    : pinnedBase;
  const { data: localModels, isPending: isLocalModelsPending } = includeUnpinned
    ? allLocal
    : pinnedLocal;
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
      {isSelected && <FeatureCheckIcon />}
    </button>
  );
};

/**
 * "Feature to map" as a dropdown, for phones where the full feature list
 * doesn't fit beside the rest of the picker.
 */
export const FeatureDropdown = ({
  features,
  selectedSlug,
  selectedLabel,
  includeUnpinned = false,
  onSelect,
}: {
  features: FeatureToMapItem[];
  selectedSlug: string;
  selectedLabel: string;
  includeUnpinned?: boolean;
  onSelect: (slug: string) => void;
}) => {
  const { dropdownRef, onDropdownHide } = useDropdownMenu();
  const SelectedIcon = getFeatureIcon(selectedSlug);

  return (
    <DropDown
      ref={dropdownRef}
      placement={DropdownPlacement.BOTTOM_START}
      disableCheveronIcon
      sync="width"
      className="w-full"
      triggerComponent={
        <span className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-border bg-gray-white px-3 py-2.5">
          <span className="flex items-center gap-2">
            <SelectedIcon className="size-4 shrink-0 text-dark" />
            <span className="text-sm text-dark">{selectedLabel}</span>
          </span>
          <ChevronDownIcon className="size-3 text-dark" />
        </span>
      }
    >
      <div className="max-h-72 overflow-y-auto rounded-lg bg-white p-1">
        {features.map((feature) => (
          <FeatureListItem
            key={feature.slug}
            feature={feature}
            includeUnpinned={includeUnpinned}
            isSelected={selectedSlug === feature.slug}
            disabled={false}
            onSelect={(slug) => {
              onDropdownHide();
              onSelect(slug);
            }}
          />
        ))}
      </div>
    </DropDown>
  );
};
