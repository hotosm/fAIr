import { DrawingModes } from "@/enums";
import { Map } from "maplibre-gl";
import { setupMaplibreMap } from "@/components/map/setups/setup-maplibre";
import {
  setupTerraDraw,
  TerraDrawStyleVariant,
} from "@/components/map/setups/setup-terra-draw";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "@/store/map-store";

/**
 * useMapInstance - Initializes and manages a MapLibre map instance with TerraDraw integration.
 *
 * @param {boolean} pmtiles - Optional flag to enable PMTiles support.
 * @param {boolean} hash - Optional flag to enable URL location hash.
 * @param {TerraDrawStyleVariant} styleVariant - Optional drawing style variant ("default" | "red"). Defaults to "red".
 * @returns {Object} - Contains map instance, zoom level, drawing mode, and container ref.
 */
export const useMapInstance = (
  pmtiles: boolean = false,
  hash: boolean = false,
  styleVariant: TerraDrawStyleVariant = "default",
) => {
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
      setZoom(Math.floor(map.getZoom()));
    });

    return () => map.remove();
  }, [mapContainerRef]);

  const terraDraw = useMemo(() => {
    if (map) {
      const draw = setupTerraDraw(map, styleVariant);
      draw.start();
      return draw;
    }
  }, [map, styleVariant]);

  // Sync the drawing modes between terraDraw
  // and the application state
  useEffect(() => {
    if (!terraDraw) return;
    terraDraw?.setMode(drawingMode);
  }, [terraDraw, drawingMode]);

  useEffect(() => {
    if (!map) return;
    const updateZoom = () => {
      setZoom(Math.floor(map.getZoom()));
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
