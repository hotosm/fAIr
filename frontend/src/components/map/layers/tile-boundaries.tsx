import { GeoJSONSource, Map } from "maplibre-gl";
import { GeoJSONType } from "@/types";
import { getTileBoundariesGeoJSON } from "@/utils";
import { TILE_BOUNDARY_LAYER_ID, TILE_BOUNDARY_SOURCE_ID } from "@/config";
import { useCallback, useEffect } from "react";

export const TileBoundaries = ({ map }: { map: Map | null }) => {
  useEffect(() => {
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
          "line-width": 0.5,
        },
        layout: { visibility: "visible" },
      });
      // It should be moved to the top of the layer stack.
      map.moveLayer(TILE_BOUNDARY_LAYER_ID);
    }
  }, [map]);

  const updateTileBoundary = useCallback(() => {
    if (map && map.getStyle()) {
      if (map.getSource(TILE_BOUNDARY_SOURCE_ID)) {
        const tileBoundaries = getTileBoundariesGeoJSON(
          map,
          // There is a mismatch of 1 in the mag.getZoom() results and the actual zoom level of the map.
          // Adding 1 to the result resolves it.
          Math.round(map.getZoom() + 1),
        );
        const source = map.getSource(TILE_BOUNDARY_SOURCE_ID) as GeoJSONSource;
        source.setData(tileBoundaries as GeoJSONType);
      }
    }
  }, [map]);

  useEffect(() => {
    if (map && map.getStyle()) {
      map.on("moveend", updateTileBoundary);
    }

    return () => {
      if (map && map.getStyle()) {
        map.off("moveend", updateTileBoundary);
      }
    };
  }, [map, updateTileBoundary]);

  return null;
};
