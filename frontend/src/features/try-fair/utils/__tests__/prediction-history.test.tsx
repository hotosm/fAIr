import type { ComponentProps } from "react";
import { Drawer } from "@/components/ui/drawer";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appendPrediction,
  getSavedPrediction,
  getHistoryUrlParams,
  limitProjectHistory,
  restorePredictionHistory,
} from "@/features/try-fair/utils/prediction-history";
import { PredictionHistoryPanel } from "@/features/try-fair/components/prediction-history-panel";
import type {
  PredictionHistoryEntry,
  SavedUserState,
} from "@/features/try-fair/api/user-state";
import { ModelType, TryFairMapOutputType, TryFairResolution } from "@/enums";

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({
    open,
    setOpen,
    label,
    children,
    placement,
  }: ComponentProps<typeof Drawer>) =>
    open ? (
      <div
        role="dialog"
        aria-label={label}
        data-placement={placement}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <button onClick={() => setOpen(false)}>Close history</button>
        {children}
      </div>
    ) : null,
}));

export const historyEntry = (id: string): PredictionHistoryEntry => ({
  id,
  created_at: `2026-10-20T12:0${id}:00Z`,
  snapshot: {
    type: "mapping",
    name: `Run ${id}`,
    category: "buildings",
    model: { id: `model-${id}`, title: `Model ${id}` },
    imagery: {
      name: `Imagery ${id}`,
      url: `https://example.com/${id}/{z}/{x}/{y}.png`,
    },
    bbox: [0, 0, 1, 1],
    zoom: 19,
    params: { confidence_threshold: Number(id) / 10 },
    url_params: {
      model: `model-${id}`,
      selectedModelId: null,
      output: TryFairMapOutputType.POLYGON,
      resolution: TryFairResolution.LOW,
      confidence: Number(id) / 10,
      feature: "buildings",
      mode: ModelType.DEMO,
      mappingMode: "basic",
      imagery: null,
      imageryType: null,
      oamItem: null,
      chooseLocation: false,
      params: null,
    },
    prediction_result: {
      predictions: { type: "FeatureCollection", features: [] },
      bbox: [0, 0, 1, 1],
      gridZoom: 19,
      modelId: `model-${id}`,
      imageUri: `https://example.com/${id}/{z}/{x}/{y}.png`,
      resolution: TryFairResolution.LOW,
      params: { confidence_threshold: Number(id) / 10 },
    },
  },
});

afterEach(cleanup);

