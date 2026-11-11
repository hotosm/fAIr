import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFeatureFeedback,
  deleteFeatureFeedback,
  getFeedbackRecords,
  updateFeatureFeedback,
  type FeedbackRecord,
} from "@/features/feedback/api/feedback";
import {
  useFeatureFeedback,
  type FeatureFeedbackContext,
} from "@/features/feedback/hooks/use-feature-feedback";
import { FeatureVerdict, FeedbackAction } from "@/features/feedback/types";
import { showErrorToast } from "@/utils";

vi.mock("@/features/feedback/api/feedback", () => ({
  createFeatureFeedback: vi.fn(),
  updateFeatureFeedback: vi.fn(),
  deleteFeatureFeedback: vi.fn(),
  getFeedbackRecords: vi.fn(),
}));
vi.mock("@/utils", () => ({ showErrorToast: vi.fn() }));

const createMock = vi.mocked(createFeatureFeedback);
const updateMock = vi.mocked(updateFeatureFeedback);
const deleteMock = vi.mocked(deleteFeatureFeedback);
const recordsMock = vi.mocked(getFeedbackRecords);

const makePredictions = (n: number): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: Array.from({ length: n }, (_, i) => ({
    type: "Feature",
    properties: { i },
    geometry: { type: "Point", coordinates: [i, i] },
  })),
});

const context: FeatureFeedbackContext = {
  stacId: "buildings",
  bbox: [0, 0, 3, 3],
  userId: 99,
  config: { zoom: 19 },
};

/** A saved record on the point feature at index `i`. */
const savedRecord = (
  id: number,
  i: number,
  action: FeedbackAction,
): FeedbackRecord => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [i, i] },
  properties: {
    id,
    stac_id: "buildings",
    action,
    comments: "",
    config: {},
    created_at: "2026-11-09T00:00:00Z",
  },
});

const render = (predictions: GeoJSON.FeatureCollection) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useFeatureFeedback(predictions, context), {
    wrapper,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  recordsMock.mockResolvedValue([]);
});

describe("useFeatureFeedback", () => {
  it("colours features from the user's saved feedback", async () => {
    recordsMock.mockResolvedValue([
      savedRecord(11, 0, FeedbackAction.ACCEPT),
      savedRecord(12, 2, FeedbackAction.REJECT),
    ]);
    const { result } = render(makePredictions(3));

    await waitFor(() =>
      expect(result.current.verdicts).toEqual({
        0: FeatureVerdict.VALID,
        2: FeatureVerdict.INVALID,
      }),
    );
    expect(result.current.validFeatures.features).toHaveLength(1);
    expect(result.current.invalidFeatures.features).toHaveLength(1);
    expect(recordsMock).toHaveBeenCalledWith({
      stacId: "buildings",
      bbox: [0, 0, 3, 3],
      userId: 99,
    });
  });

  it("creates a record for a new mark, then shows the saved state", async () => {
    const predictions = makePredictions(2);
    createMock.mockResolvedValue(savedRecord(42, 1, FeedbackAction.ACCEPT));
    const { result } = render(predictions);
    await waitFor(() => expect(recordsMock).toHaveBeenCalled());

    recordsMock.mockResolvedValue([savedRecord(42, 1, FeedbackAction.ACCEPT)]);
    await act(() => result.current.toggleVerdict(1, FeatureVerdict.VALID));

    expect(createMock).toHaveBeenCalledWith({
      stacId: "buildings",
      geometry: predictions.features[1].geometry,
      action: FeedbackAction.ACCEPT,
      config: { zoom: 19 },
    });
    expect(result.current.verdicts).toEqual({ 1: FeatureVerdict.VALID });
    expect(result.current.isSaving).toBe(false);
  });

  it("updates an existing record when switching thumbs", async () => {
    recordsMock.mockResolvedValue([savedRecord(42, 0, FeedbackAction.ACCEPT)]);
    const { result } = render(makePredictions(1));
    await waitFor(() =>
      expect(result.current.verdicts).toEqual({ 0: FeatureVerdict.VALID }),
    );

    recordsMock.mockResolvedValue([savedRecord(42, 0, FeedbackAction.REJECT)]);
    await act(() => result.current.toggleVerdict(0, FeatureVerdict.INVALID));

    expect(updateMock).toHaveBeenCalledWith({
      id: 42,
      action: FeedbackAction.REJECT,
    });
    expect(createMock).not.toHaveBeenCalled();
    expect(result.current.verdicts).toEqual({ 0: FeatureVerdict.INVALID });
  });

  it("deletes the record when the active thumb is clicked again", async () => {
    recordsMock.mockResolvedValue([savedRecord(42, 0, FeedbackAction.ACCEPT)]);
    const { result } = render(makePredictions(1));
    await waitFor(() =>
      expect(result.current.verdicts).toEqual({ 0: FeatureVerdict.VALID }),
    );

    recordsMock.mockResolvedValue([]);
    await act(() => result.current.toggleVerdict(0, FeatureVerdict.VALID));

    expect(deleteMock).toHaveBeenCalledWith({ id: 42 });
    expect(result.current.verdicts).toEqual({});
  });

  it("shows the new mark while it is saving", async () => {
    let finishSave: () => void = () => {};
    createMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = () => resolve(savedRecord(1, 0, FeedbackAction.ACCEPT));
        }),
    );
    const { result } = render(makePredictions(1));
    await waitFor(() => expect(recordsMock).toHaveBeenCalled());

    let saving: Promise<void> = Promise.resolve();
    act(() => {
      saving = result.current.toggleVerdict(0, FeatureVerdict.VALID);
    });
    expect(result.current.verdicts).toEqual({ 0: FeatureVerdict.VALID });
    expect(result.current.isSaving).toBe(true);

    // Clicks are ignored until the save finishes.
    await act(() => result.current.toggleVerdict(0, FeatureVerdict.INVALID));
    await waitFor(() => expect(createMock).toHaveBeenCalledOnce());

    recordsMock.mockResolvedValue([savedRecord(1, 0, FeedbackAction.ACCEPT)]);
    await act(async () => {
      finishSave();
      await saving;
    });
    expect(updateMock).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it("goes back to the saved state and shows a toast when saving fails", async () => {
    const error = new Error("boom");
    createMock.mockRejectedValue(error);
    const { result } = render(makePredictions(1));
    await waitFor(() => expect(recordsMock).toHaveBeenCalled());

    await act(() => result.current.toggleVerdict(0, FeatureVerdict.VALID));

    expect(result.current.verdicts).toEqual({});
    expect(showErrorToast).toHaveBeenCalledWith(error);
  });

  it("clears the selection when a new prediction arrives", async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ predictions }) => useFeatureFeedback(predictions, context),
      { initialProps: { predictions: makePredictions(2) }, wrapper },
    );
    act(() => result.current.select(1));
    expect(result.current.selectedId).toBe(1);

    rerender({ predictions: makePredictions(2) });
    expect(result.current.selectedId).toBeNull();
  });
});
