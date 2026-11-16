import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PredictionRequestStatus } from "@/enums";
import type { TOfflinePrediction } from "@/types";
import { MapRequestCardList } from "../map-request-card-list";

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
    expect(screen.getByText("buildings")).toBeInTheDocument();
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
});
