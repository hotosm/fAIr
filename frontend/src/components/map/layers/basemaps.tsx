import { useMapLayers } from "@/hooks/use-map-layer";
import {
  GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
  GOOGLE_SATELLITE_BASEMAP_SOURCE_ID,
} from "@/utils";
import { Map } from "maplibre-gl";

export const Basemaps = ({ map }: { map: Map | null }) => {
  useMapLayers(
    [
      {
        id: GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
        type: "raster",
        source: GOOGLE_SATELLITE_BASEMAP_SOURCE_ID,
        layout: { visibility: "none" },
        minzoom: 0,
        maxzoom: 22,
      },
    ],
    [
      {
        id: GOOGLE_SATELLITE_BASEMAP_SOURCE_ID,
        spec: {
          type: "raster",
          tiles: [
            "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            "https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            "https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
          ],
          attribution: "&copy; Google",
          tileSize: 256,
        },
      },
    ],
    map,
  );

  return null;
};
