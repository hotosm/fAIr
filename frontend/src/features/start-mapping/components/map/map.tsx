import PredictedFeatureActionPopup from "@/features/start-mapping/components/feature-popup";
import useScreenSize from "@/hooks/use-screen-size";
import { ControlsPosition } from "@/enums";
import { extractTileJSONURL, showErrorToast } from "@/utils";
import { GeoJSONSource, LngLatBoundsLike, Map } from "maplibre-gl";
import { Legend } from "@/features/start-mapping/components";
import { MapComponent, MapCursorToolTip } from "@/components/map";
import { useMapLayers } from "@/hooks/use-map-layer";
import { useToolTipVisibility } from "@/hooks/use-tooltip-visibility";
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  GeoJSONType,
  TileJSON,
  TModelPredictionFeature,
  TModelPredictions,
  TTrainingDataset,
} from "@/types";
import {
  TOAST_NOTIFICATIONS,
  ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
  ACCEPTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  ACCEPTED_MODEL_PREDICTIONS_SOURCE_ID,
  ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
  ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  ALL_MODEL_PREDICTIONS_SOURCE_ID,
  MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION,
  MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION,
  REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
  REJECTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  REJECTED_MODEL_PREDICTIONS_SOURCE_ID,
} from "@/constants";

export const StartMappingMapComponent = ({
  trainingDataset,
  modelPredictions,
  setModelPredictions,
  oamTileJSONIsError,
  oamTileJSON,
  oamTileJSONError,
  modelPredictionsExist,
  map,
  mapContainerRef,
  currentZoom,
  layers,
  tmsBounds,
}: {
  trainingDataset?: TTrainingDataset;
  modelPredictions: TModelPredictions;
  setModelPredictions: Dispatch<
    SetStateAction<{
      all: TModelPredictionFeature[];
      accepted: TModelPredictionFeature[];
      rejected: TModelPredictionFeature[];
    }>
  >;

  oamTileJSONIsError: boolean;
  oamTileJSON: TileJSON;
  oamTileJSONError: any;
  modelPredictionsExist: boolean;
  map: Map | null;
  currentZoom: number;
  mapContainerRef: RefObject<HTMLDivElement>;
  layers: {
    value: string;
    subLayers: string[];
  }[];
  tmsBounds: LngLatBoundsLike;
}) => {
  const tileJSONURL = extractTileJSONURL(trainingDataset?.source_imagery ?? "");
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const { isSmallViewport } = useScreenSize();

  const { tooltipPosition, tooltipVisible } = useToolTipVisibility(map, [
    currentZoom,
  ]);

  useEffect(() => {
    if (!oamTileJSONIsError) return;
    showErrorToast(undefined, TOAST_NOTIFICATIONS.trainingDataset.error);
  }, [oamTileJSONIsError, oamTileJSONError]);

  useEffect(() => {
    if (!map || !tmsBounds || oamTileJSONIsError) return;
    map.fitBounds(tmsBounds);
  }, [map, tmsBounds, oamTileJSONIsError, oamTileJSON]);

  // Add the map layers
  useMapLayers(
    // layers
    [
      // accepted
      {
        id: ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
        type: "fill",
        source: ACCEPTED_MODEL_PREDICTIONS_SOURCE_ID,
        paint: {
          "fill-color": "#23C16B",
          "fill-opacity": 0.2,
        },
        layout: { visibility: "visible" },
      },
      {
        id: ACCEPTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
        type: "line",
        source: ACCEPTED_MODEL_PREDICTIONS_SOURCE_ID,
        paint: {
          "line-color": "#23C16B",
          "line-width": 2,
        },
        layout: { visibility: "visible" },
      },
      // rejected
      {
        id: REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
        type: "fill",
        source: REJECTED_MODEL_PREDICTIONS_SOURCE_ID,
        paint: {
          "fill-color": "#D63F40",
          "fill-opacity": 0.2,
        },
        layout: { visibility: "visible" },
      },
      {
        id: REJECTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
        type: "line",
        source: REJECTED_MODEL_PREDICTIONS_SOURCE_ID,
        paint: {
          "line-color": "#D63F40",
          "line-width": 2,
        },
        layout: { visibility: "visible" },
      },
      // all
      {
        id: ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
        type: "fill",
        source: ALL_MODEL_PREDICTIONS_SOURCE_ID,
        paint: {
          "fill-color": "#A243DC",
          "fill-opacity": 0.2,
        },
        layout: { visibility: "visible" },
      },
      {
        id: ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
        type: "line",
        source: ALL_MODEL_PREDICTIONS_SOURCE_ID,
        paint: {
          "line-color": "#A243DC",
          "line-width": 2,
        },
        layout: { visibility: "visible" },
      },
    ],
    // sources
    [
      {
        id: ACCEPTED_MODEL_PREDICTIONS_SOURCE_ID,
        spec: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
      },
      {
        id: REJECTED_MODEL_PREDICTIONS_SOURCE_ID,
        spec: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
      },
      {
        id: ALL_MODEL_PREDICTIONS_SOURCE_ID,
        spec: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
      },
    ],
    map,
  );

  const updateLayers = useCallback(() => {
    if (map) {
      if (map.getSource(ACCEPTED_MODEL_PREDICTIONS_SOURCE_ID)) {
        const source = map.getSource(
          ACCEPTED_MODEL_PREDICTIONS_SOURCE_ID,
        ) as GeoJSONSource;
        source.setData({
          type: "FeatureCollection",
          features: modelPredictions.accepted,
        } as GeoJSONType);
      }

      if (map.getSource(REJECTED_MODEL_PREDICTIONS_SOURCE_ID)) {
        const source = map.getSource(
          REJECTED_MODEL_PREDICTIONS_SOURCE_ID,
        ) as GeoJSONSource;
        source.setData({
          type: "FeatureCollection",
          features: modelPredictions.rejected,
        } as GeoJSONType);
      }

      if (map.getSource(ALL_MODEL_PREDICTIONS_SOURCE_ID)) {
        const source = map.getSource(
          ALL_MODEL_PREDICTIONS_SOURCE_ID,
        ) as GeoJSONSource;
        source.setData({
          type: "FeatureCollection",
          features: modelPredictions.all,
        } as GeoJSONType);
      }
    }
  }, [map, modelPredictions]);

  useEffect(() => {
    if (!map) return;
    updateLayers();
  }, [map, updateLayers, modelPredictions]);

  useEffect(() => {
    if (!map) return;

    const layerIds = [
      ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
      ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
      REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
    ];

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const handleClick = (e: any) => {
      setShowPopup(true);
      setSelectedEvent(e);
      setSelectedFeature(e.features && e.features[0]);
    };

    layerIds.forEach((layerId) => {
      map.on("mouseenter", layerId, handleMouseEnter);
      map.on("mouseleave", layerId, handleMouseLeave);
      map.on("click", layerId, handleClick);
    });
    return () => {
      layerIds.forEach((layerId) => {
        map.off("mouseenter", layerId, handleMouseEnter);
        map.off("mouseleave", layerId, handleMouseLeave);
        map.off("click", layerId, handleClick);
      });
    };
  }, [map]);

  const showTooltip =
    currentZoom < MIN_ZOOM_LEVEL_FOR_START_MAPPING_PREDICTION && tooltipVisible;
  return (
    <MapComponent
      controlsPosition={ControlsPosition.TOP_LEFT}
      oamTileJSONURL={tileJSONURL}
      showTileBoundaries
      fitToBounds={!isSmallViewport}
      bounds={tmsBounds}
      mapContainerRef={mapContainerRef}
      currentZoom={currentZoom}
      map={map}
      zoomControls={!isSmallViewport}
      layerControl={!isSmallViewport}
      layerControlLayers={layers}
      openAerialMap
      basemaps
      showCurrentZoom={!isSmallViewport}
    >
      {showPopup && (
        <PredictedFeatureActionPopup
          event={selectedEvent}
          selectedFeature={selectedFeature}
          setModelPredictions={setModelPredictions}
          modelPredictions={modelPredictions}
          source_imagery={trainingDataset?.source_imagery as string}
          trainingId={trainingDataset?.id as number}
          map={map}
        />
      )}
      <MapCursorToolTip
        tooltipVisible={showTooltip && !isSmallViewport}
        color={"bg-primary"}
        tooltipPosition={tooltipPosition}
      >
        {MINIMUM_ZOOM_LEVEL_INSTRUCTION_FOR_PREDICTION}
      </MapCursorToolTip>
      {map && modelPredictionsExist && !isSmallViewport && <Legend map={map} />}
    </MapComponent>
  );
};
