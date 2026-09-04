import { GeoJSONSource, Map } from "maplibre-gl";
import { GeoJSONType } from "@/types";
import { getTileBoundariesGeoJSON } from "@/utils";
import { TILE_BOUNDARY_LAYER_ID, TILE_BOUNDARY_SOURCE_ID } from "@/config";
import { useCallback, useEffect, useRef } from "react";

type TileBoundariesProps = {
  map: Map | null;
  /**
   * Tile zoom to draw boundaries at. When omitted, boundaries follow the
   * current map zoom (the default behaviour).
   *
   * When provided, boundaries are drawn at exactly this zoom so they align
   * 1:1 with an overlay built at the same tile zoom (e.g. the try-fAIr
   * draggable grid). `getTileBoundariesGeoJSON` caps the number of generated
   * tiles, so if the map is zoomed far enough out that this zoom would span a
   * huge area, it simply draws nothing instead of freezing.
   */
  zoom?: number;
};

export const TileBoundaries = ({ map, zoom }: TileBoundariesProps) => {
  const rafIdRef = useRef<number | null>(null);

  const ensureTileBoundaryLayer = useCallback(() => {
    if (!map || !map.getStyle()) return;

    if (!map.getSource(TILE_BOUNDARY_SOURCE_ID)) {
      map.addSource(TILE_BOUNDARY_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer(TILE_BOUNDARY_LAYER_ID)) {
      map.addLayer({
        id: TILE_BOUNDARY_LAYER_ID,
        type: "line",
        source: TILE_BOUNDARY_SOURCE_ID,
        paint: {
          "line-color": "#FFF",
          "line-opacity": 0.3,
          "line-width": ["interpolate", ["linear"], ["zoom"], 16, 0.8, 20, 1.2, 22, 1.5],
        },
        layout: { visibility: "visible" },
      });
    }

    // Keep tile boundaries above newly added layers.
    map.moveLayer(TILE_BOUNDARY_LAYER_ID);
  }, [map]);

  useEffect(() => {
    ensureTileBoundaryLayer();
  }, [ensureTileBoundaryLayer]);

  const updateTileBoundary = useCallback(() => {
    if (!map || !map.getStyle()) return;

    ensureTileBoundaryLayer();

    if (map.getSource(TILE_BOUNDARY_SOURCE_ID)) {
      // Draw at the requested (grid) zoom so the boundaries align 1:1 with the
      // grid cells; fall back to the current map zoom when no zoom is given.
      const boundaryZoom = zoom ?? Math.max(0, Math.floor(map.getZoom()));
      const tileBoundaries = getTileBoundariesGeoJSON(map, boundaryZoom);
      const source = map.getSource(TILE_BOUNDARY_SOURCE_ID) as GeoJSONSource;
      source.setData(tileBoundaries as GeoJSONType);
    }
  }, [map, ensureTileBoundaryLayer, zoom]);

  useEffect(() => {
    if (!map) return;

    // Throttle regeneration to one update per animation frame — `move` can fire
    // many times per frame while panning, and we now generate far more tiles
    // (at the grid's zoom rather than the map's).
    const scheduleUpdate = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        updateTileBoundary();
      });
    };

    updateTileBoundary();
    map.on("move", scheduleUpdate);
    map.on("zoom", scheduleUpdate);
    map.on("styledata", scheduleUpdate);

    return () => {
      map.off("move", scheduleUpdate);
      map.off("zoom", scheduleUpdate);
      map.off("styledata", scheduleUpdate);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [map, updateTileBoundary]);

  return null;
};
