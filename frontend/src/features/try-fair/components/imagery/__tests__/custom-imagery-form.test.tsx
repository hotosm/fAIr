import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomImageryForm } from "@/features/try-fair/components/imagery/custom-imagery-form";
import { TileServiceType } from "@/enums";

vi.mock("@/hooks/use-map-instance", () => ({
  useMapInstance: vi.fn(() => ({
    mapContainerRef: { current: null },
    map: {
      getBounds: vi.fn(() => ({
        getWest: () => 10,
        getSouth: () => 20,
        getEast: () => 30,
        getNorth: () => 40,
      })),
      getSource: vi.fn(() => null),
      getStyle: vi.fn(() => ({})),
      getLayer: vi.fn(() => null),
      addSource: vi.fn(),
      removeSource: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      setLayoutProperty: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  })),
}));

vi.mock("@/components/shared/form/xyz-tile-server-input", () => ({
  XYZTileServerInput: ({ tileServerURL, setTileServerURL, buttonOnclick, isValid }: any) => (
    <div data-testid="xyz-input">
      <input
        type="text"
        value={tileServerURL}
        onChange={(e) => setTileServerURL(e.target.value)}
        placeholder="Enter URL"
      />
      <button onClick={buttonOnclick} disabled={!isValid.valid}>
        Apply
      </button>
    </div>
  ),
}));

describe("CustomImageryForm", () => {
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render empty state when URL is empty", () => {
    render(<CustomImageryForm applied={null} onApply={mockOnApply} />);

    expect(screen.getByText("No Imagery to preview")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Once all fields are populated correctly, the imagery will be displayed here",
      ),
    ).toBeInTheDocument();
  });

  it("should render applied initial values if provided", () => {
    render(
      <CustomImageryForm
        applied={{
          tileUrl: "https://example.com/tiles/{z}/{x}/{y}.png",
          tileServiceType: TileServiceType.XYZ,
          bounds: [10, 20, 30, 40],
        }}
        onApply={mockOnApply}
      />,
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("https://example.com/tiles/{z}/{x}/{y}.png");
  });

  it("should validate tile URL and trigger onApply with bounds for XYZ", () => {
    render(<CustomImageryForm applied={null} onApply={mockOnApply} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, {
      target: { value: "https://example.com/tiles/{z}/{x}/{y}.png" },
    });

    const applyButton = screen.getByRole("button", { name: /apply/i });
    fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith({
      tileUrl: "https://example.com/tiles/{z}/{x}/{y}.png",
      tileServiceType: TileServiceType.XYZ,
      bounds: [10, 20, 30, 40],
    });
  });

  it("should pass null bounds for TMS tile service type onApply", () => {
    render(
      <CustomImageryForm
        applied={{
          tileUrl: "https://example.com/tiles/{z}/{x}/{-y}.png",
          tileServiceType: TileServiceType.TMS,
          bounds: null,
        }}
        onApply={mockOnApply}
      />,
    );

    const applyButton = screen.getByRole("button", { name: /apply/i });
    fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith({
      tileUrl: "https://example.com/tiles/{z}/{x}/{-y}.png",
      tileServiceType: TileServiceType.TMS,
      bounds: null,
    });
  });
});
