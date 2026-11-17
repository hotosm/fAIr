import { FEEDBACK_RATING_OPTIONS } from "@/features/feedback/constants";
import { FeedbackRating } from "@/features/feedback/types";
import { cn } from "@/utils";

type FeedbackRatingOptionsProps = {
  name: string;
  value: FeedbackRating | null;
  onChange: (value: FeedbackRating) => void;
  disabled?: boolean;
};

export const FeedbackRatingOptions = ({
  name,
  value,
  onChange,
  disabled = false,
}: FeedbackRatingOptionsProps) => (
  <div className="flex flex-col gap-3">
    {FEEDBACK_RATING_OPTIONS.map((option) => {
      const checked = value === option.value;
      return (
        <label
          key={option.value}
          className={cn(
            "flex items-center gap-3 text-sm text-dark",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={checked}
            disabled={disabled}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={cn(
              "flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
              checked ? "border-primary" : "border-dark",
            )}
          >
            {checked && <span className="size-2.5 rounded-full bg-primary" />}
          </span>
          {option.label}
        </label>
      );
    })}
  </div>
);
