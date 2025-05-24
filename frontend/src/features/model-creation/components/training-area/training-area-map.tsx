import useDebounce from "@/hooks/use-debounce";
import { ControlsPosition, DrawingModes } from "@/enums";
import { LngLatBounds, Map } from "maplibre-gl";
import { geojsonToWKT } from "@terraformer/wkt";
import { PaginatedTrainingArea, TileJSON } from "@/types";
import { MapComponent, MapCursorToolTip } from "@/components/map";
import { Polygon } from "geojson";
import { RefObject, useCallback, useEffect, useState } from "react";
import { TerraDraw } from "terra-draw";
import {
  useCreateTrainingArea,
  useGetTrainingDatasetLabels,
} from "@/features/model-creation/hooks/use-training-areas";
import {
  MAP_STYLES_PREFIX,
  MAX_TRAINING_AREA_SIZE,
  MIN_TRAINING_AREA_SIZE,
  MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS,
} from "@/config";
import {
  calculateGeoJSONArea,
  featureIsWithinBounds,
  formatAreaInAppropriateUnit,
  showSuccessToast,
  showWarningToast,
  snapGeoJSONPolygonToClosestTile,
  validateGeoJSONArea,
} from "@/utils";
import {
  TrainingAreasLayers,
  TrainingAreasLabelsLayers,
  MaskBoundsLayers,
} from "@/features/model-creation/components/map-layers";
import { useMapStore } from "@/store/map-store";

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
  terraDraw,
  mapContainerRef,
  trainingAreaIsPending,
  OAMData,
  trainingDatasetOffset,
}: {
  tileJSONURL: string;
  data?: PaginatedTrainingArea;
  trainingDatasetId: number;
  offset: number;
  map: Map | null;
  drawingMode: DrawingModes;
  setDrawingMode: (newMode: DrawingModes) => void;
  terraDraw?: TerraDraw;
  mapContainerRef: RefObject<HTMLDivElement> | null;
  trainingAreaIsPending: boolean;
  OAMData: TileJSON;
  trainingDatasetOffset: { x: number; y: number };
}) => {
  // Training Areas
  const trainingAreasOutlineLayerId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-area-layer`;
  const trainingAreasFillLayerId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-area-fill-layer`;
  const trainingAreasSourceId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-area-source`;
  // Trainings Labels
  const trainingAreasLabelsSourceId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-labels-source`;
  const trainingAreasLabelsFillLayerId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-labels-fill-layer`;
  const trainingAreasLabelsOutlineLayerId = `${MAP_STYLES_PREFIX}-dataset-${trainingDatasetId}-training-labels-outline-layer`;

  const [mapBounds, setMapBounds] = useState<LngLatBounds | null>(null);
  const [tooltipIsVisible, setTooltipVisible] = useState<boolean>(false);
  const [bbox, setBbox] = useState<string>("");
  const currentZoom = useMapStore((state) => state.zoom);

  const [featureArea, setFeatureArea] = useState<number>(0);

  const debouncedBbox = useDebounce(bbox, DEBOUNCE_DELAY);

  const debouncedZoom = useDebounce(currentZoom.toString(), DEBOUNCE_DELAY);

  const { data: labels, isPending: trainingAreasLabelsIsPending } =
    useGetTrainingDatasetLabels(
      trainingDatasetId,
      debouncedBbox,
      Number(debouncedZoom),
    );

  const createTrainingArea = useCreateTrainingArea({
    datasetId: Number(trainingDatasetId),
    offset,
  });

  const updateBbox = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    setMapBounds(bounds);
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
          showWarningToast(
            `Area is too small or too large. Please adjust the area to meet the size requirements.`,
          );
          terraDraw.clear();
          return;
        }
        // Don't accept the drawing if it's outside the bbox of the OAM imagery
        if (OAMData?.bounds) {
          if (!featureIsWithinBounds(OAMData.bounds, drawnFeature)) {
            showWarningToast(
              "The drawn polygon extends beyond the OAM bounds. Please ensure the training area is within the specified bounds.",
            );
            terraDraw.clear();
            return;
          }
        }

        snapGeoJSONPolygonToClosestTile(drawnFeature.geometry as Polygon);
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
  }, [terraDraw, drawingMode, setDrawingMode, OAMData]);

  const showLabelsToolTip = currentZoom >= 14 && currentZoom < 18;

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
      openAerialMap={!trainingAreaIsPending}
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
      layerControlLayers={[
        ...(labels && labels?.features.length > 0
          ? [
              {
                value: "Training Labels",
                subLayers: [
                  trainingAreasLabelsFillLayerId,
                  trainingAreasLabelsOutlineLayerId,
                ],
              },
            ]
          : []),
        ...(data?.results?.features?.length
          ? [
              {
                value: "Training Areas",
                subLayers: [
                  trainingAreasOutlineLayerId,
                  trainingAreasFillLayerId,
                ],
              },
            ]
          : []),
      ]}
    >
      {!trainingAreaIsPending && (
        <TrainingAreasLayers
          map={map}
          features={data?.results.features}
          trainingAreasFillLayerId={trainingAreasFillLayerId}
          trainingAreasOutlineLayerId={trainingAreasOutlineLayerId}
          trainingAreasSourceId={trainingAreasSourceId}
        />
      )}

      {!trainingAreasLabelsIsPending &&
      currentZoom >= MIN_ZOOM_LEVEL_FOR_TRAINING_AREA_LABELS ? (
        <TrainingAreasLabelsLayers
          map={map}
          features={labels?.features}
          trainingAreasLabelsFillLayerId={trainingAreasLabelsFillLayerId}
          trainingAreasLabelsOutlineLayerId={trainingAreasLabelsOutlineLayerId}
          trainingAreasLabelsSourceId={trainingAreasLabelsSourceId}
          trainingDatasetOffset={trainingDatasetOffset}
        />
      ) : null}
      {OAMData?.bounds && mapBounds && (
        <MaskBoundsLayers
          map={map}
          mapBounds={mapBounds}
          OAMBounds={OAMData.bounds}
        />
      )}

      {map && (
        <MapCursorToolTip
          color={getTooltipColor()}
          map={map}
          showTooltip={
            tooltipIsVisible ||
            Boolean(drawingMode === DrawingModes.RECTANGLE || showLabelsToolTip)
          }
          dependencies={[drawingMode]}
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
      )}
    </MapComponent>
  );
};

export default TrainingAreaMap;
