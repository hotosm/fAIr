import { CloudDownloadIcon } from "@/components/ui/icons";
import { PanelIcon } from "@/features/feedback/components/panel-icon";
import { ToolTip } from "@/components/ui/tooltip";
import { FEEDBACK_CONTENT } from "@/features/feedback/constants";
import { cn } from "@/utils";

type ResultRowProps = {
  label: string;
  swatchClassName: string;
  onDownload?: () => void;
  disabled: boolean;
};

const ResultRow = ({
  label,
  swatchClassName,
  onDownload,
  disabled,
}: ResultRowProps) => {
  const isDisabled = disabled || !onDownload;
  const downloadLabel = FEEDBACK_CONTENT.results.downloadLabel(label);

  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden
        className={cn("size-4 shrink-0 rounded-[3px] border", swatchClassName)}
      />
      <p className="flex-1 min-w-0 text-xs text-dark truncate">{label}</p>
      <ToolTip content={downloadLabel}>
        <button
          type="button"
          onClick={onDownload}
          disabled={isDisabled}
          aria-label={downloadLabel}
          className="p-1 rounded-md text-dark hover:bg-black/5 disabled:text-gray-disabled disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <CloudDownloadIcon className="size-4" />
        </button>
      </ToolTip>
    </li>
  );
};

type ResultsSummaryProps = {
  detectedCount: number;
  validCount?: number;
  invalidCount?: number;
  onProvideFeedback: () => void;
  onDownloadDetected?: () => void;
  onDownloadValid?: () => void;
  onDownloadInvalid?: () => void;
  disabled?: boolean;
  className?: string;
  /**
   * Mobile layout: shows a collapse button in the header and moves
   * "Provide Feedback" to the bottom of the card.
   */
  onCollapse?: () => void;
};

/** Summary of a prediction run with per-category downloads and a feedback entry point. */
export const ResultsSummary = ({
  detectedCount,
  validCount = 0,
  invalidCount = 0,
  // onProvideFeedback, — unused while Provide Feedback is commented out.
  onDownloadDetected,
  onDownloadValid,
  onDownloadInvalid,
  disabled = false,
  className,
  onCollapse,
}: ResultsSummaryProps) => {
  const { results } = FEEDBACK_CONTENT;

  // Provide Feedback is commented out for now; restore this and the two
  // places it's rendered below to bring it back.
  // const provideFeedbackLink = (
  //   <button
  //     type="button"
  //     onClick={onProvideFeedback}
  //     disabled={disabled}
  //     className="flex items-center gap-1 self-end text-xs text-dark hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
  //   >
  //     {results.provideFeedback}
  //     <span aria-hidden className="text-base leading-none">
  //       ›
  //     </span>
  //   </button>
  // );

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-dark font-semibold text-sm">{results.title}</h3>
        {/* Mobile card: a collapse button here. (Provide Feedback, here on
            desktop and at the bottom on mobile, is commented out.) */}
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Hide results"
            className="rounded-md p-1 text-dark hover:bg-black/5"
          >
            <PanelIcon className="size-5" />
          </button>
        )}
        {/* {!onCollapse && provideFeedbackLink} */}
      </div>

      <ul className="flex flex-col gap-3 p-3 rounded-lg border border-gray-border bg-gray-white">
        <ResultRow
          label={results.detected(detectedCount)}
          swatchClassName="bg-[#A243DC33] border-[#A243DC]"
          onDownload={onDownloadDetected}
          disabled={disabled || detectedCount === 0}
        />
        <ResultRow
          label={results.valid(validCount)}
          swatchClassName="bg-[#23C16B33] border-[#23C16B]"
          onDownload={onDownloadValid}
          disabled={disabled || validCount === 0}
        />
        <ResultRow
          label={results.invalid(invalidCount)}
          swatchClassName="bg-[#D63F4033] border-[#D63F40]"
          onDownload={onDownloadInvalid}
          disabled={disabled || invalidCount === 0}
        />
      </ul>
      {/* {onCollapse && provideFeedbackLink} */}
    </section>
  );
};
