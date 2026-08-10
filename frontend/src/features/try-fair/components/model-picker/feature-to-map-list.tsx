// ─── Feature list item (Choose your own tab) ─────────────────────────────────

import { FeatureCheckIcon } from "@/components/ui/icons/feature-check-icon";
import { FeatureToMapItem, useGetAPIBaseModels, useGetAPILocalModels } from "@/features/try-fair/api/features-to-map";
import { getFeatureIcon } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { cn } from "@/utils";

type FeatureListItemProps = {
  feature: FeatureToMapItem;
  isSelected: boolean;
  disabled: boolean;
  onSelect: (slug: string) => void;
};

export const FeatureListItem = ({
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
         <FeatureCheckIcon />
      )}
    </button>
  );
};