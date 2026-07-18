import maplibregl, { Map } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { BASEMAPS } from "@/enums";
import { MAP_STYLES, MAX_ZOOM_LEVEL } from "@/config";

/**
 * A lightweight MapLibre instance for maps rendered inside dialogs — no
 * TerraDraw, no global zoom store, no URL hash syncing. The map is created
 * when the container mounts and destroyed when it unmounts, so it plays well
 * with dialogs that mount/unmount their content.
 */
export const useModalMap = ({
  center = [0, 0],
  zoom = 1,
}: {
  center?: [number, number];
  zoom?: number;
} = {}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[BASEMAPS.OSM],
      center,
      zoom,
      minZoom: 1,
      maxZoom: MAX_ZOOM_LEVEL,
      pitchWithRotate: false,
      attributionControl: false,
    });

    mapInstance.on("load", () => {
      setMap(mapInstance);
      // Dialog animations can resize the container after mount.
      mapInstance.resize();
    });

    return () => {
      setMap(null);
      mapInstance.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapContainerRef]);

  return { map, mapContainerRef };
};
