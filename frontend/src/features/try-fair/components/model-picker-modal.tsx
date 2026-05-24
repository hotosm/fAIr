import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, CloseIcon } from "@/components/ui/icons";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";

type ModelPickerProps = {
   selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
   models: BaseModelStacItem[];
  loading?: boolean;

};

// const FeatureBadge = ({ label, type }: { label: string; type: string }) => (
//   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-grey text-white text-xs font-medium">
//     {type === "building" && <BuildingIcon />}
//     {type === "trees" && <TreesIcon />}
//     {type === "solar-panel" && <SolarPanelIcon />}
//     {label}
//   </span>
// );


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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Recompute panel position whenever it opens
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click — but NOT when clicking inside the panel itself
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

const handleSelect = (model: BaseModelStacItem) => {
    onSelect(model);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex  h-[40px] justify-between gap-2 items-center w-full min-w-0"
      >
         <div className="text-left min-w-0">
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
      </button>

      {/* Panel — portaled to body so it escapes all overflow clipping */}
      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className="bg-white rounded-xl shadow-2xl w-[520px] p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-dark text-sm font-semibold">
                What do you want to map
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-grey "
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* 2-column card grid */}
            <div className="grid grid-cols-2 gap-3">
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
                        <FeatureBadge  key={t} label={t} />
                      ))}
                    </div>
                  </button>
                );
              })}
              {/* {models.map((model) => {
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
                        {model.feature} in {model.location}
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
                    <p className="text-grey text-xs mb-0.5">
                      Model: {model.modelName}
                    </p>
                    <p className="text-grey text-xs mb-2">By: {model.author}</p>
                    <FeatureBadge
                      label={model.feature}
                    />
                  </button>
                );
              })} */}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
