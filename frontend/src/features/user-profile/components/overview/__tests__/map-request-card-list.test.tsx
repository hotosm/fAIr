import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PredictionRequestStatus } from "@/enums";
import type { TOfflinePrediction } from "@/types";
import { MapRequestCardList } from "../map-request-card-list";

vi.mock("@shoelace-style/shoelace/dist/react/tooltip/index.js", () => ({
  default: ({ open, children }: { open?: boolean; children?: ReactNode }) => (
    <div data-testid="tooltip" data-open={String(open)}>
      {children}
    </div>
  ),
}));

const mode = vi.hoisted(() => ({ mappingMode: "advanced" }));
vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => ({ mappingMode: mode.mappingMode }),
}));

afterEach(cleanup);

const request = (
  id: number,
  overrides: Partial<TOfflinePrediction> = {},
): TOfflinePrediction =>
  ({
    id,
    description: `Request ${id}`,
    category: "buildings",
    model_name: "YOLO_V8_V2",
    status: PredictionRequestStatus.COMPLETED,
    results_ready: true,
    submitted_at: "2024-12-25T10:00:00Z",
    ...overrides,
  }) as TOfflinePrediction;

describe("MapRequestCardList", () => {
  it("shows each request's name, feature, model and result button", () => {
    const onViewResult = vi.fn();
    const ready = request(1);
    render(
      <MapRequestCardList requests={[ready]} onViewResult={onViewResult} />,
    );
    expect(screen.getByText("Request 1")).toBeInTheDocument();
    expect(screen.getByText("Buildings")).toBeInTheDocument();
    expect(screen.getByText("YOLO_V8_V2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View result" }));
    expect(onViewResult).toHaveBeenCalledWith(ready);
  });

  it("disables View result until the result is ready", () => {
    render(
      <MapRequestCardList
        requests={[
          request(2, {
            status: PredictionRequestStatus.RUNNING,
            results_ready: false,
          }),
        ]}
        onViewResult={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "View result" })).toBeDisabled();
  });

  it("gives a failed request its failure reason in advanced mode", () => {
    mode.mappingMode = "advanced";
    render(
      <MapRequestCardList
        requests={[
          request(4, {
            status: PredictionRequestStatus.FAILED,
            results_ready: false,
            error:
              "ValueError: Prediction 4: AOI covers no whole tile at zoom 19",
          }),
        ]}
        onViewResult={vi.fn()}
      />,
    );
    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toHaveTextContent(
      "ValueError: Prediction 4: AOI covers no whole tile at zoom 19",
    );

    fireEvent.click(screen.getByRole("button", { name: "Failed" }));
    expect(tooltip.dataset.open).toBe("true");
  });

  it("keeps the failure reason out of basic mode", () => {
    mode.mappingMode = "basic";
    render(
      <MapRequestCardList
        requests={[
          request(5, {
            status: PredictionRequestStatus.FAILED,
            results_ready: false,
            error:
              "ValueError: Prediction 5: AOI covers no whole tile at zoom 19",
          }),
        ]}
        onViewResult={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("tooltip")).toBeNull();
  });

  it("shows how long ago a running request was sent, and uses grey cards", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    render(
      <MapRequestCardList
        tone="grey"
        requests={[
          request(3, {
            status: PredictionRequestStatus.RUNNING,
            results_ready: false,
            submitted_at: tenMinutesAgo,
          }),
        ]}
        onViewResult={vi.fn()}
      />,
    );
    expect(screen.getByText("10 mins ago")).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveClass("bg-gray-white");
  });

  it("shows the date for a request that failed minutes ago", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60_000);
    render(
      <MapRequestCardList
        requests={[
          request(4, {
            status: PredictionRequestStatus.FAILED,
            results_ready: false,
            submitted_at: tenMinutesAgo.toISOString(),
          }),
        ]}
        onViewResult={vi.fn()}
      />,
    );
    expect(screen.queryByText("10 mins ago")).toBeNull();
    expect(
      screen.getByText(
        tenMinutesAgo.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      ),
    ).toBeInTheDocument();
  });
});
