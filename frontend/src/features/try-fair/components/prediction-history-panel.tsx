import { useEffect, useState } from "react";
import type { PredictionHistoryEntry } from "@/features/try-fair/api/user-state";
import { FeatureBadge } from "@/features/try-fair/components/model-picker/model-picker-badges";
import { Drawer } from "@/components/ui/drawer";
import { DrawerPlacements } from "@/enums";
import { cn } from "@/utils";
import { elapsedTime } from "@/features/try-fair/utils/common";

export function PredictionHistoryPanel({
  open,
  entries,
  activeId,
  disabled,
  onSelect,
  onClose,
}: {
  open: boolean;
  entries: PredictionHistoryEntry[];
  activeId: string | null;
  disabled: boolean;
  onSelect: (entry: PredictionHistoryEntry) => void;
  onClose: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [open]);

  return (
    <Drawer
      id="prediction-history"
      contained
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose();
      }}
      placement={DrawerPlacements.END}
      label="Prediction History"
      noHeader={false}
      className="[&::part(base)]:z-20 [&::part(panel)]:h-full [&::part(panel)]:w-[322px] [&::part(panel)]:max-w-full [&::part(body)]:p-3 [&::part(title)]:text-sm"
    >
      {entries.length === 0 ? (
        <p className="text-sm text-grey">
          Run a prediction to start your history.
        </p>
      ) : (
        <ul className="space-y-3">
          {[...entries].reverse().map((entry) => {
            const current = entry.id === activeId;
            const featureCount =
              entry.snapshot.prediction_result.predictions.features.length;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-current={current ? "true" : undefined}
                  onClick={() => onSelect(entry)}
                  className={cn(
                    "w-full text-left rounded-lg border-2 p-3 space-y-1 disabled:opacity-60",
                    current
                      ? "border-primary bg-frosted-blue"
                      : "border-transparent hover:bg-frosted-blue",
                  )}
                >
                  <p className="text-sm font-semibold text-dark">
                    {entry.snapshot.name}
                  </p>
                  <p
                    className="text-xs text-grey truncate"
                    title={entry.snapshot.model.title}
                  >
                    Model: {entry.snapshot.model.title}
                  </p>
                  <FeatureBadge label={entry.snapshot.category} />
                  <p className="text-xs text-grey">
                    {featureCount.toLocaleString()} feature
                    {featureCount === 1 ? "" : "s"} detected
                  </p>
                  <p className="text-xs text-grey pt-1">
                    {current ? "Current" : elapsedTime(entry.created_at, now)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}
