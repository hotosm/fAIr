import { Map } from "maplibre-gl";
import {
  GOOGLE_SATELLITE_BASEMAP_LAYER_ID,
  GOOGLE_SATELLITE_BASEMAP_SOURCE_ID,
} from "@/config";
import { useMapLayers } from "@/hooks/use-map-layer";

export const GoogleBasemapLayer = ({ map }: { map: Map | null }) => {
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
    map
  );
  // return (
  //   <Source
  //     type="raster"
  //     id={GOOGLE_SATELLITE_BASEMAP_SOURCE_ID}
  //     map={map}
  //     tileSize={256}
  //     attribution="&copy; Google"
  //     tiles={[
  //       "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  //       "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  //       "https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  //       "https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  //     ]}
  //   >
  //     <Layer
  //       source={GOOGLE_SATELLITE_BASEMAP_SOURCE_ID}
  //       type="raster"
  //       id={GOOGLE_SATELLITE_BASEMAP_LAYER_ID}
  //       map={map}
  //       minzoom={0}
  //       maxzoom={22}
  //       layout={{ visibility: "none" }}
  //     />
  //   </Source>
  // );
  return null;
};
