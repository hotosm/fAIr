import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBreakpoint } from "../use-break-point";
// test/utils/mockMatchMedia.ts
export const createMatchMedia = (matchesMap: Record<string, boolean>) => {
  const mqlMap = new Map<string, any>();

  return (query: string): MediaQueryList => {
    if (mqlMap.has(query)) {
      return mqlMap.get(query);
    }

    const listeners: Array<(e: MediaQueryListEvent) => void> = [];

    const mql: MediaQueryList = {
      media: query,

      get matches() {
        return matchesMap[query] ?? false;
      },

      onchange: null,

      addEventListener: (_: string, listener: any) => {
        listeners.push(listener);
      },

      removeEventListener: (_: string, listener: any) => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      },

      dispatchEvent: (event: MediaQueryListEvent) => {
        listeners.forEach((l) => l(event));
        return true;
      },
    } as MediaQueryList;

    mqlMap.set(query, mql);
    return mql;
  };
};

describe("useBreakpoint", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should default to mobile when no breakpoints match", () => {
    vi.stubGlobal(
      "matchMedia",
      createMatchMedia({
        "(min-width: 1536px)": false,
        "(min-width: 1280px)": false,
        "(min-width: 1024px)": false,
        "(min-width: 768px)": false,
        "(min-width: 640px)": false,
      }),
    );

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.breakpoint).toBe("mobile");
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should resolve to lg when lg media query matches", () => {
    vi.stubGlobal(
      "matchMedia",
      createMatchMedia({
        "(min-width: 1536px)": false,
        "(min-width: 1280px)": false,
        "(min-width: 1024px)": true,
        "(min-width: 768px)": true,
        "(min-width: 640px)": true,
      }),
    );

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.breakpoint).toBe("lg");
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isAbove("md")).toBe(true);
    expect(result.current.isBelow("xl")).toBe(true);
  });

  it("should update breakpoint when media query changes", () => {
    const currentMatches: Record<string, boolean> = {
      "(min-width: 1536px)": false,
      "(min-width: 1280px)": false,
      "(min-width: 1024px)": true,
      "(min-width: 768px)": true,
      "(min-width: 640px)": true,
    };

    const matchMedia = createMatchMedia(currentMatches);
    vi.stubGlobal("matchMedia", matchMedia);

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.breakpoint).toBe("lg");

    // Simulate resize → lg no longer matches
    currentMatches["(min-width: 1024px)"] = false;

    act(() => {
      window
        .matchMedia("(min-width: 1024px)")
        .dispatchEvent(new Event("change") as MediaQueryListEvent);
    });

    expect(result.current.breakpoint).toBe("md");
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isTablet).toBe(true);
  });

  it("should clean up media query listeners on unmount", () => {
    const addSpy = vi.fn();
    const removeSpy = vi.fn();

    vi.stubGlobal("matchMedia", (query: string) => {
      return {
        media: query,
        matches: false,
        addEventListener: addSpy,
        removeEventListener: removeSpy,
      } as unknown as MediaQueryList;
    });

    const { unmount } = renderHook(() => useBreakpoint());

    unmount();

    expect(removeSpy).toHaveBeenCalled();
  });
});
