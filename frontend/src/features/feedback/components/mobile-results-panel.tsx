import { type ComponentProps, useEffect, useState } from "react";
import { PanelIcon } from "@/features/feedback/components/panel-icon";
import { ResultsSummary } from "@/features/feedback/components/results-summary";
import { FEEDBACK_CONTENT } from "@/features/feedback/constants";
import { cn } from "@/utils";

type MobileResultsPanelProps = Omit<
  ComponentProps<typeof ResultsSummary>,
  "onCollapse" | "className"
> & {
  className?: string;
  /**
   * Collapse into the Results button when this turns true, e.g. while a
   * feature is selected on the map so its 👍/👎 popup isn't covered.
   */
  forceCollapsed?: boolean;
};

/**
 * Results on phones: a small "Results" button floating over the map that
 * opens the full Results card, which can be collapsed back into the button
 * so it doesn't cover the predictions.
 */
export const MobileResultsPanel = ({
  className,
  forceCollapsed = false,
  ...summaryProps
}: MobileResultsPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (forceCollapsed) setIsOpen(false);
  }, [forceCollapsed]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "ml-auto flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-dark shadow-md",
          className,
        )}
      >
        {FEEDBACK_CONTENT.results.title}
        <PanelIcon className="size-5" />
      </button>
    );
  }

  return (
    <ResultsSummary
      {...summaryProps}
      onCollapse={() => setIsOpen(false)}
      className={cn("rounded-lg bg-white p-3 shadow-md", className)}
    />
  );
};
