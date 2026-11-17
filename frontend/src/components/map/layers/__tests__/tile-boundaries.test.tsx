import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Map as MapLibreMap } from "maplibre-gl";
import { TileBoundaries } from "../tile-boundaries";
import { TILE_BOUNDARY_LAYER_ID, TILE_BOUNDARY_SOURCE_ID } from "@/config";
import { getTileBoundariesGeoJSON } from "@/utils";

vi.mock("@/utils", () => ({
  getTileBoundariesGeoJSON: vi.fn(() => ({
    type: "FeatureCollection",
    features: [],
  })),
}));

function createMap() {
  const listeners = new Map<string, Set<() => void>>();
  let layers = [{ id: "imagery" }];
  let source: { setData: ReturnType<typeof vi.fn> } | undefined;
  const setData = vi.fn();
  const emit = (event: string) => listeners.get(event)?.forEach((fn) => fn());
  const map = {
    getStyle: () => ({ layers }),
    getZoom: () => 17.5,
    getSource: (id: string) =>
      id === TILE_BOUNDARY_SOURCE_ID ? source : undefined,
    getLayer: (id: string) => layers.find((layer) => layer.id === id),
    addSource: vi.fn(() => {
      source = { setData };
    }),
    addLayer: vi.fn((layer: { id: string }) => {
      layers.push(layer);
      emit("styledata");
    }),
    moveLayer: vi.fn((id: string) => {
      const layer = layers.find((item) => item.id === id)!;
      layers = [...layers.filter((item) => item.id !== id), layer];
      // Match MapLibre: even a redundant move produces a style update.
      emit("styledata");
    }),
    on: (event: string, fn: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    },
    off: (event: string, fn: () => void) => listeners.get(event)?.delete(fn),
  };
  return {
    map: map as unknown as MapLibreMap,
    api: map,
    setData,
    emit,
    resetStyle: () => {
      layers = [{ id: "imagery" }];
      source = undefined;
      emit("styledata");
    },
  };
}

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
function flushFrame() {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((fn) => fn(0));
}

beforeEach(() => {
  vi.clearAllMocks();
  frames = new Map();
  nextFrame = 0;
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
    frames.set(++nextFrame, fn);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("tile boundaries", () => {
  it("settles after style events instead of continually moving the top layer", () => {
    const { map, api, emit } = createMap();
    render(<TileBoundaries map={map} />);
    emit("styledata");
    flushFrame();
    expect(api.moveLayer).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("moves above a new overlay once and then settles", () => {
    const { map, api } = createMap();
    render(<TileBoundaries map={map} />);
    api.addLayer({ id: "predictions" });
    flushFrame();
    flushFrame();
    expect(api.moveLayer).toHaveBeenCalledExactlyOnceWith(
      TILE_BOUNDARY_LAYER_ID,
    );
    const layers = api.getStyle().layers;
    expect(layers[layers.length - 1]?.id).toBe(TILE_BOUNDARY_LAYER_ID);
    expect(frames.size).toBe(0);
  });

  it("keeps updating geometry on movement and zoom, including fixed grid zoom changes", () => {
    const { map, emit, setData } = createMap();
    const view = render(<TileBoundaries map={map} />);
    expect(getTileBoundariesGeoJSON).toHaveBeenLastCalledWith(map, 17);
    setData.mockClear();
    emit("move");
    emit("zoom");
    flushFrame();
    expect(setData).toHaveBeenCalledTimes(1);
    view.rerender(<TileBoundaries map={map} zoom={19} />);
    expect(getTileBoundariesGeoJSON).toHaveBeenLastCalledWith(map, 19);
    view.rerender(<TileBoundaries map={map} zoom={20} />);
    expect(getTileBoundariesGeoJSON).toHaveBeenLastCalledWith(map, 20);
  });

  it("recreates boundaries after a style replacement and stops on unmount", () => {
    const { map, api, resetStyle, emit } = createMap();
    const view = render(<TileBoundaries map={map} />);
    resetStyle();
    flushFrame();
    flushFrame();
    expect(api.addSource).toHaveBeenCalledTimes(2);
    expect(api.getLayer(TILE_BOUNDARY_LAYER_ID)).toBeDefined();
    expect(frames.size).toBe(0);
    emit("move");
    view.unmount();
    expect(frames.size).toBe(0);
    emit("styledata");
    emit("zoom");
    expect(frames.size).toBe(0);
  });
});
