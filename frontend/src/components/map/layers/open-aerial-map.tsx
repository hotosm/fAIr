import { useMapLayers } from "@/hooks/use-map-layer";
import { TMS_LAYER_ID, TMS_SOURCE_ID } from "@/constants";
import { Map } from "maplibre-gl";

export const OpenAerialMap = ({
  tileJSONURL,
  map,
}: {
  tileJSONURL?: string;
  map: Map | null;
}) => {
  useMapLayers(
    [
      {
        id: TMS_LAYER_ID,
        type: "raster",
        source: TMS_SOURCE_ID,
        layout: { visibility: "visible" },
      },
    ],
    [
      {
        id: TMS_SOURCE_ID,
        spec: {
          type: "raster",
          url: tileJSONURL,
          tileSize: 256,
        },
      },
    ],
    map,
  );
  return null;
};
