import { DropDown } from "@/components/ui/dropdown";
import { ChevronDownIcon } from "@/components/ui/icons";
import { FeatureCheckIcon } from "@/components/ui/icons/feature-check-icon";
import { FEATURES_TO_MAP } from "@/features/try-fair/utils/common";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { useState } from "react";

const FeatureToMapDropdown = () => {
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState(FEATURES_TO_MAP[0]);

  const SelectedIcon = selectedFeature.Icon;

  const trigger = (
    <div className="flex bg-[#FAFAFA] border w-full md:w-[280px] p-2 rounded-md border-gray-border justify-between items-center cursor-pointer">
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
          {FEATURES_TO_MAP.map((feature) => {
            const FeatureIcon = feature.Icon;
            return (
              <button
                key={feature.value}
                type="button"
                className="text-dark bg-[#FAFAFA] hover:bg-gray-100 rounded-lg flex justify-between items-center w-full py-3 px-2 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedFeature(feature);
                  onDropdownHide();
                }}
              >
                <div className="flex items-center gap-2">
                  <FeatureIcon className="w-4 h-4 text-dark shrink-0" />
                  <p className="text-xs font-medium">{feature.label}</p>
                </div>
                {selectedFeature.value === feature.value && (
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
