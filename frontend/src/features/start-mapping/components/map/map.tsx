import useScreenSize from "@/hooks/use-screen-size";
import { ControlsPosition, DrawingModes, TileServiceType, ToolTipPlacement } from "@/enums";
import { LngLatBoundsLike, Map } from "maplibre-gl";
import { Legend, PredictedFeatureActionPopup } from "@/features/start-mapping/components";
import { DrawControl, MapComponent, MapCursorToolTip } from "@/components/map";
import { RefObject, useEffect, useMemo } from "react";

import { TileJSON, TModelPredictionFeature } from "@/types";
import {
  MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION,
  PREDICTION_IMAGERY_LAYER_ID,
} from "@/config";
import bbox from "@turf/bbox";
import { AllPredictionsLayer } from "@/features/start-mapping/components/map/layers";
import { PredictedFeatureStatus, PredictionImagerySource } from "@/enums/start-mapping";
import { useMapStore } from "@/store/map-store";
import { PredictionRasterLayer } from "./layers/prediction-raster-layer";
import { extractTileJSONURL, OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN } from "@/utils";
import { useInitialHashFit } from "@/hooks/use-map-hash-sync";
import { TerraDraw } from "terra-draw";
import { ToolTip } from "@/components/ui/tooltip";
import { FileUploadIcon } from "@/components/ui/icons";

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
  handleDrawingStateChange,
  setDrawingMode,
  terraDraw,
  isOfflineMode,
  hasDrawnAOI,
  handleAOIDelete,
  openFileUploadDialog,
}: {
  trainingId: number;
  map: Map | null;
  mapContainerRef: RefObject<HTMLDivElement | null>;
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
  handleDrawingStateChange: (isDrawing: boolean) => void;
  setDrawingMode: (mode: DrawingModes) => void;
  terraDraw?: TerraDraw;
  isOfflineMode: boolean;
  hasDrawnAOI?: boolean;
  handleAOIDelete?: () => void;
  openFileUploadDialog?: () => void;
}) => {
  const { isSmallViewport } = useScreenSize();
  const currentZoom = useMapStore((state) => state.zoom);
  const untouchedPredictedFeatures = useMemo(
    () =>
      modelPredictions.filter(
        (feature) => feature.properties.status === PredictedFeatureStatus.UNTOUCHED,
      ),
    [modelPredictions],
  );
  const { hadHashOnLoad } = useInitialHashFit(map);

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

    /**
     * Sync the map hash with the current map state.
     */
    if (hadHashOnLoad) return;

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
    hadHashOnLoad,
  ]);

  /**
   * It is used to show a tooltip when the user is zoomed out too far to start mapping.
   */
  const shouldShowTooltip = currentZoom < MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION;

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
  }, [map, shouldShowTooltip]);

  const predictionImageryLayerId = useMemo(() => {
    return `${PREDICTION_IMAGERY_LAYER_ID}-${predictionImagerySource}`;
  }, [predictionImagerySource]);

  /**
   * Check if the tile server URL is an OpenAerialMap tile server URL.
   */
  const { sourceURL, isOpenAerialMap } = useMemo(() => {
    const openAerial = OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN.test(tileServerURL);
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
        {
          value: "Prediction Imagery",
          subLayers: [predictionImageryLayerId],
        },
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
      <div className={"absolute top-40 left-3 map-elements-z-index hidden md:block"}>
        {terraDraw && map && (
          <DrawControl
            terraDraw={terraDraw}
            drawingMode={DrawingModes.POLYGON}
            setDrawingMode={setDrawingMode}
            onDrawingStateChange={handleDrawingStateChange}
            drawingIsActive={isOfflineMode}
            showDeleteButton={hasDrawnAOI}
            onDelete={handleAOIDelete}
          />
        )}
      </div>
      {terraDraw && map && (
        <div
          className={`absolute ${hasDrawnAOI ? "top-64" : "top-52"} left-3 map-elements-z-index hidden md:block`}
        >
          <ToolTip
            content={
              !hasDrawnAOI ? "Upload AOI" : "AOI already uploaded, delete to upload a new one"
            }
            placement={ToolTipPlacement.RIGHT}
          >
            <button
              className={`p-1.5 flex items-center justify-center transition-colors duration-200 bg-white`}
              onClick={openFileUploadDialog}
              disabled={hasDrawnAOI}
            >
              <FileUploadIcon className={`icon-lg transition-colors duration-200`} />
            </button>
          </ToolTip>
        </div>
      )}
      {modelPredictionsExist && !isSmallViewport && <Legend />}
    </MapComponent>
  );
};
