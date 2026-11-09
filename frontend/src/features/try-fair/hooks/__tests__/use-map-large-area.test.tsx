import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DrawingModes } from "@/enums";
import { useMapLargeArea } from "../use-map-large-area";
import type { BBOX } from "@/types";

const mocks = vi.hoisted(() => ({
  map: {
    resize: vi.fn(),
    fitBounds: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getSource: vi.fn(),
    isSourceLoaded: vi.fn(() => true),
    getStyle: vi.fn(() => ({})),
    isStyleLoaded: vi.fn(() => true),
    setMinZoom: vi.fn(),
    addSource: vi.fn(),
    getLayer: vi.fn(),
    addLayer: vi.fn(),
  },
  draw: {
    getSnapshot: vi.fn(() => []),
    clear: vi.fn(),
    removeFeatures: vi.fn(),
    addFeatures: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
  imagery: { selectedImagery: null, currentModelType: "demo" },
  submit: vi.fn(),
}));
vi.mock("@/hooks/use-map-instance", async () => {
  const { useState, useRef } = await import("react");
  return {
    useMapInstance: () => {
      const [drawingMode, setDrawingMode] = useState(DrawingModes.STATIC);
      const mapContainerRef = useRef(null);
      return {
        map: mocks.map,
        terraDraw: mocks.draw,
        drawingMode,
        setDrawingMode,
        mapContainerRef,
      };
    },
  };
});
vi.mock("@/features/try-fair/utils/start-mapping-store", () => ({
  useStartMappingStore: () => mocks.imagery,
}));
vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => ({
    modelId: "test",
    resolution: "medium",
    confidence: 50,
  }),
}));
vi.mock("@/features/try-fair/api/map-large-area", () => ({
  useSubmitMapLargeArea: () => ({ mutate: mocks.submit, isPending: false }),
}));

const bounds: BBOX = [0, 0, 0.001, 0.001];
const options = {
  imageryBounds: bounds,
  tileServerURL: "https://example.com/{z}/{x}/{y}.png",
  onSubmit: vi.fn(),
  closeDialog: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.map.getSource.mockReset();
  mocks.map.isStyleLoaded.mockReturnValue(true);
});
afterEach(cleanup);

describe("cached area modal lifecycle", () => {
  it("clears the displayed polygon when switching to drawing even while imagery is loading", () => {
    const setData = vi.fn();
    mocks.map.getSource.mockImplementation((id: string) =>
      id === "large-area-aoi-source" ? { setData } : undefined,
    );
    const { result, rerender } = renderHook(
      ({ isOpened }) => useMapLargeArea({ ...options, isOpened }),
      { initialProps: { isOpened: true } },
    );
    act(() => result.current.handleTabChange("whole"));
    expect(setData.mock.lastCall?.[0].features).toHaveLength(1);
    mocks.map.isStyleLoaded.mockReturnValue(false);
    act(() => result.current.handleTabChange("draw"));
    expect(setData).toHaveBeenLastCalledWith({
      type: "FeatureCollection",
      features: [],
    });
    rerender({ isOpened: true });
    expect(result.current.selectedAOI).toBeNull();
    expect(setData).toHaveBeenLastCalledWith({
      type: "FeatureCollection",
      features: [],
    });
  });

  it("resets the form and AOI when closed, and enables drawing again on reopen", () => {
    const { result, rerender } = renderHook(
      ({ isOpened }) => useMapLargeArea({ ...options, isOpened }),
      { initialProps: { isOpened: true } },
    );
    act(() => {
      result.current.setDescription("Old request");
      result.current.handleTabChange("whole");
    });
    expect(result.current.selectedAOI).not.toBeNull();
    rerender({ isOpened: false });
    expect(result.current.description).toBe("");
    expect(result.current.selectedAOI).toBeNull();
    expect(result.current.activeTab).toBe("draw");
    expect(result.current.drawingMode).toBe(DrawingModes.STATIC);
    expect(mocks.draw.clear).toHaveBeenCalled();
    rerender({ isOpened: true });
    expect(result.current.drawingMode).toBe(DrawingModes.POLYGON);
    expect(result.current.description).toBe("");
  });

  it("does not intercept Escape while hidden", () => {
    const { rerender } = renderHook(
      ({ isOpened }) => useMapLargeArea({ ...options, isOpened }),
      { initialProps: { isOpened: true } },
    );
    const drawingEscape = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    });
    act(() => {
      window.dispatchEvent(drawingEscape);
    });
    expect(drawingEscape.defaultPrevented).toBe(true);
    rerender({ isOpened: false });
    const hiddenEscape = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    });
    window.dispatchEvent(hiddenEscape);
    expect(hiddenEscape.defaultPrevented).toBe(false);
  });

  it("frames changed imagery immediately on reopening", () => {
    const { rerender } = renderHook(
      ({ isOpened, imageryBounds }) =>
        useMapLargeArea({ ...options, isOpened, imageryBounds }),
      { initialProps: { isOpened: true, imageryBounds: bounds } },
    );
    expect(mocks.map.fitBounds).toHaveBeenLastCalledWith(
      bounds,
      expect.objectContaining({ duration: 0 }),
    );
    rerender({ isOpened: false, imageryBounds: bounds });
    mocks.map.fitBounds.mockClear();
    const nextBounds: BBOX = [1, 1, 1.001, 1.001];
    rerender({ isOpened: false, imageryBounds: nextBounds });
    expect(mocks.map.fitBounds).not.toHaveBeenCalled();
    rerender({ isOpened: true, imageryBounds: nextBounds });
    expect(mocks.map.fitBounds).toHaveBeenLastCalledWith(
      nextBounds,
      expect.objectContaining({ duration: 0 }),
    );
  });
});
