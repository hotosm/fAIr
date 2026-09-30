import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMapInstance } from "../use-map-instance";
import type { TerraDrawStyleVariant } from "@/components/map/setups/setup-terra-draw";
import type { BBOX } from "@/types";
import { DrawingModes } from "@/enums";

const mocks = vi.hoisted(() => {
  const createMap = () => {
    const listeners = new Map<string, () => void>();
    const sources = new Set<string>();
    return {
      listeners,
      sources,
      removed: false,
      on: vi.fn((event: string, callback: () => void) => {
        listeners.set(event, callback);
      }),
      off: vi.fn((event: string) => listeners.delete(event)),
      getZoom: vi.fn(() => 5),
      resize: vi.fn(),
      remove: vi.fn(function (this: { removed: boolean }) {
        if (sources.size) throw new Error("Drawing sources still attached");
        this.removed = true;
      }),
    };
  };
  const setupMap = vi.fn(createMap);
  const setupDraw = vi.fn((map: ReturnType<typeof createMap>) => ({
    start: vi.fn(() => {
      if (map.removed) throw new Error("Map already removed");
      if (map.sources.has("td-polygon")) {
        throw new Error('Source "td-polygon" already exists.');
      }
      map.sources.add("td-polygon");
    }),
    stop: vi.fn(() => {
      if (map.removed) throw new Error("Map already removed");
      map.sources.delete("td-polygon");
    }),
    setMode: vi.fn(),
  }));
  return { setupMap, setupDraw, setZoom: vi.fn() };
});

vi.mock("@/components/map/setups/setup-maplibre", () => ({
  setupMaplibreMap: mocks.setupMap,
}));
vi.mock("@/components/map/setups/setup-terra-draw", () => ({
  setupTerraDraw: mocks.setupDraw,
}));
vi.mock("@/store/map-store", () => ({
  useMapStore: (
    selector: (state: { setZoom: typeof mocks.setZoom }) => unknown,
  ) => selector({ setZoom: mocks.setZoom }),
}));

let current: ReturnType<typeof useMapInstance>;
function Harness({
  styleVariant = "default",
  bounds,
}: {
  styleVariant?: TerraDrawStyleVariant;
  bounds?: BBOX;
}) {
  current = useMapInstance(false, false, styleVariant, bounds);
  return <div ref={current.mapContainerRef} />;
}

function loadMap() {
  const map = mocks.setupMap.mock.results.slice(-1)[0].value;
  act(() => map.listeners.get("load")?.());
  return map;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useMapInstance drawing lifecycle", () => {
  it("does not register duplicate sources during Strict Mode renders", () => {
    const view = render(<Harness />, { wrapper: StrictMode });
    const map = loadMap();
    expect(map.sources.has("td-polygon")).toBe(true);
    expect(current.terraDraw).toBeDefined();

    const starts = mocks.setupDraw.mock.results.reduce(
      (count, result) => count + result.value.start.mock.calls.length,
      0,
    );
    expect(starts).toBe(1);
    view.rerender(<Harness />);
    expect(map.sources.size).toBe(1);

    view.unmount();
    expect(map.sources.size).toBe(0);
    expect(map.remove).toHaveBeenCalledOnce();
  });

  it("releases the previous sources before changing drawing configuration", () => {
    const bounds: BBOX = [0, 0, 1, 1];
    const view = render(<Harness bounds={bounds} />);
    const map = loadMap();
    const first = mocks.setupDraw.mock.results.slice(-1)[0].value;

    view.rerender(<Harness bounds={bounds} styleVariant="red" />);
    expect(first.stop).toHaveBeenCalledOnce();
    const second = mocks.setupDraw.mock.results.slice(-1)[0].value;
    expect(second.start).toHaveBeenCalledOnce();
    expect(second.setMode).toHaveBeenCalledWith(DrawingModes.STATIC);

    const nextBounds: BBOX = [1, 1, 2, 2];
    view.rerender(<Harness bounds={nextBounds} styleVariant="red" />);
    expect(second.stop).toHaveBeenCalledOnce();
    expect(mocks.setupDraw).toHaveBeenLastCalledWith(map, "red", nextBounds);
    expect(map.sources.size).toBe(1);

    const last = mocks.setupDraw.mock.results.slice(-1)[0].value;
    view.unmount();
    expect(last.stop).toHaveBeenCalledOnce();
    expect(map.sources.size).toBe(0);
  });
});
