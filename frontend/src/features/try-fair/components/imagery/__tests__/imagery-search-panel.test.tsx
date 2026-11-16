import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";

// jsdom has no layout, so framer-motion's (shared layout) animations never
// finish here: render motion elements as plain ones.
vi.mock("framer-motion", () => {
  const motionKeys = ["layoutId", "initial", "animate", "exit", "transition"];
  const strip = <P extends object>(props: P) =>
    Object.fromEntries(
      Object.entries(props).filter(([key]) => !motionKeys.includes(key)),
    ) as P;
  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: {
      div: (props: ComponentProps<"div">) => <div {...strip(props)} />,
      img: (props: ComponentProps<"img">) => <img {...strip(props)} />,
    },
  };
});
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

  it("collapses results for a preview and expands them for a new area", () => {
    const { rerender } = render(<OAMImageryPanel expanded {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /^Nairobi High Res/ }));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockImages[0]);
    expect(
      screen.getByRole("button", { name: "Expand imagery results" }),
    ).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(
      screen.getByRole("button", { name: "Expand imagery results" }),
    );
    expect(
      screen.getByRole("button", { name: "Collapse imagery results" }),
    ).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse imagery results" }),
    );
    rerender(
      <OAMImageryPanel expanded {...defaultProps} images={[mockImages[1]]} />,
    );
    expect(
      screen.getByRole("button", { name: "Collapse imagery results" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
  it("opens a large preview from the expand button, without selecting", async () => {
    render(<OAMImageryPanel {...defaultProps} />);
    // Only images with a preview can be expanded.
    expect(
      screen.queryByRole("button", { name: "Expand image Mombasa Survey" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand image Nairobi High Res" }),
    );
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
    const preview = screen.getByRole("dialog", { name: "Nairobi High Res" });
    expect(
      within(preview).getByAltText("Nairobi High Res"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Close image preview" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Nairobi High Res" }),
      ).not.toBeInTheDocument(),
    );
  });
});
