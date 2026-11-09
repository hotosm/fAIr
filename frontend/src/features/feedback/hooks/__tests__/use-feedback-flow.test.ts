import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFeedbackFlow } from "@/features/feedback/hooks/use-feedback-flow";
import { FeedbackRating } from "@/features/feedback/types";

describe("useFeedbackFlow", () => {
  it("keeps the success modal open when the form's after-hide close fires", async () => {
    const { result } = renderHook(() => useFeedbackFlow());

    act(() => result.current.openFeedback());
    await act(() =>
      result.current.handleSubmit({
        rating: FeedbackRating.GOOD,
        comment: "",
      }),
    );
    expect(result.current.isSentOpen).toBe(true);

    // The form Dialog reports its hide animation finishing.
    act(() => result.current.closeForm());
    expect(result.current.isSentOpen).toBe(true);

    act(() => result.current.closeSent());
    expect(result.current.isSentOpen).toBe(false);
    expect(result.current.isFormOpen).toBe(false);
  });

  it("stays on the form when submitting fails", async () => {
    const { result } = renderHook(() =>
      useFeedbackFlow({
        submitFeedback: () => Promise.reject(new Error("network")),
      }),
    );

    act(() => result.current.openFeedback());
    await act(async () => {
      await expect(
        result.current.handleSubmit({
          rating: FeedbackRating.BAD,
          comment: "",
        }),
      ).rejects.toThrow("network");
    });

    expect(result.current.isFormOpen).toBe(true);
    expect(result.current.isSentOpen).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });
});
