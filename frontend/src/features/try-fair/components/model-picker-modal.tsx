import { useState } from "react";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import DropDown from "@/components/ui/dropdown/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { ChevronDownIcon } from "@/components/ui/icons";
import { BuildingIcon } from "@/components/ui/icons/buildings-icon";
import { Button } from "@/components/ui/button";
import { GlobeSearchIcon } from "@/components/ui/icons/globe-search-icon";

type ModelPickerProps = {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
  loading?: boolean;
  disabled?: boolean;
  isSmallViewport: boolean;
  openMobileDialog?: () => void;
};

const FeatureBadge = ({ label }: { label: string | undefined }) => {
  const featureLabel =
    label ?? "".replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className="inline-flex gap-2 items-center px-2 py-0.5 capitalize rounded bg-grey text-white text-xs font-medium">
      <BuildingIcon />
      {featureLabel}
    </span>
  );
};

export const ModelPicker: React.FC<ModelPickerProps> = ({
  selectedModel,
  onSelect,
  models,
  loading = false,
  disabled = false,
  isSmallViewport,
  openMobileDialog,
}) => {
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (model: BaseModelStacItem) => {
    onSelect(model);

    if (isSmallViewport) {
      setIsOpen(false);
      return;
    }

    setTimeout(() => {
      onDropdownHide();
    }, 200);
  };

  const trigger = (
    <div className="flex justify-between items-center">
      <div className="w-full md:w-28 text-left flex-1 min-w-0">
        {loading ? (
          <p className="text-grey text-xs animate-pulse">Loading models…</p>
        ) : models.length === 0 ? (
          <p className="text-grey text-xs">No models available</p>
        ) : selectedModel ? (
          <>
            <p className="font-medium text-dark text-xs leading-tight">
              {selectedModel.properties.title}
            </p>
          </>
        ) : (
          <p className="text-grey text-xs">Select a model</p>
        )}
      </div>

      <ChevronDownIcon
        className={`w-4 h-4 shrink-0 text-grey transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </div>
  );

  if (isSmallViewport) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={openMobileDialog}
        className="w-full rounded-xl border px-3 py-2 bg-white"
      >
        {trigger}
      </button>
    );
  }

  return (
    <DropDown
      className="rounded-xl w-full md:w-32 !disabled:cursor-wait"
      disabled={disabled}
      ref={dropdownRef}
      onDropdownShow={() => setIsOpen(true)}
      onDropdownHide={() => setIsOpen(false)}
      disableCheveronIcon
      triggerComponent={trigger}
    >
      <div className="w-[520px] shadow-2xl">
        {
          <ModelPickerContent
            models={models}
            selectedModel={selectedModel}
            onSelect={handleSelect}
          />
        }
      </div>
    </DropDown>
  );
};

/**
 * Standalone content for the model picker, exported so it can be rendered
 * inside a page-level Dialog (outside the MobileDrawer).
 */
export const ModelPickerContent = ({
  selectedModel,
  onSelect,
  models,
}: {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
}) => (
  <div className="bg-white rounded-xl p-4 space-y-4 max-h-[70vh] overflow-y-auto">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {models.length > 0 ? (
        models.map((model) => {
          const isSelected = selectedModel?.id === model.id;
          // const tasks = model.properties["mlm:tasks"] ?? [];
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onSelect(model)}
              className={`text-left p-3 bg-frosted-blue rounded-lg  transition-colors ${
                isSelected ? "border-primary border-2" : ""
              }`}
            >
              <div className="flex space-y-2 items-start justify-between gap-2 mb-1">
                <p className="text-dark capitalize text-sm font-bold leading-tight">
                  {model?.properties?.title ?? ""}
                </p>

                <span
                  className={`mt-0.5 shrink-0 w-4 h-4 rounded-full  flex items-center justify-center ${
                    isSelected ? "border-primary border-2" : ""
                  }`}
                >
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </span>
              </div>
              <p className="text-grey text-xs mb-0.5">
                Model: {model?.properties?.["mlm:name"] ?? ""}
              </p>
              <p className="text-grey text-xs mb-2">
                By: {model?.properties?.providers[0]?.name ?? ""}
              </p>
              <FeatureBadge label={model?.properties?.keywords[0] ?? ""} />
            </button>
          );
        })
      ) : (
        <div className="col-span-2 flex flex-col items-center justify-center py-10 px-4 text-center">
          <p className="text-dark font-semibold text-sm mb-1">
            No models available
          </p>
          <p className="text-grey text-xs max-w-xs">
            There are currently no models available for use.{" "}
          </p>
        </div>
      )}
    </div>
    <div className="flex w-full text-sm justify-between items-center ">
      <Button rounded disabled className="!w-fit ">
        Apply
      </Button>

     <button className="flex gap-2  items-center">
      <GlobeSearchIcon />
      <span>Choose a different location</span>
<ChevronDownIcon className="size-4 -rotate-90" />
     </button>
    </div>
  </div>
);
