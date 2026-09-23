import type { InferenceParam } from "@/features/try-fair/api/stac";
import { CloseIcon, InfoIcon, RefreshIcon } from "@/components/ui/icons";
import { RedoIcon, UndoIcon } from "@/components/ui/icons/undo-icon";

type AdvancedSettingsPanelProps = {
  closePanel: () => void;
  inferenceParams: InferenceParam[];
  paramValues: Record<string, number | string | boolean>;
  onParamChange: (key: string, value: number | string | boolean) => void;
  onReset: () => void;
  isPredicting: boolean;
};

export const AdvancedSettingsPanel = ({
  closePanel,
  inferenceParams,
  paramValues,
  onParamChange,
  onReset,
  isPredicting,
}: AdvancedSettingsPanelProps) => {
  // Surface Accuracy (confidence_threshold) here too, first, so it can be set
  // to a precise number — the sidebar only exposes it as a coarse slider.
  const confidenceParam = inferenceParams.find(
    ({ key }) => key === "confidence_threshold",
  );
  const otherParams = inferenceParams.filter(
    ({ key }) => key !== "confidence_threshold",
  );
  const advancedParams = confidenceParam
    ? [confidenceParam, ...otherParams]
    : otherParams;

  return (
    <aside className="max-h-[500px] w-[302px] hide-scrollbar overflow-y-auto rounded-[10px] border border-gray-border bg-white p-4 shadow-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-dark">Advanced Settings</h2>
          <button
            type="button"
            onClick={closePanel}
            className="rounded p-1 text-dark hover:bg-off-white"
            aria-label="Close advanced settings"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {advancedParams.map(({ key, spec }) => {
            const value = paramValues[key] ?? spec.default;
            const isConfidence = key === "confidence_threshold";
            const label = isConfidence
              ? "Accuracy"
              : key
                  .replace(/[_-]/g, " ")
                  .replace(/\b\w/g, (letter) => letter.toUpperCase());

            if (spec.type === "bool") {
              return (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 text-xs text-dark"
                >
                  <span className="flex items-center gap-2">
                    {label}
                    <InfoIcon className="size-3 text-grey" />
                  </span>
                  <span className="relative inline-flex h-4 w-8 items-center">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      disabled={isPredicting}
                      onChange={(event) =>
                        onParamChange(key, event.target.checked)
                      }
                      className="peer sr-only"
                    />
                    <span className="h-4 w-8 rounded-full bg-grey transition-colors peer-checked:bg-[#DF4041] peer-disabled:opacity-50" />
                    <span className="absolute left-0.5 size-3 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                  </span>
                </label>
              );
            }

            if (spec.type === "str") {
              return (
                <label
                  key={key}
                  className="flex flex-col gap-1.5 text-xs text-dark"
                >
                  <span className="flex items-center gap-2">
                    {label}
                    <InfoIcon className="size-3 text-grey" />
                  </span>
                  {spec.values?.length ? (
                    <select
                      value={String(value)}
                      disabled={isPredicting}
                      onChange={(event) =>
                        onParamChange(key, event.target.value)
                      }
                      className="h-6 rounded-md border border-gray-border bg-white px-2 text-xs"
                    >
                      {spec.values.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={String(value)}
                      disabled={isPredicting}
                      onChange={(event) =>
                        onParamChange(key, event.target.value)
                      }
                      className="h-6 rounded-md border border-gray-border px-2 text-xs"
                    />
                  )}
                </label>
              );
            }

            const numericValue = Number(value);
            const min = spec.min ?? 0;
            const max =
              spec.max ?? (isConfidence ? 1 : Math.max(numericValue * 2, 1));
            const step = spec.type === "int" ? 1 : 0.01;
            const progress = ((numericValue - min) / (max - min)) * 100;
            const numericPattern =
              spec.type === "int"
                ? min < 0
                  ? /^-?\d*$/
                  : /^\d*$/
                : min < 0
                  ? /^-?\d*\.?\d*$/
                  : /^\d*\.?\d*$/;

            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3 text-xs text-dark">
                  <span className="flex items-center gap-2">
                    {label}
                    <InfoIcon className="size-3 text-grey" />
                  </span>
                  <input
                    type="text"
                    inputMode={spec.type === "int" ? "numeric" : "decimal"}
                    value={String(numericValue)}
                    disabled={isPredicting}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (!numericPattern.test(nextValue) || nextValue === "")
                        return;

                      const nextNumber = Number(nextValue);
                      if (nextNumber >= min && nextNumber <= max) {
                        onParamChange(key, nextNumber);
                      }
                    }}
                    className="h-6 w-[60px] rounded-md border border-gray-border px-2 text-center text-xs"
                  />
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={numericValue}
                  disabled={isPredicting}
                  onChange={(event) =>
                    onParamChange(key, Number(event.target.value))
                  }
                  className="h-1 w-full cursor-pointer appearance-none rounded-full accent-[#6B7478] disabled:cursor-wait"
                  style={{
                    background: `linear-gradient(to right, #6B7478 0%, #6B7478 ${progress}%, #E5E7E8 ${progress}%, #E5E7E8 100%)`,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="-mx-4 flex items-center justify-between border-t border-gray-border px-4 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="flex  size-8 items-center justify-center rounded bg-off-white text-grey opacity-50"
            >
              <RedoIcon />
            </button>
            <button
              type="button"
              disabled
              className="flex size-8 items-center justify-center rounded bg-off-white text-grey opacity-50"
            >
              <UndoIcon />
            </button>
          </div>
          <button
            type="button"
            onClick={onReset}
            disabled={isPredicting}
            className="flex h-8 items-center gap-1.5 rounded-md bg-off-white px-2.5 text-xs text-dark hover:bg-gray-border disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshIcon />
            Reset
          </button>
        </div>
      </div>
    </aside>
  );
};
