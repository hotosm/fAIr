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
