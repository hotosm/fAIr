import useScreenSize from "@/hooks/use-screen-size";
import { ControlsPosition, TileServiceType } from "@/enums";
import { LngLatBoundsLike, Map } from "maplibre-gl";
import {
  Legend,
  PredictedFeatureActionPopup,
} from "@/features/start-mapping/components";
import { MapComponent, MapCursorToolTip } from "@/components/map";
import { RefObject, useEffect, useMemo } from "react";

import { TileJSON, TModelPredictionFeature } from "@/types";
import {
  MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION,
  PREDICTION_IMAGERY_LAYER_ID,
} from "@/config";
import bbox from "@turf/bbox";
import { AllPredictionsLayer } from "@/features/start-mapping/components/map/layers";
import {
  PredictedFeatureStatus,
  PredictionImagerySource,
} from "@/enums/start-mapping";
import { useMapStore } from "@/store/map-store";
import { PredictionRasterLayer } from "./layers/prediction-raster-layer";
import {
  extractTileJSONURL,
  OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN,
} from "@/utils";

export const StartMappingMapComponent = ({
  map,
  mapContainerRef,
  trainingId,
  modelInfoRequestIsPending,
  predictionImagerySource,
  predictionImageryType,
  tileJSONMetadata,
  modelPredictionsExist,
  modelPredictions,
  updateFeatureStatus,
  tileServerURL,
  layers,
}: {
  trainingId: number;
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement>;
  layers: {
    value: string;
    subLayers: string[];
  }[];
  modelInfoRequestIsPending: boolean;
  predictionImagerySource: PredictionImagerySource;
  predictionImageryType: TileServiceType;
  tileJSONMetadata: TileJSON | null;
  modelPredictionsExist: boolean;
  modelPredictions: TModelPredictionFeature[];
  updateFeatureStatus: (
    id: number,
    status: PredictedFeatureStatus,
    updatedProperties: Partial<TModelPredictionFeature["properties"]>,
  ) => void;
  tileServerURL: string;
}) => {
  const { isSmallViewport } = useScreenSize();
  const currentZoom = useMapStore.getState().zoom;

  const untouchedPredictedFeatures = useMemo(
    () =>
      modelPredictions.filter(
        (feature) =>
          feature.properties.status === PredictedFeatureStatus.UNTOUCHED,
      ),
    [modelPredictions],
  );

  useEffect(() => {
    if (
      !map ||
      !tileJSONMetadata?.bounds ||
      modelInfoRequestIsPending ||
      /**
       * Zoom to the bounds of the tileJSON if the user has not selected the default model imagery.
       */
      predictionImagerySource === PredictionImagerySource.Kontour
    )
      return;

    // if there are predictions that the user hasn't interacted with, zoom to them.
    if (untouchedPredictedFeatures.length > 0) {
      // get the bbox of the features with turf.
      map.fitBounds(
        bbox({
          type: "FeatureCollection",
          features: untouchedPredictedFeatures,
        }) as LngLatBoundsLike,
      );
    } else {
      map.fitBounds(tileJSONMetadata.bounds);
    }
  }, [
    map,
    tileJSONMetadata?.bounds,
    modelInfoRequestIsPending,
    predictionImagerySource,
  ]);

  /**
   * It is used to show a tooltip when the user is zoomed out too far to start mapping.
   */
  const shouldShowTooltip =
    currentZoom < MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION;

  const memoizedToolTip = useMemo(() => {
    if (!map) return null;

    return (
      <MapCursorToolTip
        color="bg-primary"
        map={map}
        showTooltip={shouldShowTooltip}
        minZoom={MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION}
      >
        {MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION}
      </MapCursorToolTip>
    );
  }, [map, currentZoom]);

  const predictionImageryLayerId = useMemo(() => {
    return `${PREDICTION_IMAGERY_LAYER_ID}-${predictionImagerySource}`;
  }, [predictionImagerySource]);

  /**
   * Check if the tile server URL is an OpenAerialMap tile server URL.
   */
  const { sourceURL, isOpenAerialMap } = useMemo(() => {
    const openAerial =
      OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN.test(tileServerURL);
    return {
      isOpenAerialMap: openAerial,
      sourceURL: openAerial ? extractTileJSONURL(tileServerURL) : tileServerURL,
    };
  }, [tileServerURL]);

  return (
    <MapComponent
      controlsPosition={ControlsPosition.TOP_LEFT}
      showTileBoundaries
      fitToBounds={!isSmallViewport && !!tileJSONMetadata?.bounds}
      bounds={tileJSONMetadata?.bounds}
      mapContainerRef={mapContainerRef}
      map={map}
      zoomControls={!isSmallViewport}
      layerControl={!isSmallViewport}
      layerControlLayers={[
        ...layers,
        ...(predictionImagerySource !== PredictionImagerySource.ModelDefault
          ? [
              {
                value: "Prediction Imagery",
                subLayers: [predictionImageryLayerId],
              },
            ]
          : []),
      ]}
      basemaps
      showCurrentZoom={!isSmallViewport}
    >
      {map && (
        <PredictedFeatureActionPopup
          trainingId={trainingId}
          map={map}
          features={modelPredictions}
          updateFeatureStatus={updateFeatureStatus}
        />
      )}

      {!modelInfoRequestIsPending && map && (
        <AllPredictionsLayer map={map} features={modelPredictions} />
      )}
      {map && sourceURL.length > 0 && (
        <PredictionRasterLayer
          map={map}
          predictionImagerySource={predictionImagerySource}
          tileServiceType={predictionImageryType}
          layerId={predictionImageryLayerId}
          sourceURL={sourceURL}
          isOpenAerialMap={isOpenAerialMap}
        />
      )}
      {memoizedToolTip}
      {modelPredictionsExist && !isSmallViewport && <Legend />}
    </MapComponent>
  );
};