describe("project prediction history", () => {
  it("retains all five complete snapshots, then replaces the oldest on run six", () => {
    let history: PredictionHistoryEntry[] = [];
    for (let i = 1; i <= 5; i++)
      history = appendPrediction(history, historyEntry(String(i)), 5);
    expect(history).toEqual(
      [1, 2, 3, 4, 5].map((id) => historyEntry(String(id))),
    );
    const original = history;
    history = appendPrediction(history, historyEntry("6"), 5);
    expect(history.map((entry) => entry.id)).toEqual(["2", "3", "4", "5", "6"]);
    expect(original[0].snapshot.params).toEqual({ confidence_threshold: 0.1 });
    expect(history[0].snapshot.imagery.url).toContain("/2/");
  });

  it("restores exact inference parameters without locking the confidence slider", () => {
    const entry = historyEntry("1");
    entry.snapshot.url_params.confidence = 0.1234;
    entry.snapshot.prediction_result.params = {
      confidence_threshold: 0.12,
      simplify_m: 2,
    };
    const restored = getHistoryUrlParams(
      entry.snapshot.url_params,
      entry.snapshot.prediction_result.params,
    );
    expect(restored.confidence).toBe(0.12);
    expect(restored.params).toEqual({ simplify_m: 2 });
  });

  it("honors another configured capacity", () => {
    expect(
      appendPrediction(
        [historyEntry("1"), historyEntry("2")],
        historyEntry("3"),
        2,
      ).map((entry) => entry.id),
    ).toEqual(["2", "3"]);
    expect(appendPrediction([historyEntry("1")], historyEntry("2"), 1)).toEqual(
      [historyEntry("2")],
    );
  });

  it("restores history and exactly one selected result after a JSON round trip", () => {
    const project: SavedUserState = {
      pid: 4,
      timestamp: "2026-10-20T12:00:00Z",
      state: {
        ...historyEntry("2").snapshot,
        prediction_result: undefined,
        prediction_history: [historyEntry("1"), historyEntry("2")],
        active_prediction_id: "1",
      },
    };
    const saved = JSON.parse(JSON.stringify(project)) as SavedUserState;
    expect(restorePredictionHistory(saved, 5)).toEqual(
      project.state.prediction_history,
    );
    expect(getSavedPrediction(saved)).toEqual(
      historyEntry("1").snapshot.prediction_result,
    );
    saved.state.active_prediction_id = null;
    expect(getSavedPrediction(saved)).toBeNull();
    expect(restorePredictionHistory(saved, 5)).toHaveLength(2);
  });

  it("restores the newest retained run when an admin lowers the limit below the active run", () => {
    const project: SavedUserState = {
      pid: 4,
      timestamp: "2026-10-20T12:00:00Z",
      state: {
        ...historyEntry("1").snapshot,
        prediction_history: [
          historyEntry("1"),
          historyEntry("2"),
          historyEntry("3"),
        ],
        active_prediction_id: "1",
      },
    };
    const limited = limitProjectHistory(project, 2);
    expect(limited.state.prediction_history?.map((entry) => entry.id)).toEqual([
      "2",
      "3",
    ]);
    expect(limited.state.active_prediction_id).toBe("3");
    expect(limited.state.model.id).toBe("model-3");
    expect(getSavedPrediction(limited)).toEqual(
      historyEntry("3").snapshot.prediction_result,
    );
    expect(project.state.prediction_history).toHaveLength(3);
  });

  it("migrates a legacy single-result project without losing its result", () => {
    const project: SavedUserState = {
      pid: 8,
      timestamp: "2026-10-20T12:00:00Z",
      state: historyEntry("1").snapshot,
    };
    const restored = restorePredictionHistory(project, 5);
    expect(restored).toHaveLength(1);
    expect(restored[0].snapshot).toEqual(project.state);
    expect(getSavedPrediction(project)).toEqual(
      project.state.prediction_result,
    );
    expect(restorePredictionHistory(undefined, 5)).toEqual([]);
  });
});

describe("prediction history panel", () => {
  it("shows newest first, marks only the active run, and restores the clicked snapshot", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const entries = [historyEntry("1"), historyEntry("2")];
    const view = render(
      <PredictionHistoryPanel
        open
        entries={entries}
        activeId="2"
        disabled={false}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining("Run 2"),
      expect.stringContaining("Run 1"),
    ]);
    expect(screen.getAllByText("Current")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Run 1/ }));
    expect(onSelect).toHaveBeenCalledWith(entries[0]);
    view.rerender(
      <PredictionHistoryPanel
        open
        entries={entries}
        activeId="1"
        disabled={false}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole("button", { name: /Run 1/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: /Run 2/ })).not.toHaveAttribute(
      "aria-current",
    );
    expect(entries.map((entry) => entry.id)).toEqual(["1", "2"]);
    fireEvent.keyDown(
      screen.getByRole("dialog", { name: "Prediction History" }),
      { key: "Escape" },
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("opens on the right and closes through the drawer", () => {
    const onClose = vi.fn();
    const props = {
      entries: [],
      activeId: null,
      disabled: false,
      onSelect: vi.fn(),
      onClose,
    };
    const view = render(<PredictionHistoryPanel {...props} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    view.rerender(<PredictionHistoryPanel {...props} open />);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-placement", "end");
    fireEvent.click(screen.getByRole("button", { name: "Close history" }));
    expect(onClose).toHaveBeenCalledOnce();
    view.rerender(<PredictionHistoryPanel {...props} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("prevents switching while inference is running and supports an empty history", () => {
    const onSelect = vi.fn();
    const view = render(
      <PredictionHistoryPanel
        open
        entries={[historyEntry("1")]}
        activeId={null}
        disabled
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Run 1/ }));
    expect(onSelect).not.toHaveBeenCalled();
    view.rerender(
      <PredictionHistoryPanel
        open
        entries={[]}
        activeId={null}
        disabled={false}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Run a prediction to start your history."),
    ).toBeInTheDocument();
  });
});
