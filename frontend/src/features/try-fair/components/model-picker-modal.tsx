import { useState } from "react";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import DropDown from "@/components/ui/dropdown/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/dialog";

type ModelPickerProps = {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
  loading?: boolean;
  disabled?: boolean;
  isSmallViewport: boolean;
};

const FeatureBadge = ({ label }: { label: string }) => {
  const featureLabel = label
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-grey text-white text-xs font-medium">
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

  const content = (
    <div className="bg-white rounded-xl p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      {!isSmallViewport && <small className="text-sm font-semibold">
        What do you want to map?
      </small>
}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {models.map((model) => {
          const isSelected = selectedModel?.id === model.id;
          const tasks = model.properties["mlm:tasks"] ?? [];

          return (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelect(model)}
              className={`text-left p-3 bg-frosted-blue rounded-lg border-2 transition-colors ${
                isSelected
                  ? "border-primary"
                  : "border-gray-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-dark text-sm font-bold leading-tight">
                  {model.properties["mlm:architecture"]}
                </p>

                <span
                  className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-primary"
                      : "border-gray-border"
                  }`}
                >
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </span>
              </div>

              <p className="text-gray-500 text-xs mb-2 line-clamp-2 leading-relaxed">
                {model.properties.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {tasks.map((task) => (
                  <FeatureBadge
                    key={task}
                    label={task}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const trigger = (
    <div className="flex justify-between items-center">
      <div className="w-full md:w-28 text-left flex-1 min-w-0">
        {loading ? (
          <p className="text-grey text-xs animate-pulse">
            Loading models…
          </p>
        ) : selectedModel ? (
          <>
            <p className="font-medium text-dark text-xs leading-tight truncate">
              {selectedModel.properties["mlm:architecture"]}
            </p>

            <p className="text-grey text-xs leading-tight truncate">
              {selectedModel.properties.title}
            </p>
          </>
        ) : (
          <p className="text-grey text-xs">
            Select a model
          </p>
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
      <>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className="w-full rounded-xl border px-3 py-2 bg-white"
        >
          {trigger}
        </button>

        <Dialog
          label="Choose a Model"
          isOpened={isOpen}
          closeDialog={() => setIsOpen(false)}
        >
          {content}
        </Dialog>
      </>
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
        {content}
      </div>
    </DropDown>
  );
};