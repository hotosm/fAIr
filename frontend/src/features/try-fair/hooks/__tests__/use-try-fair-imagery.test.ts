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
  const createMockMap = () => ({
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    once: vi.fn(),
    off: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useStartMappingStore.setState({
      currentModelType: ModelType.DEMO,
      selectedImagery: null,
    });
  });

  it("should return default tileServiceUrl and fallback imagery center in DEMO mode", () => {
    const mockMap = createMockMap();
    const { result, unmount } = renderHook(() =>
      useTryFairImagery({
        map: mockMap as any,
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
    const mockMap = createMockMap();
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
        map: mockMap as any,
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
    const mockMap = createMockMap();
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
        map: mockMap as any,
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
    const mockMap = createMockMap();
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
        map: mockMap as any,
        selectedModel: null,
        mode: ModelType.IMAGERY,
        imageryUrl: "https://tms.example.com/{z}/{x}/{-y}.png",
        imageryTileServiceType: TileServiceType.TMS,
        oamItemId: null,
      }),
    );

    expect(result.current.imageryCenter).toBeUndefined();
    expect(mockMap.flyTo).not.toHaveBeenCalled();
    expect(mockMap.fitBounds).not.toHaveBeenCalled();
    unmount();
  });

  it("should trigger map.fitBounds when imageryBounds are present and not TMS", () => {
    const mockMap = createMockMap();
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

    const { unmount } = renderHook(() =>
      useTryFairImagery({
        map: mockMap as any,
        selectedModel: null,
        mode: ModelType.IMAGERY,
        imageryUrl: null,
        imageryTileServiceType: null,
        oamItemId: "oam-item-1",
      }),
    );

    expect(mockMap.fitBounds).toHaveBeenCalledWith([-10, 5, 20, 15], {
      padding: 40,
      duration: 0,
      essential: true,
    });
    unmount();
  });
});
