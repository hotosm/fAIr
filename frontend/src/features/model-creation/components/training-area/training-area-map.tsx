import useDebounce from "@/hooks/use-debounce";
import { ControlsPosition, DrawingModes } from "@/enums";
import { GeoJSONSource, Map } from "maplibre-gl";
import { geojsonToWKT } from "@terraformer/wkt";
import { GeoJSONType, PaginatedTrainingArea } from "@/types";
import { MapComponent, MapCursorToolTip } from "@/components/map";
import { RefObject, useCallback, useEffect, useState } from "react";
import { TerraDraw } from "terra-draw";
import { useMapLayers } from "@/hooks/use-map-layer";
import { useToolTipVisibility } from "@/hooks/use-tooltip-visibility";
import {
  useCreateTrainingArea,
  useGetTrainingDatasetLabels,
} from "@/features/model-creation/hooks/use-training-areas";
import {
  MAP_STYLES_PREFIX,
  MAX_TRAINING_AREA_SIZE,
  MIN_TRAINING_AREA_SIZE,
  TRAINING_AREAS_AOI_FILL_COLOR,
  TRAINING_AREAS_AOI_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
  TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
  TRAINING_AREAS_AOI_OUTLINE_COLOR,
  TRAINING_AREAS_AOI_OUTLINE_WIDTH,
  MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,
} from "@/constants";
import {
  calculateGeoJSONArea,
  formatAreaInAppropriateUnit,
  showSuccessToast,
  snapGeoJSONGeometryToClosestTile,
  validateGeoJSONArea,
} from "@/utils";

// Debounce delay in milliseconds.
const DEBOUNCE_DELAY: number = 300;

