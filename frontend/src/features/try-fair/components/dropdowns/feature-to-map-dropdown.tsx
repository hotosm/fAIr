import { DropDown } from "@/components/ui/dropdown";
import { ChevronDownIcon } from "@/components/ui/icons";
import { BuildingIcon } from "@/components/ui/icons/buildings-icon";
import { FeatureCheckIcon } from "@/components/ui/icons/feature-check-icon";
import { RoadsIcon } from "@/components/ui/icons/roads-icon";
import { SolarPanelIcon } from "@/components/ui/icons/solar-panel-icon";
import { SwimmingPoolIcon } from "@/components/ui/icons/swimming-pool-icon";
import { TreesIcon } from "@/components/ui/icons/trees-icon";
import {
  FeatureToMapItem,
  useGetAPIBaseModels,
  useGetAPILocalModels,
  useGetFeaturesToMap,
} from "@/features/try-fair/api/features-to-map";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { IconProps } from "@/types";
import { cn } from "@/utils";
import { useState } from "react";

type FeatureToMapDropdownProps = {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
};

const FEATURE_ICONS: Record<string, React.FC<IconProps>> = {
  buildings: BuildingIcon,
  "solar-panels": SolarPanelIcon,
  "swimming-pool": SwimmingPoolIcon,
  trees: TreesIcon,
  roads: RoadsIcon
};

const getFeatureIcon = (value: string): React.FC<IconProps> => {
  return FEATURE_ICONS[value] || BuildingIcon;
};

type FeatureOptionProps = {
  disabled: boolean;
  feature: FeatureToMapItem;
  isSelected: boolean;
  onSelect: (value: string) => void;
};

const FeatureOption = ({
  disabled,
  feature,
  isSelected,
  onSelect,
}: FeatureOptionProps) => {
  const { data: baseModels, isPending: isBaseModelsPending } =
    useGetAPIBaseModels(feature.slug);
  const { data: localModels, isPending: isLocalModelsPending } =
    useGetAPILocalModels(feature.slug);
  const hasNoModels =
    baseModels?.results.length === 0 && localModels?.results.length === 0;
  const isDisabled =
    disabled || isBaseModelsPending || isLocalModelsPending || hasNoModels;
  const FeatureIcon = getFeatureIcon(feature.slug);

  return (
    <button
      type="button"
      disabled={isDisabled}
      title={
        hasNoModels ? "No models are available for this feature" : undefined
      }
      className="text-dark bg-[#FAFAFA] hover:bg-gray-100 rounded-lg flex justify-between items-center w-full py-3 px-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#FAFAFA]"
      onClick={() => onSelect(feature.slug)}
    >
      <div className="flex items-center gap-2">
        <FeatureIcon className="w-4 h-4 text-dark shrink-0" />
        <p className="text-xs font-medium">{feature.label}</p>
      </div>
      {isSelected && <FeatureCheckIcon />}
    </button>
  );
};

const FeatureToMapDropdown = ({
  disabled = false,
  value,
  onChange,
}: FeatureToMapDropdownProps) => {
  const { data: features, isLoading } = useGetFeaturesToMap();
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const featureList = (features?.results ?? []).filter(
    (feature) => feature.slug !== "other",
  );

  const selectedFeature = featureList.find(
    (feature) => feature.slug === value,
  ) ??
    featureList[0] ?? { slug: "buildings", label: "Buildings" };

  const SelectedIcon = getFeatureIcon(selectedFeature.slug);

  const trigger = (
    <div
      className={cn(
        "flex bg-[#FAFAFA] border w-full md:w-[280px] p-2 rounded-md border-gray-border justify-between items-center transition-opacity",
        disabled || isLoading
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer",
      )}
    >
      <div className="flex items-center gap-2">
        <SelectedIcon className="w-4 h-4 text-dark shrink-0" />
        <p className="text-xs text-dark">{selectedFeature.label}</p>
      </div>
      <ChevronDownIcon
        className={`w-4 h-4 shrink-0 text-grey transition-transform ${isOpen ? "rotate-180" : ""
          }`}
      />
    </div>
  );

  return (
    <div className="flex flex-col space-y-2 w-full">
      <h4 className="text-xs">Feature to map</h4>
      <DropDown
        sync="width"
        disabled={disabled || isLoading}
        className="rounded-xl w-full md:w-[280px] !disabled:cursor-wait"
        ref={dropdownRef}
        onDropdownShow={() => setIsOpen(true)}
        onDropdownHide={() => {
          setIsOpen(false);
          onDropdownHide();
        }}
        disableCheveronIcon
        triggerComponent={trigger}
      >
        <div className="bg-white rounded-md flex items-start p-2 gap-3 flex-col w-full">
          {featureList.map((feature) => {
            return (
              <FeatureOption
                key={feature.slug}
                disabled={disabled}
                feature={feature}
                isSelected={selectedFeature.slug === feature.slug}
                onSelect={(slug) => {
                  onChange(slug);
                  onDropdownHide();
                }}
              />
            );
          })}
        </div>
      </DropDown>
    </div>
  );
};

export default FeatureToMapDropdown;
