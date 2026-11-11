import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileResultsPanel } from "@/features/feedback/components/mobile-results-panel";
import { ResultsSummary } from "@/features/feedback/components/results-summary";

const renderPanel = () => {
  const onProvideFeedback = vi.fn();
  render(
    <MobileResultsPanel
      detectedCount={352}
      validCount={1}
      invalidCount={0}
      onProvideFeedback={onProvideFeedback}
    />,
  );
  return { onProvideFeedback };
};

afterEach(cleanup);

describe("MobileResultsPanel", () => {
  // Provide Feedback is commented out in ResultsSummary for now; when it's
  // restored, these tests should click it again.
  it("opens as the full card, without Provide Feedback for now", () => {
    renderPanel();
    expect(screen.getByText("352 features detected")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Provide Feedback/ }),
    ).not.toBeInTheDocument();
  });

  it("collapses into a Results button and opens again", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Hide results" }));
    expect(screen.queryByText("352 features detected")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Results/ }));
    expect(screen.getByText("352 features detected")).toBeInTheDocument();
  });

  it("collapses when a feature gets selected, and can be reopened", () => {
    const props = {
      detectedCount: 352,
      onProvideFeedback: vi.fn(),
    };
    const { rerender } = render(
      <MobileResultsPanel {...props} forceCollapsed={false} />,
    );
    expect(screen.getByText("352 features detected")).toBeInTheDocument();

    rerender(<MobileResultsPanel {...props} forceCollapsed />);
    expect(screen.queryByText("352 features detected")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Results/ }));
    expect(screen.getByText("352 features detected")).toBeInTheDocument();
  });

  it("on desktop has no collapse button, and no Provide Feedback for now", () => {
    render(<ResultsSummary detectedCount={3} onProvideFeedback={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: "Hide results" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Provide Feedback/ }),
    ).not.toBeInTheDocument();
  });
});