const TrainingAreaMap = ({
  tileJSONURL,
  data,
  trainingDatasetId,
  offset,
  map,
  drawingMode,
  setDrawingMode,
  currentZoom,
  terraDraw,
  mapContainerRef,
}: {
  tileJSONURL: string;
  data?: PaginatedTrainingArea;
  trainingDatasetId: number;
  offset: number;
  map: Map | null;
  drawingMode: DrawingModes;
  setDrawingMode: (newMode: DrawingModes) => void;
  currentZoom: number;
  terraDraw?: TerraDraw;
  mapContainerRef: RefObject<HTMLDivElement> | null;
}) => {
  const trainingAreasLayerId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-area-layer`;
  const trainingAreasFillLayerId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-area-fill-layer`;
  const trainingDatasetLabelsSourceId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-labels-source`;
  const trainingAreasSourceId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-area-source`;
  const trainingDatasetLabelsLayerId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-labels-fill-layer`;
  const trainingDatasetLabelsOutlineLayerId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-labels-outline-layer`;

  const [bbox, setBbox] = useState<string>("");

  const [featureArea, setFeatureArea] = useState<number>(0);

  const { setTooltipVisible, tooltipPosition, tooltipVisible } =
    useToolTipVisibility(map, [drawingMode, currentZoom]);

  const debouncedBbox = useDebounce(bbox, DEBOUNCE_DELAY);

  const debouncedZoom = useDebounce(currentZoom.toString(), DEBOUNCE_DELAY);

  const { data: labels } = useGetTrainingDatasetLabels(
    trainingDatasetId,
    debouncedBbox,
    Number(debouncedZoom),
  );

  const createTrainingArea = useCreateTrainingArea({
    datasetId: Number(trainingDatasetId),
    offset,
  });

  /**
   * Callbacks
   */

  useMapLayers(
    [
      {
        id: trainingDatasetLabelsLayerId,
        type: "fill",
        source: trainingDatasetLabelsSourceId,
        paint: {
          "fill-color": TRAINING_AREAS_AOI_LABELS_FILL_COLOR,
          "fill-opacity": TRAINING_AREAS_AOI_LABELS_FILL_OPACITY,
        },
        minzoom: MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,
        layout: { visibility: "visible" },
      },
      {
        id: trainingDatasetLabelsOutlineLayerId,
        type: "line",
        source: trainingDatasetLabelsSourceId,
        paint: {
          "line-color": TRAINING_AREAS_AOI_LABELS_OUTLINE_COLOR,
          "line-width": TRAINING_AREAS_AOI_LABELS_OUTLINE_WIDTH,
        },
        minzoom: MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,
        layout: { visibility: "visible" },
      },
      {
        id: trainingAreasFillLayerId,
        type: "fill",
        source: trainingAreasSourceId,
        paint: {
          "fill-color": TRAINING_AREAS_AOI_FILL_COLOR,
          "fill-opacity": TRAINING_AREAS_AOI_FILL_OPACITY,
        },
        layout: { visibility: "visible" },
      },
      {
        id: trainingAreasLayerId,
        type: "line",
        source: trainingAreasSourceId,
        paint: {
          "line-color": TRAINING_AREAS_AOI_OUTLINE_COLOR,
          "line-width": TRAINING_AREAS_AOI_OUTLINE_WIDTH,
        },
        layout: { visibility: "visible" },
      },
    ],
    [
      {
        id: trainingAreasSourceId,
        spec: {
          type: "geojson",
          data: data?.results as GeoJSONType,
        },
      },
      {
        id: trainingDatasetLabelsSourceId,
        spec: {
          type: "geojson",
          data: (labels as GeoJSONType) ?? {
            type: "FeatureCollection",
            features: [],
          },
        },
      },
    ],
    map,
  );

  // useLayerReorder(map, {
  //   featureLayerIds: [trainingDatasetLabelsOutlineLayerId, trainingDatasetLabelsLayerId, trainingAreasLayerId, trainingAreasFillLayerId,]
  // });

  const updateTrainingLabels = useCallback(() => {
    if (map) {
      if (map.getSource(trainingDatasetLabelsSourceId) && labels) {
        const source = map.getSource(
          trainingDatasetLabelsSourceId,
        ) as GeoJSONSource;
        source?.setData(labels as GeoJSONType);
      }
    }
  }, [map, labels]);

  const updateTrainingArea = useCallback(() => {
    if (map) {
      if (map.getSource(trainingAreasSourceId) && data?.results) {
        const source = map.getSource(trainingAreasSourceId) as GeoJSONSource;
        source.setData(data.results as GeoJSONType);
      }
    }
  }, [map, data?.results]);

  const updateBbox = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    const newBbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    setBbox(newBbox);
  }, [map]);

  /**
   * Effects
   */
  useEffect(() => {
    if (!map) return;
    map.on("moveend", updateBbox);
    return () => {
      map.off("moveend", updateBbox);
    };
  }, [map]);

  useEffect(() => {
    if (!data?.results) return;
    updateTrainingArea();
  }, [data?.results]);

  useEffect(() => {
    if (!labels) return;
    updateTrainingLabels();
  }, [labels]);

  /**
   * Drawing events and tooltip
   */
  useEffect(() => {
    if (!terraDraw || !map) return;

    const handleFeatureChange = () => {
      const snapshot = terraDraw.getSnapshot();
      const area = calculateGeoJSONArea(snapshot[snapshot.length - 1]);
      setFeatureArea(area);
    };
    const handleFinish = async () => {
      const snapshot = terraDraw.getSnapshot();
      setFeatureArea(0);
      setDrawingMode(DrawingModes.STATIC);
      setTooltipVisible(false);
      if (snapshot) {
        const drawnFeature = snapshot[snapshot.length - 1];
        // Don't accept the drawing if they don't meet the size criteria
        if (validateGeoJSONArea(drawnFeature)) {
          terraDraw.clear();
          return;
        }
        snapGeoJSONGeometryToClosestTile(drawnFeature.geometry);
        const wkt = geojsonToWKT(drawnFeature.geometry);
        await createTrainingArea.mutateAsync(
          { dataset: String(trainingDatasetId), geom: `SRID=4326;${wkt}` },
          {
            onSuccess: () =>
              showSuccessToast("Training area created successfully"),
          },
        );
        terraDraw.clear();
      }
    };

    terraDraw.on("change", handleFeatureChange);
    terraDraw.on("finish", handleFinish);
    return () => {
      terraDraw.off("change", handleFeatureChange);
      terraDraw.off("finish", handleFinish);
    };
  }, [terraDraw, drawingMode, setDrawingMode]);

  const showLabelsToolTip = currentZoom >= 14 && currentZoom < 18;

  const showTooltip =
    Boolean(drawingMode === DrawingModes.RECTANGLE || showLabelsToolTip) &&
    tooltipVisible;

  const getTooltipColor = () => {
    if (featureArea !== 0) {
      if (
        featureArea < MIN_TRAINING_AREA_SIZE ||
        featureArea > MAX_TRAINING_AREA_SIZE
      )
        return "bg-primary";
    }
    return "bg-black";
  };

  const getFeedbackMessage = () => {
    if (featureArea !== 0) {
      if (featureArea < MIN_TRAINING_AREA_SIZE)
        return "Area too small. Expand to meet minimum size requirement.";
      if (featureArea > MAX_TRAINING_AREA_SIZE)
        return "Area too large. Reduce to meet maximum size requirement.";
      if (
        featureArea < MIN_TRAINING_AREA_SIZE * 1.2 ||
        featureArea > MAX_TRAINING_AREA_SIZE * 0.8
      ) {
        return "Area is close to size limits. Adjust if needed before completing.";
      }
      return "Area within acceptable range. Release mouse to finish drawing.";
    } else if (showLabelsToolTip && drawingMode !== DrawingModes.RECTANGLE) {
      return "Zoom in up to zoom 18 to see the fetched labels.";
    }
    return;
  };

  return (
    <MapComponent
      openAerialMap
      oamTileJSONURL={tileJSONURL}
      controlsPosition={ControlsPosition.TOP_LEFT}
      drawControl
      showCurrentZoom
      layerControl
      showTileBoundaries
      basemaps
      map={map}
      terraDraw={terraDraw}
      drawingMode={drawingMode}
      setDrawingMode={setDrawingMode}
      mapContainerRef={mapContainerRef}
      currentZoom={currentZoom}
      layerControlLayers={[
        ...(data?.results?.features?.length
          ? [
              {
                value: "Training Areas",
                subLayers: [trainingAreasLayerId, trainingAreasFillLayerId],
              },
            ]
          : []),
        ...(labels && labels?.features.length > 0
          ? [
              {
                value: "Training Labels",
                subLayers: [
                  trainingDatasetLabelsLayerId,
                  trainingDatasetLabelsOutlineLayerId,
                ],
              },
            ]
          : []),
      ]}
    >
      <MapCursorToolTip
        tooltipVisible={showTooltip}
        color={getTooltipColor()}
        tooltipPosition={tooltipPosition}
      >
        {drawingMode === DrawingModes.RECTANGLE && (
          <p>
            {drawingMode === DrawingModes.RECTANGLE && featureArea === 0
              ? "Click and drag to draw a rectangle."
              : `Current area: ${formatAreaInAppropriateUnit(featureArea)}`}
          </p>
        )}
        <p>{getFeedbackMessage()}</p>
      </MapCursorToolTip>
    </MapComponent>
  );
};

export default TrainingAreaMap;
