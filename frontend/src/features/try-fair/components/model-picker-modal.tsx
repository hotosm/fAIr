import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import DropDown from "@/components/ui/dropdown/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { ChevronDownIcon } from "@/components/ui/icons";
import { useState } from "react";

type ModelPickerProps = {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
  loading?: boolean;
  disabled?: boolean;
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
}) => {
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSelect = (model: BaseModelStacItem) => {
    onSelect(model);
    setTimeout(() => {
      onDropdownHide();
    }, 200);
  };

  return (
    <DropDown
      className={`rounded-xl w-full md:w-32 !disabled:cursor-wait`}
      disabled={disabled}
      ref={dropdownRef}
      onDropdownShow={() => setIsOpen(true)}
      onDropdownHide={() => setIsOpen(false)}
      disableCheveronIcon
      triggerComponent={
        <div className="flex justify-between items-center">
          <div className="w-full md:w-28 text-left flex-1 min-w-0 ">
            {loading ? (
              <p className="text-grey text-xs animate-pulse">Loading models…</p>
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
              <p className="text-grey text-xs">Select a model</p>
            )}
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 shrink-0 text-grey transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      }
    >
      <div className="bg-white rounded-xl shadow-2xl w-fit sm:w-[520px] p-4 space-y-4">
        <small className="text-sm font-semibold">
          What do you want to map ?
        </small>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ">
          {models.map((model) => {
            const isSelected = selectedModel?.id === model.id;
            const tasks = model.properties["mlm:tasks"] ?? [];

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => handleSelect(model)}
                className={`text-left p-3 bg-frosted-blue rounded-lg border-2  ${
                  isSelected ? "border-primary" : "border-gray-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-dark text-sm font-bold leading-tight">
                    {model.properties["mlm:architecture"]}
                  </p>
                  <span
                    className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-primary" : "border-gray-border"
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
                  {tasks.map((t) => (
                    <FeatureBadge key={t} label={t} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </DropDown>
  );
};
