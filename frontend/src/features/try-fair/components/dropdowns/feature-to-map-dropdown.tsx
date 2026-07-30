import { DropDown } from "@/components/ui/dropdown";
import { ChevronDownIcon } from "@/components/ui/icons";
import { BuildingIcon } from "@/components/ui/icons/buildings-icon";
import { FeatureCheckIcon } from "@/components/ui/icons/feature-check-icon";
import { SolarPanelIcon } from "@/components/ui/icons/solar-panel-icon";
import { TreesIcon } from "@/components/ui/icons/trees-icon";
import {  useGetFeaturesToMap } from "@/features/try-fair/api/features-to-map";
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
  "solar-panel": SolarPanelIcon,
  trees: TreesIcon,
};

const getFeatureIcon = (value: string): React.FC<IconProps> => {
  return FEATURE_ICONS[value] || BuildingIcon;
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


  const selectedFeature =
    featureList.find((feature) => feature.slug === value) ??
    featureList[0] ??
    { slug: "buildings", label: "Buildings" };

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
        className={`w-4 h-4 shrink-0 text-grey transition-transform ${
          isOpen ? "rotate-180" : ""
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
            const FeatureIcon = getFeatureIcon(feature.slug);
            return (
              <button
                key={feature.slug}
                type="button"
                className="text-dark bg-[#FAFAFA] hover:bg-gray-100 rounded-lg flex justify-between items-center w-full py-3 px-2 transition-colors cursor-pointer"
                onClick={() => {
                  onChange(feature.slug);
                  onDropdownHide();
                }}
              >
                <div className="flex items-center gap-2">
                  <FeatureIcon className="w-4 h-4 text-dark shrink-0" />
                  <p className="text-xs font-medium">{feature.label}</p>
                </div>
                {selectedFeature.slug === feature.slug && (
                  <FeatureCheckIcon />
                )}
              </button>
            );
          })}
        </div>
      </DropDown>
    </div>
  );
};

export default FeatureToMapDropdown;
