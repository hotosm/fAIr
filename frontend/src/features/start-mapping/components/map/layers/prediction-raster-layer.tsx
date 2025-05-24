import {
  ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
  ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  PREDICTION_IMAGERY_SOURCE,
  TILE_BOUNDARY_LAYER_ID,
} from "@/config";
import { TileServiceType } from "@/enums";
import { PredictionImagerySource } from "@/enums/start-mapping";
import { useDynamicMapLayer } from "@/hooks/use-map-layer";
import {
  Map,
  RasterLayerSpecification,
  RasterSourceSpecification,
} from "maplibre-gl";
import { useMemo } from "react";

export const PredictionRasterLayer = ({
  map,
  predictionImagerySource,
  tileServiceType,
  layerId,
  sourceURL,
  isOpenAerialMap,
}: {
  map: Map | null;
  predictionImagerySource: PredictionImagerySource;
  tileServiceType: TileServiceType;
  layerId: string;
  sourceURL: string;
  isOpenAerialMap: boolean;
}) => {
  const sourceId = `${PREDICTION_IMAGERY_SOURCE}-${predictionImagerySource}`;

  const sourceSpec: RasterSourceSpecification = useMemo(
    () =>
      tileServiceType === TileServiceType.TILEJSON || isOpenAerialMap
        ? {
            type: "raster",
            url: sourceURL,
            tileSize: 256,
          }
        : {
            type: "raster",
            tiles: [sourceURL],
            tileSize: 256,
          },
    [sourceURL, tileServiceType],
  );

  const layerSpec: RasterLayerSpecification = useMemo(
    () => ({
      id: layerId,
      type: "raster",
      source: sourceId,
      layout: {
        visibility: "visible",
      },
    }),
    [layerId, sourceId],
  );

  /**
   * Use the dynamic map layer hook to add the prediction imagery layer to the map.
   */
  useDynamicMapLayer(
    map,
    sourceId,
    layerId,
    sourceSpec,
    layerSpec,
    [predictionImagerySource, tileServiceType, isOpenAerialMap, sourceURL],
    true,
    /**
     * Place the prediction imagery layer below the predictedfeatures layers and also tile boundary layer.
     * doesn't rerender after accepting or rejecting...
     */
    [
      ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
      ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
      TILE_BOUNDARY_LAYER_ID,
    ],
  );
  return null;
};
