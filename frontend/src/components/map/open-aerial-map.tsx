import { useMapLayers } from "@/hooks/use-map-layer";
import { TMS_LAYER_ID, TMS_SOURCE_ID } from "@/utils";

export const OpenAerialMap = ({ tileJSONURL }: { tileJSONURL?: string }) => {
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
  );
  return null;
};
