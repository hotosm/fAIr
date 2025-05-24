import {
  Map,
  RasterLayerSpecification,
  RasterSourceSpecification,
} from "maplibre-gl";
import { TILE_BOUNDARY_LAYER_ID, TMS_LAYER_ID, TMS_SOURCE_ID } from "@/config";
import { useDynamicMapLayer } from "@/hooks/use-map-layer";
import { useMemo } from "react";

export const OpenAerialMap = ({
  tileJSONURL,
  map,
}: {
  tileJSONURL?: string;
  map: Map | null;
}) => {
  const sourceSpec: RasterSourceSpecification = useMemo(
    () => ({
      type: "raster",
      url: tileJSONURL,
      tileSize: 256,
    }),
    [tileJSONURL],
  );

  const layerSpec: RasterLayerSpecification = useMemo(
    () => ({
      id: TMS_LAYER_ID,
      type: "raster",
      source: TMS_SOURCE_ID,
      layout: { visibility: "visible" },
    }),
    [TMS_LAYER_ID, TMS_SOURCE_ID],
  );

  useDynamicMapLayer(
    map,
    TMS_SOURCE_ID,
    TMS_LAYER_ID,
    sourceSpec,
    layerSpec,
    [],
    tileJSONURL !== undefined && tileJSONURL?.length > 0,
    /**
     * Place the aerial imagery below the tile boundary layer.
     */
    [TILE_BOUNDARY_LAYER_ID],
  );
  return null;
};
