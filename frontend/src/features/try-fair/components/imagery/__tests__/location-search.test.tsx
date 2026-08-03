import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationSearch } from "@/features/try-fair/components/imagery/location-search";
import { geocodeSuggestions } from "@/features/try-fair/api/hot-imagery";

vi.mock("@/features/try-fair/api/hot-imagery", () => ({
  geocodeSuggestions: vi.fn(),
}));

describe("LocationSearch", () => {
  const mockOnPick = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("should render search input and placeholder", () => {
    render(
      <LocationSearch
        onPick={mockOnPick}
        onClear={mockOnClear}
        onClose={mockOnClose}
      />,
    );

    expect(
      screen.getByPlaceholderText("Search for a place to map"),
    ).toBeInTheDocument();
  });

  it("should fetch geocode suggestions after debounced query input", async () => {
    const mockSuggestions = [
      {
        displayName: "Nairobi, Kenya",
        bbox: [36.7, -1.3, 37.1, -0.9],
        lat: -1.28,
        lon: 36.82,
      },
    ];

    (geocodeSuggestions as any).mockResolvedValue(mockSuggestions);

    render(
      <LocationSearch
        onPick={mockOnPick}
        onClear={mockOnClear}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByPlaceholderText("Search for a place to map");
    fireEvent.change(input, { target: { value: "Nairobi" } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(geocodeSuggestions).toHaveBeenCalledWith(
      "Nairobi",
      5,
      expect.any(AbortSignal),
    );
    expect(screen.getByText("Nairobi, Kenya")).toBeInTheDocument();
  });

  it("should select suggestion on click and fire onPick", async () => {
    const mockSuggestions = [
      {
        displayName: "Nairobi, Kenya",
        bbox: [36.7, -1.3, 37.1, -0.9],
        lat: -1.28,
        lon: 36.82,
      },
    ];

    (geocodeSuggestions as any).mockResolvedValue(mockSuggestions);

    render(
      <LocationSearch
        onPick={mockOnPick}
        onClear={mockOnClear}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByPlaceholderText("Search for a place to map");
    fireEvent.change(input, { target: { value: "Nairobi" } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    const suggestion = screen.getByText("Nairobi, Kenya");
    fireEvent.click(suggestion);

    expect(mockOnPick).toHaveBeenCalledWith(mockSuggestions[0]);
    expect(input).toHaveValue("Nairobi, Kenya");
  });

  it("should clear search and fire onClear and onClose when clear button is clicked", () => {
    render(
      <LocationSearch
        onPick={mockOnPick}
        onClear={mockOnClear}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByPlaceholderText("Search for a place to map");
    fireEvent.change(input, { target: { value: "Nairobi" } });

    const clearButton = screen.getByText("clear");
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
    expect(mockOnClear).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
