import { GeoJSONSource, Map } from 'maplibre-gl';
import { GeoJSONType } from '@/types';
import { getTileBoundariesGeoJSON } from '@/utils';
import { TILE_BOUNDARY_LAYER_ID, TILE_BOUNDARY_SOURCE_ID } from '@/constants';
import { useCallback, useEffect } from 'react';
import { useMapLayers } from '@/hooks/use-map-layer';

export const TileBoundaries = ({ map }: { map: Map | null }) => {
  useMapLayers(
    [
      {
        id: TILE_BOUNDARY_LAYER_ID,
        type: "line",
        source: TILE_BOUNDARY_SOURCE_ID,
        paint: {
          "line-color": "#FFF",
          "line-width": 0.5,
        },
        layout: { visibility: "visible" },
      },
    ],
    [
      {
        id: TILE_BOUNDARY_SOURCE_ID,
        spec: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
      },
    ],
    map,
  );

  const updateTileBoundary = useCallback(() => {
    if (map) {
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
    if (!map) return;
    map.on("moveend", updateTileBoundary);
    return () => {
      map.off("moveend", updateTileBoundary);
    };
  }, [map, updateTileBoundary]);

  return null;
};
