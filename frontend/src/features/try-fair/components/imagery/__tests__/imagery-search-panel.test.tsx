import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OAMImageryPanel } from "@/features/try-fair/components/imagery/imagery-search-panel";
import { OAMImageryItem } from "@/features/try-fair/api/hot-imagery";

describe("OAMImageryPanel", () => {
  const mockImages: OAMImageryItem[] = [
    {
      id: "img-1",
      bbox: [10, 20, 30, 40],
      geometry: { type: "Polygon", coordinates: [] },
      title: "Nairobi High Res",
      provider: "HOT Kenya",
      gsd: 0.25, // 25 cm
      acquiredAt: "2024-06-15T00:00:00Z",
      license: "CC-BY",
      platform: "uav",
      thumbnailUrl: "https://example.com/thumb1.png",
      assetName: "visual",
    },
    {
      id: "img-2",
      bbox: [0, 0, 5, 5],
      geometry: { type: "Polygon", coordinates: [] },
      title: "Mombasa Survey",
      provider: "Red Cross",
      gsd: 1.5, // 1.5 m
      acquiredAt: null,
      license: null,
      platform: null,
      thumbnailUrl: null, // No preview
      assetName: "visual",
    },
  ];

  const defaultProps = {
    cellSelected: true,
    images: mockImages,
    loading: false,
    selectedItem: null,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    handleApplyOAMItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render nothing when cellSelected is false", () => {
    const { container } = render(
      <OAMImageryPanel {...defaultProps} cellSelected={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should show loading state when loading is true", () => {
    render(<OAMImageryPanel {...defaultProps} loading={true} images={[]} />);
    expect(screen.getByText("Loading images…")).toBeInTheDocument();
  });

  it("should render images list with formatted GSD and date", () => {
    render(<OAMImageryPanel {...defaultProps} />);

    expect(screen.getByText("2 images in this area")).toBeInTheDocument();
    expect(screen.getByText("Nairobi High Res")).toBeInTheDocument();
    expect(screen.getByText("Mombasa Survey")).toBeInTheDocument();
    expect(screen.getByText("HOT Kenya")).toBeInTheDocument();

    // GSD formatting: 0.25m -> 25 cm, 1.5m -> 1.5 m
    expect(screen.getByText(/25 cm/)).toBeInTheDocument();
    expect(screen.getByText(/1\.5 m/)).toBeInTheDocument();

    // Thumbnail vs No preview fallback
    expect(screen.getByAltText("Nairobi High Res")).toBeInTheDocument();
    expect(screen.getByText("No preview")).toBeInTheDocument();
  });

  it("should render empty state when no images are present in area", () => {
    render(<OAMImageryPanel {...defaultProps} images={[]} />);
    expect(
      screen.getByText("No imagery available in this area."),
    ).toBeInTheDocument();
  });

  it("should disable Use this image button when no image is selected", () => {
    render(<OAMImageryPanel {...defaultProps} selectedItem={null} />);
    expect(screen.getByText("Select an image first")).toBeInTheDocument();
  });

  it("should enable Use this image button and fire handleApplyOAMItem when image is selected", () => {
    const handleApply = vi.fn();
    render(
      <OAMImageryPanel
        {...defaultProps}
        selectedItem={mockImages[0]}
        handleApplyOAMItem={handleApply}
      />,
    );

    expect(screen.queryByText("Select an image first")).not.toBeInTheDocument();

    const button = screen.getByText("Use this image");
    fireEvent.click(button);
    expect(handleApply).toHaveBeenCalled();
  });

  it("should trigger onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<OAMImageryPanel {...defaultProps} onClose={handleClose} />);

    const closeButton = screen.getAllByRole("button", { name: /close/i })[0];
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });
});
