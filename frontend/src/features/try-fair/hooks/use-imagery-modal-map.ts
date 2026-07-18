import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap } from "maplibre-gl";
import { createImageryMap } from "@/features/try-fair/components/imagery/imagery-modal-map.layers";

/**
 * Creates the MapLibre instance for the imagery/location dialog and returns it
 * (once loaded) together with the container ref to hand to `MapComponent`.
 *
 * Deliberately NOT the app-wide `useMapInstance`: that hook starts TerraDraw and
 * writes zoom into the global map store shared with the main try-fAIr map, so a
 * second instance in the dialog would fight it. This one stays isolated.
 *
 * The dialog animates open, so the container can still be zero-width on the
 * first run; MapLibre never fires `load` for a zero-size map, so we wait for a
 * real size (ResizeObserver) before creating it, then keep it resized.
 */
export const useImageryModalMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let instance: MapLibreMap | undefined;
    let disposed = false;

    const createOnce = () => {
      if (instance) return;
      instance = createImageryMap(container);
      instance.on("load", () => {
        if (!disposed && instance) setMap(instance);
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      if (disposed || !container.clientWidth || !container.clientHeight) return;
      if (instance) instance.resize();
      else createOnce();
    });
    resizeObserver.observe(container);
    if (container.clientWidth && container.clientHeight) createOnce();

    return () => {
      disposed = true;
      setMap(null);
      resizeObserver.disconnect();
      instance?.remove();
    };
  }, []);

  return { map, mapContainerRef };
};
