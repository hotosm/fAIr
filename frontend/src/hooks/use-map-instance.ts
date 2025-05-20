import { DrawingModes } from "@/enums";
import { Map } from "maplibre-gl";
import { setupMaplibreMap } from "@/components/map/setups/setup-maplibre";
import { setupTerraDraw } from "@/components/map/setups/setup-terra-draw";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "@/store/map-store";

/**
 * useMapInstance - Initializes and manages a MapLibre map instance with TerraDraw integration.
 *
 * @param {boolean} pmtiles - Optional flag to enable PMTiles support.
 * @returns {Object} - Contains map instance, zoom level, drawing mode, and container ref.
 */
export const useMapInstance = (pmtiles: boolean = false, hash: boolean = false) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<DrawingModes>(
    DrawingModes.STATIC,
  );

  const setZoom = useMapStore((state) => state.setZoom);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = setupMaplibreMap(mapContainerRef, pmtiles, hash);

    map.on("load", () => {
      setMap(map);
      setZoom(Math.round(map.getZoom()) + 1);
    });

    return () => map.remove();
  }, [mapContainerRef]);

  const terraDraw = useMemo(() => {
    if (map) {
      const terraDraw = setupTerraDraw(map);
      terraDraw.start();
      return terraDraw;
    }
  }, [map]);

  // Sync the drawing modes between terraDraw
  // and the application state
  useEffect(() => {
    terraDraw?.setMode(drawingMode);
  }, [terraDraw, drawingMode]);

  useEffect(() => {
    if (!map) return;
    const updateZoom = () => {
      const zoom = Math.round(map.getZoom());
      setZoom(zoom);
    };

    map.on("zoomend", updateZoom);
    return () => {
      map.off("zoomend", updateZoom);
    };
  }, [map, setZoom]);

  return {
    mapContainerRef,
    map,
    drawingMode,
    setDrawingMode,
    terraDraw,
  };
};
