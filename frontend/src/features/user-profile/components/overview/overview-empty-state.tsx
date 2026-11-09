import { EmptyGridIcon } from "@/components/ui/icons/empty-grid-icon";
import { cn } from "@/utils";

/**
 * Neutral empty-state placeholder used across the Overview page (e.g. no
 * activities yet, no map requests yet).
 */
export const OverviewEmptyState = ({
  message,
  className,
}: {
  message: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-y-3 py-14 text-center",
        className,
      )}
    >
      <div className="p-0.5 rounded-md bg-white border-gray-border border">
        <EmptyGridIcon />
      </div>
      <p className="text-[#687075] text-sm">{message}</p>
    </div>
  );
};
