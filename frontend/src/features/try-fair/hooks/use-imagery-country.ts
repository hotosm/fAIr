import { useQuery } from "@tanstack/react-query";
import { BBOX } from "@/types";
import {
  CountryResult,
  reverseGeocodeCountry,
} from "@/features/try-fair/api/hot-imagery";

/**
 * Reverse-geocodes an imagery's center (from its bounds) to a country via
 * TanStack Query. Keyed on the center coordinate, so the Nominatim lookup is
 * cached and de-duplicated across renders and picker re-opens; a location's
 * country never changes, so it never goes stale.
 */
export const useImageryCountry = (
  bounds: BBOX | null | undefined,
): CountryResult | null => {
  const center = bounds
    ? [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]
    : null;

  const { data } = useQuery({
    queryKey: ["imagery-country", center?.[0], center?.[1]],
    queryFn: ({ signal }) =>
      reverseGeocodeCountry(center![0], center![1], signal),
    enabled: !!center,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return data ?? null;
};
