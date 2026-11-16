import { useCallback, useState } from "react";
import type { FeedbackFormValues } from "@/features/feedback/types";

type FeedbackStep = "closed" | "form" | "sent";

type UseFeedbackFlowOptions = {
  /**
   * Persists the feedback. Resolve to show the success modal; reject to keep
   * the form open. When omitted the flow moves straight to the success step.
   */
  submitFeedback?: (values: FeedbackFormValues) => Promise<unknown> | void;
};

/** Drives the Provide Feedback → Feedback Sent modal sequence. */
export const useFeedbackFlow = ({
  submitFeedback,
}: UseFeedbackFlowOptions = {}) => {
  const [step, setStep] = useState<FeedbackStep>("closed");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openFeedback = useCallback(() => setStep("form"), []);
  // The shared Dialog calls its close handler after *any* hide animation,
  // including the form hiding because we moved to the "sent" step. Scope each
  // close to its own step so that callback can't dismiss the success modal.
  const closeForm = useCallback(
    () => setStep((current) => (current === "form" ? "closed" : current)),
    [],
  );
  const closeSent = useCallback(
    () => setStep((current) => (current === "sent" ? "closed" : current)),
    [],
  );

  const handleSubmit = useCallback(
    async (values: FeedbackFormValues) => {
      setIsSubmitting(true);
      try {
        await submitFeedback?.(values);
        setStep("sent");
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitFeedback],
  );

  return {
    isFormOpen: step === "form",
    isSentOpen: step === "sent",
    isSubmitting,
    openFeedback,
    closeForm,
    closeSent,
    handleSubmit,
  };
};
