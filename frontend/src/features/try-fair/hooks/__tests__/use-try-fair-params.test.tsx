import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from "nuqs/adapters/testing";
import {
  TRY_FAIR_PARAM_DEFAULTS,
  useTryFairParams,
} from "@/features/try-fair/hooks/use-try-fair-params";
import {
  ModelType,
  TileServiceType,
  TryFairMapOutputType,
  TryFairResolution,
} from "@/enums";
import React from "react";
import type { BaseModelStacItem } from "@/features/try-fair/api/stac";

const catalogue = vi.hoisted(() => ({
  base: [] as BaseModelStacItem[],
  local: [] as BaseModelStacItem[],
}));
const modelWithZoom = (zoom?: number): BaseModelStacItem => ({
  id: "recommended-model",
  type: "Feature",
  assets: {},
  properties: {
    title: "Recommended model",
    description: "",
    deprecated: false,
    "mlm:name": "Recommended model",
    "mlm:architecture": "",
    "mlm:tasks": [],
    "mlm:framework": "",
    "fair:pinned": false,
    "mlm:hyperparameters": {},
    "fair:hyperparameters_spec": [],
    "fair:category": "buildings",
    "fair:recommended_zoom": zoom,
    keywords: ["buildings"],
    providers: [],
  },
});
beforeEach(() => {
  catalogue.base = [];
  catalogue.local = [];
});

vi.mock("@/features/try-fair/hooks/use-base-models", () => ({
  useStacBaseModels: () => ({ models: catalogue.base, loading: false }),
  useStacLocalModels: () => ({ models: catalogue.local, loading: false }),
}));

