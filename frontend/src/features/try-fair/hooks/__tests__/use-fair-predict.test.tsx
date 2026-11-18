import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
import {
  useFairPredict,
  type PredictResult,
} from "@/features/try-fair/hooks/use-fair-predict";
import {
  runPredict,
  waitForModel,
  type BaseModelStacItem,
} from "@/features/try-fair/api/stac";
import { TryFairResolution } from "@/enums";

vi.mock("@/features/try-fair/api/stac", () => ({
  runPredict: vi.fn(),
  waitForModel: vi.fn(),
}));

const saved: PredictResult = {
  predictions: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [85.51, 27.61] },
        properties: { confidence: 0.9 },
      },
    ],
  },
  bbox: [85.5, 27.6, 85.52, 27.63],
  gridZoom: 19,
  modelId: "buildings",
  imageUri: "https://example.com/{z}/{x}/{y}.png",
  resolution: TryFairResolution.LOW,
  params: { confidence_threshold: 0.7 },
};

const wrapper = () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe("saved prediction results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it("restores predictions, bounds, and grid zoom without running prediction", () => {
    const { result } = renderHook(() => useFairPredict(saved), {
      wrapper: wrapper(),
    });
    expect(result.current.predictions).toEqual(saved.predictions);
    expect(result.current.predictionBBox).toEqual(saved.bbox);
    expect(result.current.predictionGridZoom).toBe(19);
    expect(runPredict).not.toHaveBeenCalled();
  });

  it("replaces the visible result when restoring history without submitting inference", () => {
    const { result } = renderHook(() => useFairPredict(saved), {
      wrapper: wrapper(),
    });
    const other: PredictResult = {
      ...saved,
      modelId: "trees",
      predictions: { type: "FeatureCollection", features: [] },
    };
    act(() => result.current.restoreResult(other));
    expect(result.current.result).toEqual(other);
    expect(result.current.predictions?.features).toHaveLength(0);
    act(() => result.current.restoreResult(saved));
    expect(result.current.result).toEqual(saved);
    expect(runPredict).not.toHaveBeenCalled();
  });

  it("does not resurrect saved results after imagery or model selection clears them", () => {
    const { result, rerender } = renderHook(() => useFairPredict(saved), {
      wrapper: wrapper(),
    });
    act(() => result.current.clearPredictions());
    rerender();
    expect(result.current.result).toBeNull();
    expect(result.current.predictions).toBeNull();
  });

  it("stores successful results with the inputs used to produce them", async () => {
    vi.mocked(runPredict).mockResolvedValue(saved.predictions);
    const model = {
      id: "buildings",
      properties: { "mlm:input": [{ name: "image" }] },
      assets: {
        "mlm:inference-endpoint": { href: "https://example.com/predict" },
      },
    } as unknown as BaseModelStacItem;
    const { result } = renderHook(() => useFairPredict(), {
      wrapper: wrapper(),
    });
    act(() =>
      result.current.predict({
        model,
        modelUri: "model.onnx",
        imageUri: saved.imageUri,
        bbox: saved.bbox,
        gridZoom: saved.gridZoom,
        resolution: saved.resolution,
        params: saved.params,
      }),
    );
    await waitFor(() => expect(result.current.result).toEqual(saved));
    expect(runPredict).toHaveBeenCalledWith(
      "https://example.com/predict",
      expect.objectContaining({ imagery: { image: saved.imageUri } }),
      expect.any(AbortSignal),
    );
  });

  it("wakes the model first, then sends the prediction", async () => {
    let modelAwake: () => void = () => {};
    vi.mocked(waitForModel).mockReturnValue(
      new Promise<void>((resolve) => {
        modelAwake = resolve;
      }),
    );
    vi.mocked(runPredict).mockResolvedValue(saved.predictions);
    const model = {
      id: "buildings",
      properties: { "mlm:input": [{ name: "image" }] },
      assets: {
        "mlm:inference-endpoint": { href: "https://example.com/predict" },
      },
    } as unknown as BaseModelStacItem;
    const { result } = renderHook(() => useFairPredict(), {
      wrapper: wrapper(),
    });

    act(() =>
      result.current.predict({
        model,
        modelUri: "model.onnx",
        imageUri: saved.imageUri,
        bbox: saved.bbox,
        gridZoom: saved.gridZoom,
        resolution: saved.resolution,
        params: saved.params,
      }),
    );
    await waitFor(() => expect(waitForModel).toHaveBeenCalled());
    expect(runPredict).not.toHaveBeenCalled();

    let finishPrediction: (value: GeoJSON.FeatureCollection) => void = () => {};
    vi.mocked(runPredict).mockReturnValue(
      new Promise((resolve) => {
        finishPrediction = resolve;
      }),
    );
    act(() => modelAwake());
    await waitFor(() => expect(runPredict).toHaveBeenCalled());
    act(() => finishPrediction(saved.predictions));
    await waitFor(() => expect(result.current.result).toEqual(saved));
    expect(waitForModel).toHaveBeenCalledWith(
      "https://example.com/predict",
      expect.any(AbortSignal),
    );
  });

  it("sends no prediction when the user stops while the model is waking", async () => {
    vi.mocked(waitForModel).mockImplementation(
      (_endpoint, signal) =>
        new Promise<void>((_resolve, reject) => {
          signal?.addEventListener("abort", () =>
            reject(new Error("canceled")),
          );
        }),
    );
    const model = {
      id: "buildings",
      properties: { "mlm:input": [{ name: "image" }] },
      assets: {
        "mlm:inference-endpoint": { href: "https://example.com/predict" },
      },
    } as unknown as BaseModelStacItem;
    const { result } = renderHook(() => useFairPredict(), {
      wrapper: wrapper(),
    });

    act(() =>
      result.current.predict({
        model,
        modelUri: "model.onnx",
        imageUri: saved.imageUri,
        bbox: saved.bbox,
        gridZoom: saved.gridZoom,
        resolution: saved.resolution,
        params: saved.params,
      }),
    );
    await waitFor(() => expect(waitForModel).toHaveBeenCalled());
    act(() => result.current.cancelPrediction());

    await waitFor(() => expect(result.current.isPredicting).toBe(false));
    expect(runPredict).not.toHaveBeenCalled();
  });

  it("stops waiting for the model when the page closes", async () => {
    let aborted = false;
    vi.mocked(waitForModel).mockImplementation(
      (_endpoint, signal) =>
        new Promise<void>(() => {
          signal?.addEventListener("abort", () => {
            aborted = true;
          });
        }),
    );
    const model = {
      id: "buildings",
      properties: { "mlm:input": [{ name: "image" }] },
      assets: {
        "mlm:inference-endpoint": { href: "https://example.com/predict" },
      },
    } as unknown as BaseModelStacItem;
    const { result, unmount } = renderHook(() => useFairPredict(), {
      wrapper: wrapper(),
    });
    act(() =>
      result.current.predict({
        model,
        modelUri: "model.onnx",
        imageUri: saved.imageUri,
        bbox: saved.bbox,
        gridZoom: saved.gridZoom,
        resolution: saved.resolution,
        params: saved.params,
      }),
    );
    await waitFor(() => expect(waitForModel).toHaveBeenCalled());

    unmount();

    expect(aborted).toBe(true);
  });
});
