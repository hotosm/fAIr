import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImageryModalMap } from "@/features/try-fair/hooks/use-imagery-modal-map";
import { createImageryMap } from "@/features/try-fair/components/imagery/imagery-modal-map.layers";

vi.mock(
  "@/features/try-fair/components/imagery/imagery-modal-map.layers",
  () => ({
    createImageryMap: vi.fn(),
  }),
);

describe("useImageryModalMap", () => {
  let mockMapInstance: any;
  let loadCallback: () => void;
  let observerCallback: (entries: any[]) => void;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMapInstance = {
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "load") loadCallback = cb;
      }),
      resize: vi.fn(),
      remove: vi.fn(),
    };

    (createImageryMap as any).mockReturnValue(mockMapInstance);

    (globalThis as any).ResizeObserver = vi.fn().mockImplementation((cb) => {
      observerCallback = cb;
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    });
  });

  it("should initialize with map: null and mapContainerRef", () => {
    const { result } = renderHook(() => useImageryModalMap());
    expect(result.current.map).toBeNull();
    expect(result.current.mapContainerRef.current).toBeNull();
  });

  it("should create map once container has non-zero width and height", () => {
    const container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(container, "clientHeight", {
      value: 400,
      configurable: true,
    });

    const { result, unmount } = renderHook(() => {
      const hook = useImageryModalMap();
      (hook.mapContainerRef as any).current = container;
      return hook;
    });

    // Trigger ResizeObserver
    act(() => {
      observerCallback([{ target: container }]);
    });

    expect(createImageryMap).toHaveBeenCalledWith(container);

    // Simulate map load event
    act(() => {
      loadCallback();
    });

    expect(result.current.map).toBe(mockMapInstance);

    unmount();
    expect(mockMapInstance.remove).toHaveBeenCalled();
  });
});
