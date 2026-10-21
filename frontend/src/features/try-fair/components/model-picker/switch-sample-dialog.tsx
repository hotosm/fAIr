import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { WarningIcon } from "@/components/ui/icons/warning-icon";

const SKIP_SAMPLE_WARNING_KEY = "fair:skip-sample-switch-warning";

export function shouldShowSwitchWarning(): boolean {
  try {
    return localStorage.getItem(SKIP_SAMPLE_WARNING_KEY) !== "true";
  } catch {
    return true;
  }
}

export function SwitchSampleDialog({
  selectionType = "sample",
  message,
  onCancel,
  onConfirm,
}: {
  selectionType?: "sample" | "imagery";
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <Dialog
      label={`Switch ${selectionType}?`}
      noHeader
      noPadding
      borderRadius="rounded"
      className="[&::part(panel)]:w-[341px]"
      isOpened
      closeDialog={onCancel}
    >
      <div className="p-8 flex flex-col items-center gap-6 text-dark text-center">
        <div
          className="size-12 rounded-full bg-[#fffbd9] flex items-center justify-center"
          aria-hidden="true"
        >
          <WarningIcon />
        </div>
        <p className="text-xs">
          {message ??
            `Switching ${selectionType === "sample" ? "samples" : "your custom setup"} will clear your current progress. You can restore it from History.`}
        </p>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
            className="accent-primary"
          />
          Don’t show this again
        </label>
        <div className="flex gap-3 w-full">
          <button
            type="button"
            className="flex-1 rounded-lg bg-grey text-white py-3 text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-primary text-white py-3 text-sm"
            onClick={() => {
              if (dontShowAgain) {
                try {
                  localStorage.setItem(SKIP_SAMPLE_WARNING_KEY, "true");
                } catch {
                  // Switching still works when the preference cannot be saved.
                }
              }
              onConfirm();
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </Dialog>
  );
}
