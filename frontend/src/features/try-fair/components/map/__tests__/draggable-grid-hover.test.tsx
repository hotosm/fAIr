import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Map as MapLibreMap } from "maplibre-gl";
import { TryFairDraggableGrid } from "@/features/try-fair/components/map/draggable-grid";
import { TryFairMapOutputType } from "@/enums";
import type { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { getPredictionClassStyle } from "@/features/try-fair/utils/prediction-classes";

const params = vi.hoisted(() => ({
  mappingMode: "advanced",
  isAuthenticated: true,
}));
vi.mock("@/app/providers/auth-provider", () => ({ useAuth: () => params }));
vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => params,
}));
vi.mock("@/hooks/use-screen-size", () => ({
  default: () => ({ isSmallViewport: false }),
}));
vi.mock("@/features/try-fair/hooks/use-tile-grid", () => ({
  useTileGrid: () => ({
    anchor: { x: 0, y: 0, z: 19 },
    setAnchor: vi.fn(),
    tileZoom: 19,
  }),
}));
vi.mock("@/features/try-fair/hooks/use-grid-drag", () => ({
  useGridDrag: () => ({ isDragging: false, handlePointerDown: vi.fn() }),
}));
vi.mock("@/features/try-fair/hooks/use-grid-visibility", () => ({
  useGridVisibility: () => ({ isOffScreen: false, angleRad: 0 }),
}));
vi.mock("@/features/try-fair/components/map/grid-off-screen-nudge", () => ({
  GridOffScreenNudge: () => null,
}));
vi.mock("@/features/try-fair/hooks/use-grid-screen-geometry", () => ({
  useGridScreenGeometry: () => ({
    verticalLines: [
      { x1: 0, y1: 0, x2: 0, y2: 100 },
      { x1: 100, y1: 0, x2: 100, y2: 100 },
    ],
    horizontalLines: [
      { x1: 0, y1: 0, x2: 100, y2: 0 },
      { x1: 0, y1: 100, x2: 100, y2: 100 },
    ],
    exportButtonPosition: { x: 100, y: 0 },
  }),
  screenLineToPointsAttr: () => "",
}));

const treesClassStyle = getPredictionClassStyle({
  id: "deepforest-tree",
  properties: {
    "mlm:output": [
      {
        name: "tree crowns",
        variables: ["class", "label", "confidence", "source"],
        "classification:classes": [{ value: 1, name: "tree" }],
      },
    ],
    "cube:variables": {
      class: { values: [1] },
      label: { values: ["tree"] },
      confidence: { extent: [0, 1] },
      source: {},
    },
  },
} as unknown as BaseModelStacItem);

beforeEach(() => {
  vi.stubGlobal("PointerEvent", MouseEvent);
  params.mappingMode = "advanced";
  params.isAuthenticated = true;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const hoverGrid = () => {
  const map = {
    getLayer: () => ({}),
    getCanvas: () => ({
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
    }),
    queryRenderedFeatures: () => [
      {
        properties: {
          class: 1,
          label: "tree",
          confidence: 0.87,
          source: "OAM-1-2-20.tif",
        },
      },
    ],
    on: vi.fn(),
    off: vi.fn(),
  };
  const { container } = render(
    <TryFairDraggableGrid
      map={map as unknown as MapLibreMap}
      mapContainerRef={{ current: document.createElement("div") }}
      onBBoxChange={vi.fn()}
      outputType={TryFairMapOutputType.POLYGON}
      classStyle={treesClassStyle}
    />,
  );
  fireEvent.pointerMove(container.querySelector("polygon")!, {
    clientX: 50,
    clientY: 50,
  });
};

describe("draggable grid hover", () => {
  it("shows the STAC-declared fields of the feature under the pointer in Advanced mode", () => {
    hoverGrid();
    expect(screen.getByText("confidence")).toBeInTheDocument();
    expect(screen.getByText("87.0%")).toBeInTheDocument();
  });

  it("hides the fields in Basic mode", () => {
    params.mappingMode = "basic";
    hoverGrid();
    expect(screen.queryByText("87.0%")).not.toBeInTheDocument();
  });
});
