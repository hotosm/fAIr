import { setupMaplibreMap } from "@/components/map/setups/setup-maplibre";
import { setupTerraDraw } from "@/components/map/setups/setup-terra-draw";
import { BASEMAPS, DrawingModes } from "@/enums";
import { MAP_STYLES } from "@/utils";
import { Map } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";


/**
 * useMapInstance - Initializes and manages a MapLibre map instance with TerraDraw integration.
 * 
 * @param {boolean} pmtiles - Optional flag to enable PMTiles support.
 * @returns {Object} - Contains map instance, zoom level, drawing mode, and container ref.
 */
export const useMapInstance = (pmtiles: boolean = false) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(0);
  const [drawingMode, setDrawingMode] = useState<DrawingModes>(
    DrawingModes.STATIC,
  );

  useEffect(() => {
    const map = setupMaplibreMap(mapContainerRef, MAP_STYLES[BASEMAPS.OSM], pmtiles);

    map.on("load", () => {
      setMap(map);
    });
    return () => map.remove();
  }, []);

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

  const updateZoom = useCallback(() => {
    if (!map) return;
    // There is a mismatch of 1 in the mag.getZoom() results and the actual zoom level of the map.
    // Adding 1 to the result resolves it.
    setCurrentZoom(Math.round(map.getZoom()) + 1);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    map.on("zoomend", updateZoom);
    return () => {
      map.off("zoomend", updateZoom);
    };
  }, [map]);

  return {
    mapContainerRef,
    map,
    currentZoom,
    drawingMode,
    setDrawingMode,
    terraDraw,
  };
};
