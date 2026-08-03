import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OamImageryMap } from "@/features/try-fair/components/imagery/oam-imagery-map";
import {
  addImageryLayers,
  clearImageryPreview,
  highlightCell,
  showImageryPreview,
} from "../imagery-modal-map.layers";
import React from "react";

let mockClickCallback: (e: any) => void;
let mockMapInstance: any;

vi.mock("@/features/try-fair/hooks/use-imagery-modal-map", () => ({
  useImageryModalMap: () => ({
    map: mockMapInstance,
    mapContainerRef: { current: null },
  }),
}));

vi.mock("../imagery-modal-map.layers", () => ({
  addImageryLayers: vi.fn(),
  highlightCell: vi.fn(),
  showImageryPreview: vi.fn(),
  clearImageryPreview: vi.fn(),
  readCellAt: vi.fn(() => ({
    bbox: [10, 20, 30, 40],
    count: 5,
    geometry: { type: "Polygon", coordinates: [] },
  })),
}));

vi.mock("@/components/map", () => ({
  MapComponent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map-component">{children}</div>
  ),
}));

describe("OamImageryMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockMapInstance = {
      on: vi.fn((event: string, cb: any) => {
        if (event === "click") mockClickCallback = cb;
      }),
      off: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("should add imagery layers and listen to click events on map load", () => {
    const mockOnCellSelect = vi.fn();
    const mockOnMapReady = vi.fn();

    render(
      <OamImageryMap
        highlightGeometry={null}
        selectedItem={null}
        onCellSelect={mockOnCellSelect}
        onMapReady={mockOnMapReady}
        searchIconTooltipContent="Toggle location search"
      />,
    );

    expect(addImageryLayers).toHaveBeenCalledWith(mockMapInstance);
    expect(mockOnMapReady).toHaveBeenCalledWith(mockMapInstance);
    expect(mockMapInstance.on).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );

    // Simulate clicking map point
    mockClickCallback({ point: { x: 100, y: 200 } });

    expect(mockOnCellSelect).toHaveBeenCalledWith({
      bbox: [10, 20, 30, 40],
      count: 5,
      geometry: { type: "Polygon", coordinates: [] },
    });
  });

  it("should highlight cell polygon when highlightGeometry changes", () => {
    const geometry: GeoJSON.Geometry = { type: "Polygon", coordinates: [] };

    render(
      <OamImageryMap
        highlightGeometry={geometry}
        selectedItem={null}
        onCellSelect={vi.fn()}
        searchIconTooltipContent="Toggle location search"
      />,
    );

    expect(highlightCell).toHaveBeenCalledWith(mockMapInstance, geometry);
  });

  it("should call showImageryPreview when selectedItem is provided", () => {
    const mockSelectedItem: any = { id: "item-1" };

    render(
      <OamImageryMap
        highlightGeometry={null}
        selectedItem={mockSelectedItem}
        onCellSelect={vi.fn()}
        searchIconTooltipContent="Toggle location search"
      />,
    );

    expect(showImageryPreview).toHaveBeenCalledWith(
      mockMapInstance,
      mockSelectedItem,
    );
  });

  it("should call clearImageryPreview when selectedItem is null", () => {
    render(
      <OamImageryMap
        highlightGeometry={null}
        selectedItem={null}
        onCellSelect={vi.fn()}
        searchIconTooltipContent="Toggle location search"
      />,
    );

    expect(clearImageryPreview).toHaveBeenCalledWith(mockMapInstance);
  });

  it("should trigger onToggleSearch when search button is clicked", () => {
    const handleToggleSearch = vi.fn();

    render(
      <OamImageryMap
        highlightGeometry={null}
        selectedItem={null}
        onCellSelect={vi.fn()}
        onToggleSearch={handleToggleSearch}
        searchIconTooltipContent="Toggle location search"
      />,
    );

    const button = screen.getAllByRole("button", {
      name: /toggle location search/i,
    })[0];
    fireEvent.click(button);

    expect(handleToggleSearch).toHaveBeenCalled();
  });
});
