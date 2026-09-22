import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
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

vi.mock("../use-base-models", () => ({
  useStacBaseModels: () => ({ models: [], loading: false }),
  useStacLocalModels: () => ({ models: [], loading: false }),
}));

describe("useTryFairParams", () => {
  const createWrapper = (searchParams?: Record<string, string>) => {
    return ({ children }: { children: React.ReactNode }) => (
      <NuqsTestingAdapter searchParams={searchParams}>
        {children}
      </NuqsTestingAdapter>
    );
  };

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
});
