import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TryFairMapOutputType } from "@/enums/try-fair";
import { TryFairSwipe } from "@/features/try-fair/components/map/try-fair-swipe";

type FakeMap = {
  options: { style: { sources: { pre: { tiles: string[] } } } };
  handlers: Record<string, () => void>;
  once: ReturnType<typeof vi.fn>;
  jumpTo: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

const createdMaps: FakeMap[] = [];
const layerMapProps: unknown[] = [];

vi.mock("maplibre-gl", () => ({
  default: {
    Map: vi.fn().mockImplementation(function (this: FakeMap, options) {
      this.options = options;
      this.handlers = {};
      this.once = vi.fn((event: string, handler: () => void) => {
        this.handlers[event] = handler;
      });
      this.jumpTo = vi.fn();
      this.remove = vi.fn();
      createdMaps.push(this);
    }),
  },
}));

vi.mock(
  "@/features/try-fair/components/map/try-fair-prediction-results",
  () => ({
    TryFairPredictionsLayer: ({ map }: { map: unknown }) => {
      layerMapProps.push(map);
      return null;
    },
  }),
);

const mainMap = {
  getCenter: () => ({ lng: 85.37, lat: 28.26 }),
  getZoom: () => 18,
  getBearing: () => 0,
  getPitch: () => 0,
  on: vi.fn(),
  off: vi.fn(),
} as never;

const renderSwipe = (preImageryUrl: string | null) =>
  render(
    <TryFairSwipe
      map={mainMap}
      preImageryUrl={preImageryUrl}
      predictions={null}
      predictionBBox={null}
      outputType={TryFairMapOutputType.POLYGON}
    />,
  );

describe("TryFairSwipe", () => {
  beforeEach(() => {
    createdMaps.length = 0;
    layerMapProps.length = 0;
  });

  afterEach(() => cleanup());

  it("renders nothing and creates no map without pre imagery", () => {
    renderSwipe(null);

    expect(createdMaps).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: /compare pre and post/i }),
    ).toBeNull();
  });

  it("hands the pre map to the predictions layer only after it loads", () => {
    renderSwipe("https://pre.example/{z}/{x}/{y}");

    expect(createdMaps).toHaveLength(1);
    expect(createdMaps[0].options.style.sources.pre.tiles).toEqual([
      "https://pre.example/{z}/{x}/{y}",
    ]);
    expect(layerMapProps[layerMapProps.length - 1]).toBeNull();

    act(() => createdMaps[0].handlers.load());

    expect(layerMapProps[layerMapProps.length - 1]).toBe(createdMaps[0]);
  });

  it("removes the old pre map when the imagery changes and on unmount", () => {
    const { rerender, unmount } = renderSwipe(
      "https://pre-a.example/{z}/{x}/{y}",
    );

    rerender(
      <TryFairSwipe
        map={mainMap}
        preImageryUrl="https://pre-b.example/{z}/{x}/{y}"
        predictions={null}
        predictionBBox={null}
        outputType={TryFairMapOutputType.POLYGON}
      />,
    );
    expect(createdMaps[0].remove).toHaveBeenCalledTimes(1);
    expect(createdMaps).toHaveLength(2);

    unmount();
    expect(createdMaps[1].remove).toHaveBeenCalledTimes(1);
  });

  it("moves the divider with the arrow keys within its bounds", () => {
    const { container } = renderSwipe("https://pre.example/{z}/{x}/{y}");
    const handle = screen.getByRole("button", {
      name: /compare pre and post/i,
    });
    const clippedOverlay = () =>
      (container.firstElementChild as HTMLElement).style.clipPath;

    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(clippedOverlay()).toBe("inset(0 45% 0 0)");

    for (let press = 0; press < 20; press++) {
      fireEvent.keyDown(handle, { key: "ArrowLeft" });
    }
    expect(clippedOverlay()).toBe("inset(0 95% 0 0)");
  });
});
