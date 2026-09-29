import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTryFairImagery } from "@/features/try-fair/hooks/use-try-fair-imagery";
import { ImagerySource, ModelType, TileServiceType } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { FALLBACK_FAIR_IMAGERY_CENTER } from "@/features/try-fair/utils/common";

vi.mock("@/hooks/use-tileservice", () => ({
  useTileservice: vi.fn(() => ({
    tileserverURL: "https://tiles.example.com/{z}/{x}/{y}.png",
    setTileserverURL: vi.fn(),
    setTileServiceType: vi.fn(),
    loading: false,
    tileJSONMetadata: null,
    tileServiceTypeValidity: { valid: true },
  })),
}));

vi.mock("../use-oam-item", () => ({
  useOAMItem: vi.fn(() => ({ item: null, loading: false, error: false })),
}));

describe("useTryFairImagery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStartMappingStore.setState({
      currentModelType: ModelType.DEMO,
      selectedImagery: null,
    });
  });

  it("should return default tileServiceUrl and fallback imagery center in DEMO mode", () => {
    const { result, unmount } = renderHook(() =>
      useTryFairImagery({
        selectedModel: null,
        mode: ModelType.DEMO,
        imageryUrl: null,
        imageryTileServiceType: null,
        oamItemId: null,
      }),
    );

    expect(result.current.currentModelType).toBe(ModelType.DEMO);
    expect(result.current.imageryCenter).toEqual(FALLBACK_FAIR_IMAGERY_CENTER);
    expect(result.current.imageryBounds).toBeNull();
    unmount();
  });

  it("should use the selected model's fair:preview center if available", () => {
    const mockModel: any = {
      properties: {
        "fair:preview": {
          center: [10.5, 45.2],
          zoom: { recommended: 18 },
          imagery: { url: "https://tiles.example.com/{z}/{x}/{y}" },
        },
      },
    };

    const { result, unmount } = renderHook(() =>
      useTryFairImagery({
        selectedModel: mockModel,
        mode: ModelType.DEMO,
        imageryUrl: null,
        imageryTileServiceType: null,
        oamItemId: null,
      }),
    );

    expect(result.current.imageryCenter).toEqual([10.5, 45.2]);
    unmount();
  });

  it("should compute center from selectedImagery bounds in IMAGERY mode", () => {
    useStartMappingStore.setState({
      currentModelType: ModelType.IMAGERY,
      selectedImagery: {
        source: ImagerySource.CUSTOM,
        tileUrl: "https://tiles.example.com/{z}/{x}/{y}.png",
        tileServiceType: TileServiceType.XYZ,
        bounds: [10, 20, 30, 40],
      },
    });

    const { result, unmount } = renderHook(() =>
      useTryFairImagery({
        selectedModel: null,
        mode: ModelType.IMAGERY,
        imageryUrl: null,
        imageryTileServiceType: TileServiceType.XYZ,
        oamItemId: null,
      }),
    );

    expect(result.current.imageryCenter).toEqual([20, 30]); // (10+30)/2, (20+40)/2
    expect(result.current.imageryBounds).toEqual([10, 20, 30, 40]);
    unmount();
  });

  it("should return undefined imageryCenter when isCustomTMSImagery is true", () => {
    useStartMappingStore.setState({
      currentModelType: ModelType.IMAGERY,
      selectedImagery: {
        source: ImagerySource.CUSTOM,
        tileUrl: "https://tms.example.com/{z}/{x}/{-y}.png",
        tileServiceType: TileServiceType.TMS,
        bounds: null,
      },
    });

    const { result, unmount } = renderHook(() =>
      useTryFairImagery({
        selectedModel: null,
        mode: ModelType.IMAGERY,
        imageryUrl: "https://tms.example.com/{z}/{x}/{-y}.png",
        imageryTileServiceType: TileServiceType.TMS,
        oamItemId: null,
      }),
    );

    // TMS has no reliable extent, so the grid/camera stays put — the hook
    // reports no center to fit to.
    expect(result.current.imageryCenter).toBeUndefined();
    unmount();
  });

  it("should expose OAM bounds and an XYZ prediction URL (not the tilejson URL)", () => {
    const mockOamItem: any = {
      id: "oam-item-1",
      bbox: [-10, 5, 20, 15],
      geometry: { type: "Polygon", coordinates: [] },
      title: "OAM Image",
      provider: "HOT",
      gsd: 0.5,
      acquiredAt: "2024-01-01",
      license: "CC-BY",
      platform: "drone",
      thumbnailUrl: null,
      assetName: "visual",
    };

    useStartMappingStore.setState({
      currentModelType: ModelType.IMAGERY,
      selectedImagery: {
        source: ImagerySource.OPEN_AERIAL_MAP,
        item: mockOamItem,
        tileUrl: "https://oam.example.com/tiles/{z}/{x}/{y}.png",
        bounds: [-10, 5, 20, 15],
      },
    });

    const { result, unmount } = renderHook(() =>
      useTryFairImagery({
        selectedModel: null,
        mode: ModelType.IMAGERY,
        imageryUrl: null,
        imageryTileServiceType: null,
        oamItemId: "oam-item-1",
      }),
    );

    expect(result.current.imageryBounds).toEqual([-10, 5, 20, 15]);
    // The backend must receive the raster XYZ template, never the tilejson URL.
    expect(result.current.predictionImageUri).toContain(
      "/items/oam-item-1/tiles/WebMercatorQuad/{z}/{x}/{y}",
    );
    expect(result.current.predictionImageUri).toContain("assets=visual");
    expect(result.current.predictionImageUri).not.toContain("tilejson");
    // 3-band RGB for the model; an alpha band (from nodata=0) breaks it.
    expect(result.current.predictionImageUri).toContain("format=jpeg");
    expect(result.current.predictionImageUri).not.toContain("nodata");
    unmount();
  });
});
