import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PredictionStatus } from "@/features/try-fair/components/prediction-status";

describe("PredictionStatus", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("says the model is waking up and counts the seconds", () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    render(<PredictionStatus stage={{ name: "waking", startedAt }} />);

    act(() => vi.advanceTimersByTime(12_000));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Waking up the model (12 s)",
    );
  });

  it("says the prediction is running once the model is awake", () => {
    vi.useFakeTimers();
    render(
      <PredictionStatus
        stage={{ name: "predicting", startedAt: Date.now() }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Running the prediction (0 s)",
    );
  });

  it("shows nothing when no prediction is running", () => {
    render(<PredictionStatus stage={null} />);

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("announces only the stage, not every passing second", () => {
    render(
      <PredictionStatus stage={{ name: "waking", startedAt: Date.now() }} />,
    );

    const seconds = screen.getByText("(0 s)");
    expect(seconds).toHaveAttribute("aria-hidden", "true");
  });
});
