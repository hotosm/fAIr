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
  type BaseModelStacItem,
} from "@/features/try-fair/api/stac";
import { TryFairResolution } from "@/enums";

vi.mock("@/features/try-fair/api/stac", () => ({ runPredict: vi.fn() }));

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
      assets: {
        "mlm:inference-endpoint": { href: "https://example.com/predict" },
      },
    } as BaseModelStacItem;
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
  });
});
