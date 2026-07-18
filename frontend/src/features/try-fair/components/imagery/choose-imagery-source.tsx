import { ImagerySource } from "@/enums";
import { cn } from "@/utils";
import { IMAGERY_SOURCES } from "@/features/try-fair/utils/common";

/**
 * The OpenAerialMap / Custom Imagery pill radio toggle at the top of the
 * imagery/location dialog.
 */
export const ImagerySourceToggle = ({
  value,
  onChange,
}: {
  value: ImagerySource;
  onChange: (source: ImagerySource) => void;
}) => (
  <div
    role="radiogroup"
    aria-label="Imagery source"
    className="flex items-center justify-center gap-3"
  >
    {IMAGERY_SOURCES.map((source) => {
      const isSelected = value === source.value;
      return (
        <button
          key={source.value}
          type="button"
          role="radio"
          aria-checked={isSelected}
          onClick={() => onChange(source.value)}
          className={cn(
            "flex items-center bg-frosted-blue justify-between gap-6 min-w-[200px] px-4 py-2.5 rounded-lg transition-colors",
            isSelected ? "border-primary border " : "  ",
          )}
        >
          <span className="text-sm text-dark">{source.label}</span>
          <span
            className={cn(
              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
              isSelected ? "border-primary" : "border-gray-border",
            )}
          >
            {isSelected && (
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </span>
        </button>
      );
    })}
  </div>
);
