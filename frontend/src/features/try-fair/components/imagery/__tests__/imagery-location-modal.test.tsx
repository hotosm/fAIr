import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageryLocationDialog } from "@/features/try-fair/components/imagery/imagery-location-modal";
import { searchImagery } from "@/features/try-fair/api/hot-imagery";

vi.mock("@/features/try-fair/api/hot-imagery", () => ({
  searchImagery: vi.fn(),
  getImageryTileUrl: vi.fn(() => "https://oam.example.com/tiles/{z}/{x}/{y}.png"),
}));

vi.mock("@/components/map", () => ({
  MapComponent: () => <div data-testid="mock-map-component" />,
}));

vi.mock("../oam-imagery-map", () => ({
  OamImageryMap: ({ onCellSelect }: any) => (
    <div data-testid="mock-oam-imagery-map">
      <button
        onClick={() =>
          onCellSelect({
            bbox: [10, 20, 30, 40],
            count: 2,
            geometry: { type: "Polygon", coordinates: [] },
          })
        }
      >
        Select Cell
      </button>
    </div>
  ),
}));

describe("ImageryLocationDialog", () => {
  const mockCloseDialog = vi.fn();
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should not render content when isOpened is false", () => {
    render(
      <ImageryLocationDialog
        isOpened={false}
        closeDialog={mockCloseDialog}
        onApply={mockOnApply}
      />,
    );

    expect(screen.queryByText("Imagery to map")).not.toBeInTheDocument();
  });

  it("should render dialog content and source toggle when isOpened is true", () => {
    render(
      <ImageryLocationDialog isOpened={true} closeDialog={mockCloseDialog} onApply={mockOnApply} />,
    );

    expect(screen.getByRole("radiogroup", { name: /imagery source/i })).toBeInTheDocument();
    expect(screen.getByTestId("mock-oam-imagery-map")).toBeInTheDocument();
  });

  it("should search imagery when grid cell is selected", async () => {
    const mockItems = [
      {
        id: "item-1",
        bbox: [10, 20, 30, 40],
        geometry: { type: "Polygon", coordinates: [] },
        title: "Cell Image 1",
        provider: "HOT",
        gsd: 0.5,
        acquiredAt: "2024-01-01",
        license: "CC-BY",
        platform: "drone",
        thumbnailUrl: null,
        assetName: "visual",
      },
    ];

    (searchImagery as any).mockResolvedValue(mockItems);

    render(
      <ImageryLocationDialog isOpened={true} closeDialog={mockCloseDialog} onApply={mockOnApply} />,
    );

    const selectCellButton = screen.getByText("Select Cell");
    fireEvent.click(selectCellButton);

    await waitFor(() =>
      expect(searchImagery).toHaveBeenCalledWith({
        bbox: [10, 20, 30, 40],
        signal: expect.any(AbortSignal),
      }),
    );

    expect(await screen.findByText("Cell Image 1")).toBeInTheDocument();
  });

  it("should switch to Custom Imagery source when toggled", () => {
    render(
      <ImageryLocationDialog isOpened={true} closeDialog={mockCloseDialog} onApply={mockOnApply} />,
    );

    const customRadio = screen.getByText("Custom Imagery");
    fireEvent.click(customRadio);

    expect(screen.getByText("XYZ Tile Server URL")).toBeInTheDocument();
  });
});
