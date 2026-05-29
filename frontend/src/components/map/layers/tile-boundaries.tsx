import { GeoJSONSource, Map } from "maplibre-gl";
import { GeoJSONType } from "@/types";
import { getTileBoundariesGeoJSON } from "@/utils";
import { TILE_BOUNDARY_LAYER_ID, TILE_BOUNDARY_SOURCE_ID } from "@/config";
import { useCallback, useEffect } from "react";

export const TileBoundaries = ({ map }: { map: Map | null }) => {
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
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            16,
            0.8,
            20,
            1.2,
            22,
            1.5,
          ],
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
      const tileBoundaries = getTileBoundariesGeoJSON(
        map,
        Math.max(0, Math.floor(map.getZoom())),
      );
      const source = map.getSource(TILE_BOUNDARY_SOURCE_ID) as GeoJSONSource;
      source.setData(tileBoundaries as GeoJSONType);
    }
  }, [map, ensureTileBoundaryLayer]);

  useEffect(() => {
    if (!map) return;

    updateTileBoundary();
    map.on("move", updateTileBoundary);
    map.on("zoom", updateTileBoundary);
    map.on("styledata", updateTileBoundary);

    return () => {
      map.off("move", updateTileBoundary);
      map.off("zoom", updateTileBoundary);
      map.off("styledata", updateTileBoundary);
    };
  }, [map, updateTileBoundary]);

  return null;
};
