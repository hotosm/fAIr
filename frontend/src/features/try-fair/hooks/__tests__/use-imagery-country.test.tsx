import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImageryCountry } from "@/features/try-fair/hooks/use-imagery-country";
import { reverseGeocodeCountry } from "@/features/try-fair/api/hot-imagery";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/try-fair/api/hot-imagery", () => ({
  reverseGeocodeCountry: vi.fn(),
}));

describe("useImageryCountry", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should return null without calling reverseGeocodeCountry if bounds are null or undefined", () => {
    const { result } = renderHook(() => useImageryCountry(null), { wrapper });
    expect(result.current).toBeNull();
    expect(reverseGeocodeCountry).not.toHaveBeenCalled();
  });

  it("should calculate center coordinates and return geocoded country result", async () => {
    const mockCountryResult = {
      country: "Kenya",
      countryCode: "KE",
    };

    (reverseGeocodeCountry as any).mockResolvedValue(mockCountryResult);

    const bounds: [number, number, number, number] = [36.7, -1.3, 37.1, -0.9];
    const { result } = renderHook(() => useImageryCountry(bounds), { wrapper });

    await waitFor(() => expect(result.current).toEqual(mockCountryResult));

    // Midpoint: (36.7 + 37.1) / 2 = 36.9, (-1.3 + -0.9) / 2 = -1.1
    expect(reverseGeocodeCountry).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(AbortSignal),
    );
  });
});
