import { ResultsSummary } from "@/features/feedback/components/results-summary";
import { useFeedbackFlow } from "@/features/feedback/hooks/use-feedback-flow";
import { FeedbackSentModal } from "@/features/feedback/modals/feedback-sent-modal";
import { ProvideFeedbackModal } from "@/features/feedback/modals/provide-feedback-modal";
import type { FeedbackFormValues } from "@/features/feedback/types";

type PredictionResultsFeedbackProps = {
  detectedCount: number;
  validCount?: number;
  invalidCount?: number;
  onDownloadDetected?: () => void;
  onDownloadValid?: () => void;
  onDownloadInvalid?: () => void;
  submitFeedback?: (values: FeedbackFormValues) => Promise<unknown> | void;
  disabled?: boolean;
  className?: string;
};

/** Results card plus the feedback modals it opens. */
export const PredictionResultsFeedback = ({
  submitFeedback,
  ...summaryProps
}: PredictionResultsFeedbackProps) => {
  const {
    isFormOpen,
    isSentOpen,
    isSubmitting,
    openFeedback,
    closeForm,
    closeSent,
    handleSubmit,
  } = useFeedbackFlow({ submitFeedback });

  return (
    <>
      <ResultsSummary {...summaryProps} onProvideFeedback={openFeedback} />
      <ProvideFeedbackModal
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
      <FeedbackSentModal isOpen={isSentOpen} onClose={closeSent} />
    </>
  );
};
