import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOAMItem } from "@/features/try-fair/hooks/use-oam-item";
import axios from "axios";

vi.mock("axios");

describe("useOAMItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return item: null, loading: false, error: false when itemId is null", () => {
    const { result } = renderHook(() => useOAMItem(null));
    expect(result.current).toEqual({
      item: null,
      loading: false,
      error: false,
    });
  });

  it("should fetch and normalize raw STAC item to OAMImageryItem on success", async () => {
    const mockRawStacItem = {
      id: "oam-123",
      bbox: [10, 20, 30, 40],
      geometry: { type: "Polygon", coordinates: [] },
      assets: {
        visual: { href: "https://example.com/visual.tif" },
        thumbnail: { href: "https://example.com/thumb.png" },
      },
      properties: {
        title: "Test Imagery",
        "oam:producer_name": "HOT OSM",
        gsd: 0.3,
        end_datetime: "2024-05-10T00:00:00Z",
        license: "CC-BY-4.0",
        "oam:platform_type": "UAV",
      },
    };

    (axios.get as any).mockResolvedValue({ data: mockRawStacItem });

    const { result } = renderHook(() => useOAMItem("oam-123"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(false);
    expect(result.current.item).toEqual({
      id: "oam-123",
      bbox: [10, 20, 30, 40],
      geometry: { type: "Polygon", coordinates: [] },
      title: "Test Imagery",
      provider: "HOT OSM",
      gsd: 0.3,
      acquiredAt: "2024-05-10T00:00:00Z",
      license: "CC-BY-4.0",
      platform: "UAV",
      thumbnailUrl: "https://example.com/thumb.png",
      assetName: "visual",
    });
  });

  it("should handle fallbacks for missing properties", async () => {
    const mockRawStacItem = {
      id: "oam-456",
      bbox: [0, 0, 10, 10],
      geometry: { type: "Polygon", coordinates: [] },
      assets: {
        rgb: { href: "https://example.com/rgb.tif" },
      },
      properties: {
        providers: [{ name: "Provider Name" }],
        created: "2023-01-01T00:00:00Z",
      },
    };

    (axios.get as any).mockResolvedValue({ data: mockRawStacItem });

    const { result } = renderHook(() => useOAMItem("oam-456"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.item?.title).toBe("Untitled Image");
    expect(result.current.item?.provider).toBe("Provider Name");
    expect(result.current.item?.acquiredAt).toBe("2023-01-01T00:00:00Z");
    expect(result.current.item?.assetName).toBe("rgb");
    expect(result.current.item?.thumbnailUrl).toBeNull();
  });

  it("should handle API errors", async () => {
    (axios.get as any).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useOAMItem("invalid-id"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.item).toBeNull();
  });
});