describe("useTryFairParams", () => {
  const createWrapper = (
    searchParams?: Record<string, string>,
    onUrlUpdate?: OnUrlUpdateFunction,
  ) => {
    return ({ children }: { children: React.ReactNode }) => (
      <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
        {children}
      </NuqsTestingAdapter>
    );
  };

  it.each([
    [20, TryFairResolution.LOW],
    [19, TryFairResolution.MID],
    [18, TryFairResolution.HIGH],
    [undefined, TryFairResolution.LOW],
    [17, TryFairResolution.LOW],
  ])("uses recommended zoom %s for the default size %s", (zoom, expected) => {
    catalogue.base = [modelWithZoom(zoom)];
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper({ model: "recommended-model" }),
    });
    expect(result.current.resolution).toBe(expected);
    expect(result.current.urlState.resolution).toBe(expected);
    expect(result.current.isParametersDefault).toBe(true);
  });

  it("uses local-model recommendations when the catalogue finishes loading", () => {
    const { result, rerender } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper({ model: "recommended-model" }),
    });
    expect(result.current.resolution).toBe(TryFairResolution.LOW);
    catalogue.local = [modelWithZoom(18)];
    rerender();
    expect(result.current.resolution).toBe(TryFairResolution.HIGH);
  });

  it("keeps an explicit URL size, including Low, over the model recommendation", () => {
    catalogue.base = [modelWithZoom(18)];
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper({ model: "recommended-model", resolution: "low" }),
    });
    expect(result.current.resolution).toBe(TryFairResolution.LOW);
    expect(result.current.isParametersDefault).toBe(false);
    act(() => {
      result.current.resetParameters();
    });
    expect(result.current.resolution).toBe(TryFairResolution.HIGH);
    expect(result.current.isParametersDefault).toBe(true);
  });

  it("uses the recommendation when a URL size is invalid", () => {
    catalogue.base = [modelWithZoom(19)];
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper({
        model: "recommended-model",
        resolution: "invalid",
      }),
    });
    expect(result.current.resolution).toBe(TryFairResolution.MID);
  });

  it("keeps a restored prediction's size instead of replacing it with the recommendation", async () => {
    catalogue.base = [modelWithZoom(18)];
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper({ model: "recommended-model" }),
    });
    await act(async () => {
      await result.current.restoreParams({
        ...result.current.urlState,
        resolution: TryFairResolution.MID,
      });
    });
    expect(result.current.resolution).toBe(TryFairResolution.MID);
  });

  it("restores a history entry's model, imagery, output, and parameters atomically", async () => {
    const onUrlUpdate = vi.fn();
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper({}, onUrlUpdate),
    });
    const snapshot = {
      ...result.current.urlState,
      model: "saved-model",
      selectedModelId: "saved-model",
      output: TryFairMapOutputType.POINTS,
      resolution: TryFairResolution.HIGH,
      confidence: 0.23,
      feature: "trees",
      mode: ModelType.IMAGERY,
      imagery: "https://example.com/saved/{z}/{x}/{y}.png",
      imageryType: TileServiceType.XYZ,
      oamItem: null,
      chooseLocation: false,
      params: { confidence_threshold: 0.23, seed_min_distance: 8 },
    };
    await act(async () => {
      await result.current.restoreParams(snapshot);
    });
    expect(onUrlUpdate).toHaveBeenCalledOnce();
    const search = onUrlUpdate.mock.calls[0][0].searchParams as URLSearchParams;
    expect(search.get("model")).toBe("saved-model");
    expect(search.get("imagery")).toBe(snapshot.imagery);
    expect(search.get("output")).toBe(TryFairMapOutputType.POINTS);
    expect(search.get("resolution")).toBe(TryFairResolution.HIGH);
    expect(JSON.parse(search.get("params")!)).toEqual(snapshot.params);
  });

  it("should initialize with default parameters when no query params are supplied", () => {
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper(),
    });

    expect(result.current.modelId).toBe(TRY_FAIR_PARAM_DEFAULTS.model);
    expect(result.current.outputType).toBe(TryFairMapOutputType.POLYGON);
    expect(result.current.resolution).toBe(TryFairResolution.LOW);
    expect(result.current.confidence).toBe(TRY_FAIR_PARAM_DEFAULTS.confidence);
    expect(result.current.feature).toBe(TRY_FAIR_PARAM_DEFAULTS.feature);
    expect(result.current.mode).toBe(ModelType.DEMO);
    expect(result.current.imageryUrl).toBeNull();
    expect(result.current.imageryTileServiceType).toBeNull();
    expect(result.current.oamItemId).toBeNull();
    expect(result.current.chooseLocation).toBe(false);
    expect(result.current.isParametersDefault).toBe(true);
  });

  it("should hydrate parameters from URL search params", () => {
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper({
        model: "custom-model",
        output: "points",
        resolution: "mid",
        confidence: "0.85",
        feature: "roads",
        mode: "imagery",
        imagery: "https://example.com/tiles/{z}/{x}/{y}.png",
        imageryType: "XYZ",
        oamItem: "item-123",
        chooseLocation: "true",
        mappingMode: "advanced",
        selectedModelId: "chosen-model",
        params: JSON.stringify({ simplify_m: 1.25, seed_min_distance: 8 }),
      }),
    });

    expect(result.current.modelId).toBe("custom-model");
    expect(result.current.outputType).toBe(TryFairMapOutputType.POINTS);
    expect(result.current.resolution).toBe(TryFairResolution.MID);
    expect(result.current.confidence).toBe(0.85);
    expect(result.current.feature).toBe("roads");
    expect(result.current.mode).toBe(ModelType.IMAGERY);
    expect(result.current.imageryUrl).toBe(
      "https://example.com/tiles/{z}/{x}/{y}.png",
    );
    expect(result.current.imageryTileServiceType).toBe(TileServiceType.XYZ);
    expect(result.current.oamItemId).toBe("item-123");
    expect(result.current.chooseLocation).toBe(true);
    expect(result.current.isParametersDefault).toBe(false);
    expect(result.current.parameterOverrides).toEqual({
      simplify_m: 1.25,
      seed_min_distance: 8,
    });
    expect(result.current.urlState).toEqual({
      model: "custom-model",
      output: "points",
      resolution: "mid",
      confidence: 0.85,
      feature: "roads",
      mode: "imagery",
      imagery: "https://example.com/tiles/{z}/{x}/{y}.png",
      imageryType: "XYZ",
      oamItem: "item-123",
      chooseLocation: true,
      mappingMode: "advanced",
      selectedModelId: "chosen-model",
      params: { simplify_m: 1.25, seed_min_distance: 8 },
    });
  });

  it("should handle chooseLocation state updates correctly", () => {
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper(),
    });

    expect(result.current.chooseLocation).toBe(false);

    act(() => {
      result.current.setChooseLocation(true);
    });
    expect(result.current.chooseLocation).toBe(true);

    act(() => {
      result.current.setChooseLocation(false);
    });
    expect(result.current.chooseLocation).toBe(false);
  });

  it("should update parameters via updater functions", () => {
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setModelId("new-model");
      result.current.setOutputType(TryFairMapOutputType.CLUSTER);
      result.current.setResolution(TryFairResolution.HIGH);
      result.current.setConfidence(0.9);
      result.current.setFeature("water");
      result.current.setMode(ModelType.IMAGERY);
    });

    expect(result.current.modelId).toBe("new-model");
    expect(result.current.outputType).toBe(TryFairMapOutputType.CLUSTER);
    expect(result.current.resolution).toBe(TryFairResolution.HIGH);
    expect(result.current.confidence).toBe(0.9);
    expect(result.current.feature).toBe("water");
    expect(result.current.mode).toBe(ModelType.IMAGERY);
  });

  it("should set and clear imagery parameters via setImagery", () => {
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setImagery({
        url: "https://tiles.example.com/{z}/{x}/{y}.png",
        tileServiceType: TileServiceType.TMS,
        oamItemId: "oam-999",
      });
    });

    expect(result.current.imageryUrl).toBe(
      "https://tiles.example.com/{z}/{x}/{y}.png",
    );
    expect(result.current.imageryTileServiceType).toBe(TileServiceType.TMS);
    expect(result.current.oamItemId).toBe("oam-999");
  });

  it("should reset parameters to default values when resetParameters is called", () => {
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper({
        resolution: "high",
        confidence: "0.3",
      }),
    });

    expect(result.current.isParametersDefault).toBe(false);

    act(() => {
      result.current.resetParameters();
    });

    expect(result.current.resolution).toBe(TRY_FAIR_PARAM_DEFAULTS.resolution);
    expect(result.current.confidence).toBe(TRY_FAIR_PARAM_DEFAULTS.confidence);
    expect(result.current.isParametersDefault).toBe(true);
  });

  it("stores advanced inference parameter overrides in URL state", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const { result } = renderHook(() => useTryFairParams(), {
      wrapper: createWrapper(undefined, onUrlUpdate),
    });

    await act(async () => {
      await result.current.setParameterOverride("simplify_m", 0.9626);
      await result.current.setParameterOverride("seed_min_distance", 6);
    });

    expect(result.current.parameterOverrides).toEqual({
      simplify_m: 0.9626,
      seed_min_distance: 6,
    });
    const lastUrlUpdate =
      onUrlUpdate.mock.calls[onUrlUpdate.mock.calls.length - 1]?.[0];
    expect(
      JSON.parse(lastUrlUpdate?.searchParams.get("params") ?? "{}"),
    ).toEqual({ simplify_m: 0.9626, seed_min_distance: 6 });

    await act(async () => {
      await result.current.resetParameterOverrides();
    });
    expect(result.current.parameterOverrides).toEqual({});
  });
});
