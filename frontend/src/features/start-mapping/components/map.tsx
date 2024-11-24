import { useMap } from "@/app/providers/map-provider";
import { MapComponent } from "@/components/map";
import { useMapLayers } from "@/hooks/use-map-layer";

import {
  Feature,
  GeoJSONType,
  TileJSON,
  TModelPredictions,
  TTrainingDataset,
} from "@/types";
import {
  ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
  ACCEPTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  ACCEPTED_MODEL_PREDICTIONS_SOURCE_ID,
  ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
  ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  ALL_MODEL_PREDICTIONS_SOURCE_ID,
  extractTileJSONURL,
  REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
  REJECTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
  REJECTED_MODEL_PREDICTIONS_SOURCE_ID,
  showErrorToast,
} from "@/utils";
import { GeoJSONSource } from "maplibre-gl";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import PredictedFeatureActionPopup from "./popup";
import { FullScreenIcon } from "@/components/ui/icons";
import { ToolTip } from "@/components/ui/tooltip";
import { TModelPredictionsConfig } from "../api/get-model-predictions";

const StartMappingMapComponent = ({
  trainingDataset,
  modelPredictions,
  setModelPredictions,
  trainingConfig,
  oamTileJSONIsError,
  oamTileJSON,
  oamTileJSONError,
}: {
  trainingDataset?: TTrainingDataset;
  modelPredictions: TModelPredictions;
  setModelPredictions: Dispatch<
    SetStateAction<{ all: Feature[]; accepted: Feature[]; rejected: Feature[] }>
  >;
  trainingConfig: TModelPredictionsConfig;
  oamTileJSONIsError: boolean;
  oamTileJSON: TileJSON;
  oamTileJSONError: any;
}) => {
  const tileJSONURL = extractTileJSONURL(trainingDataset?.source_imagery ?? "");
  const { map } = useMap();
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const fitToTMSBounds = useCallback(() => {
    if (!map || !oamTileJSON?.bounds) return;
    map?.fitBounds(oamTileJSON?.bounds);
  }, [map, oamTileJSON?.bounds]);

  useEffect(() => {
    if (!oamTileJSONIsError) return;
    showErrorToast(undefined, "Error loading training dataset");
  }, [oamTileJSONIsError, oamTileJSONError]);

  useEffect(() => {
    if (!map || !oamTileJSON?.bounds || oamTileJSONIsError) return;
    fitToTMSBounds();
  }, [map, fitToTMSBounds, oamTileJSONIsError, oamTileJSON]);

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

  const renderPopup = useMemo(
    () => (
      <PredictedFeatureActionPopup
        event={selectedEvent}
        selectedFeature={selectedFeature}
        setModelPredictions={setModelPredictions}
        modelPredictions={modelPredictions}
        source_imagery={trainingDataset?.source_imagery as string}
        trainingId={trainingDataset?.id as number}
        trainingConfig={trainingConfig}
      />
    ),
    [selectedEvent, trainingDataset],
  );

  return (
    <MapComponent
      showCurrentZoom
      layerControl
      controlsLocation="top-left"
      showLegend
      openAerialMap
      oamTileJSONURL={tileJSONURL}
      basemaps
      layerControlLayers={[
        ...(modelPredictions.accepted.length > 0
          ? [
              {
                value: "Accepted Predictions",
                subLayers: [
                  ACCEPTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
                  ACCEPTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
                ],
              },
            ]
          : []),
        ...(modelPredictions.rejected.length > 0
          ? [
              {
                value: "Rejected Predictions",
                subLayers: [
                  REJECTED_MODEL_PREDICTIONS_FILL_LAYER_ID,
                  REJECTED_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
                ],
              },
            ]
          : []),
        ...(modelPredictions.all.length > 0
          ? [
              {
                value: "Prediction Results",
                subLayers: [
                  ALL_MODEL_PREDICTIONS_FILL_LAYER_ID,
                  ALL_MODEL_PREDICTIONS_OUTLINE_LAYER_ID,
                ],
              },
            ]
          : []),
      ]}
    >
      {showPopup && renderPopup}
      <ToolTip content={"Fit to TMS Bounds"}>
        <button
          className="absolute left-3 top-28 bg-white z-[1] p-1.5"
          onClick={fitToTMSBounds}
        >
          <FullScreenIcon className="icon-lg" />
        </button>
      </ToolTip>
    </MapComponent>
  );
};

export default StartMappingMapComponent;
