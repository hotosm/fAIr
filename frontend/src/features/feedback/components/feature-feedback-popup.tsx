import {
  ThumbDownIcon,
  ThumbUpIcon,
} from "@/features/feedback/components/thumb-icons";
import { FeatureVerdict } from "@/features/feedback/types";
import { cn } from "@/utils";

type FeatureFeedbackPopupProps = {
  /** Screen position (px, relative to the map container) the popup hangs from. */
  x: number;
  y: number;
  verdict: FeatureVerdict | undefined;
  onVerdict: (verdict: FeatureVerdict) => void;
  /** True while the mark is being saved; the buttons are locked until done. */
  isPending?: boolean;
};

const buttonClassName =
  "flex size-8 items-center justify-center rounded-[55px] bg-[#F0EFEF] transition-colors";

/** Thumbs up / down card anchored under a selected prediction. */
export const FeatureFeedbackPopup = ({
  x,
  y,
  verdict,
  onVerdict,
  isPending = false,
}: FeatureFeedbackPopupProps) => {
  const isValid = verdict === FeatureVerdict.VALID;
  const isInvalid = verdict === FeatureVerdict.INVALID;

  return (
    <div
      data-feature-feedback-popup
      className="absolute z-10 -translate-x-1/2 pt-2"
      style={{ left: x, top: y }}
      // Keep clicks on the card from reaching the map underneath.
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-0.5 size-3 -translate-x-1/2 rotate-45 bg-white"
      />
      <div
        role="group"
        aria-label="Is this feature correct?"
        aria-busy={isPending}
        className="relative flex items-center gap-1.5 rounded-lg bg-white p-1.5 shadow-lg"
      >
        <button
          type="button"
          aria-label="Mark as valid"
          aria-pressed={isValid}
          disabled={isPending}
          onClick={() => onVerdict(FeatureVerdict.VALID)}
          className={cn(
            buttonClassName,
            isValid ? "bg-[#23C16B] text-white " : "bg-off-white text-dark ",
          )}
        >
          <ThumbUpIcon
            className={`size-4 ${isValid ? "text-white" : "text-dark"}`}
          />
        </button>
        <button
          type="button"
          aria-label="Mark as invalid"
          aria-pressed={isInvalid}
          disabled={isPending}
          onClick={() => onVerdict(FeatureVerdict.INVALID)}
          className={cn(
            buttonClassName,
            isInvalid ? "bg-primary text-white " : "bg-off-white text-dark ",
          )}
        >
          <ThumbDownIcon
            className={`size-4 ${isInvalid ? "text-white" : "text-dark"}`}
          />
        </button>
      </div>
    </div>
  );
};
