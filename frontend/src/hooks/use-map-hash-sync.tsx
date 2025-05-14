import { useRef, useEffect } from "react";
import type { Map } from "maplibre-gl";

type UseInitialHashFitResult = {
  hadHashOnLoad: boolean;
};

/**
 * On first mount:
 * - if there is a hash (#zoom/lat/lng) → immediately jumpTo() that view
 * - otherwise → fitBounds(aoiBounds)
 *
 * MapLibre’s own `hash: true` stays enabled, so after this point
 * every pan/zoom will update the URL automatically.
 */
export function useInitialHashFit(map: Map | null): UseInitialHashFitResult {
  const initialHash = useRef(window.location.hash);

  useEffect(() => {
    if (!map) return;

    const hash = initialHash.current.slice(1);
    if (hash) {
      const [zStr, latStr, lngStr] = hash.split("/");
      const z = parseFloat(zStr);
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(z) && !isNaN(lat) && !isNaN(lng)) {
        map.flyTo({ center: [lng, lat], zoom: z });
        return;
      }
    }
  }, [map]);

  return { hadHashOnLoad: initialHash.current.length > 0 };
}
